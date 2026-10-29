export const marketingConsentVersion='2026-10-30-v1';
export const marketingConsentText='Quero receber por e-mail novidades e ofertas de Rosana Ortega sobre aulas, oficinas e materiais de idiomas. Posso cancelar a qualquer momento.';
export const marketingSchema="CREATE TABLE IF NOT EXISTS marketing_subscriptions (email TEXT PRIMARY KEY COLLATE NOCASE,name TEXT NOT NULL DEFAULT '',registration_id TEXT NOT NULL,consent_text TEXT NOT NULL,consent_version TEXT NOT NULL,source TEXT NOT NULL,consented_at TEXT NOT NULL,unsubscribed_at TEXT)";
async function ensure(env){if(!env.ANALYTICS_DB)throw Error('database');await env.ANALYTICS_DB.prepare(marketingSchema).run();}
export async function recordMarketingConsent(env,data){
 if(data.accepted!==true)return;
 await ensure(env);
 await env.ANALYTICS_DB.prepare("INSERT INTO marketing_subscriptions(email,name,registration_id,consent_text,consent_version,source,consented_at,unsubscribed_at) VALUES(?,?,?,?,?,?,?,NULL) ON CONFLICT(email) DO UPDATE SET name=excluded.name,registration_id=excluded.registration_id,consent_text=excluded.consent_text,consent_version=excluded.consent_version,source=excluded.source,consented_at=excluded.consented_at,unsubscribed_at=NULL").bind(data.email.trim().toLowerCase(),data.name||'',data.registrationId,marketingConsentText,marketingConsentVersion,data.source==='popup'?'popup':'test-page',new Date().toISOString()).run();
}
const encode=bytes=>btoa(String.fromCharCode(...new Uint8Array(bytes))).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');
const decode=value=>Uint8Array.from(atob(value.replaceAll('-','+').replaceAll('_','/')),c=>c.charCodeAt(0));
async function key(env,usage){return crypto.subtle.importKey('raw',new TextEncoder().encode(env.REGISTRATION_SECRET),{name:'HMAC',hash:'SHA-256'},false,[usage]);}
export async function unsubscribeToken(env,email){const value=encode(new TextEncoder().encode(email));return value+'.'+encode(await crypto.subtle.sign('HMAC',await key(env,'sign'),new TextEncoder().encode('marketing-unsubscribe:'+value)));}
export async function unsubscribeMarketing(request,env){
 const reply=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
 if(request.method!=='POST')return reply({error:'method'},405);
 if(request.headers.get('Origin')!==new URL(request.url).origin||!request.headers.get('Content-Type')?.includes('application/json'))return reply({error:'origin'},403);
 if(!env.REGISTRATION_SECRET||!env.ANALYTICS_DB)return reply({error:'unavailable'},503);
 try{const raw=await request.text();if(raw.length>2048)return reply({error:'invalid'},400);const input=JSON.parse(raw);
 const [value,signature,...extra]=String(input.token||'').split('.');
 if(extra.length||!value||!signature||!/^[-_a-zA-Z0-9]+$/.test(value)||!/^[-_a-zA-Z0-9]+$/.test(signature)||!await crypto.subtle.verify('HMAC',await key(env,'verify'),decode(signature),new TextEncoder().encode('marketing-unsubscribe:'+value)))return reply({error:'invalid'},403);
 const email=new TextDecoder().decode(decode(value));await ensure(env);
 await env.ANALYTICS_DB.prepare("UPDATE marketing_subscriptions SET unsubscribed_at=? WHERE email=?").bind(new Date().toISOString(),email).run();
 return reply({unsubscribed:true});
 }catch{return reply({error:'unavailable'},503);}
}
export async function marketingSummary(env){try{await ensure(env);const counts=await env.ANALYTICS_DB.prepare("SELECT COUNT(*) total,SUM(CASE WHEN unsubscribed_at IS NULL THEN 1 ELSE 0 END) active FROM marketing_subscriptions").first();const rows=await env.ANALYTICS_DB.prepare("SELECT email,name,consented_at,unsubscribed_at FROM marketing_subscriptions ORDER BY consented_at DESC LIMIT 100").all();return {available:true,total:counts.total,active:counts.active||0,recent:rows.results};}catch{return {available:false};}}
const csvCell=value=>{let text=String(value??'');if(/^[=+@\-\t\r]/.test(text))text="'"+text;return '"'+text.replaceAll('"','""')+'"';};
export async function marketingCsv(env){
 await ensure(env);const {results}=await env.ANALYTICS_DB.prepare("SELECT email,name,consented_at,consent_text,consent_version,source FROM marketing_subscriptions WHERE unsubscribed_at IS NULL ORDER BY consented_at DESC").all();
 const lines=[['Email','Nombre','Autorizado desde','Consentimiento','Version','Origen','Enlace de baja'].map(csvCell).join(',')];
 for(const row of results){const link='https://rosanaortega.com/preferencias-email?token='+encodeURIComponent(await unsubscribeToken(env,row.email));lines.push([row.email,row.name,row.consented_at,row.consent_text,row.consent_version,row.source,link].map(csvCell).join(','));}
 return new Response('\uFEFF'+lines.join('\r\n'),{headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="contactos-marketing-autorizados.csv"','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
}
