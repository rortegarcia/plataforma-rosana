import {marketingSummary,marketingCsv} from './marketing.js';
import { visitorAnalytics } from './visitor-analytics.js';
// No customer data or credentials are returned by the public configuration route.
const products = {
 "memorias-postumas":{title:"Taller Memórias Póstumas de Brás Cubas",cents:4400},
 "fernando-pessoa":{title:"Taller Fernando Pessoa y sus heterónimos",cents:3000},
 "carlos-drummond-de-andrade":{title:"Taller de Carlos Drummond de Andrade",cents:3000},
 "miguel-hernandez":{title:"Taller Miguel Hernández",cents:3000},
  'book-student': {title:'Libro para alumnos', cents:1500},
  'book-teacher': {title:'Libro y tutoría para profesores', cents:2000},
  'cuentos-clarice-lispector': {title:'Taller de Clarice Lispector', cents:3000},
  'garcia-lorca': {title:'Taller García Lorca', cents:4400},
  'cien-anos-de-soledad': {title:'Taller Cien años de soledad', cents:2600},
};
export const response = (data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const ready=env=>Boolean(env.ANALYTICS_DB&&env.PAYPAL_CLIENT_ID&&env.PAYPAL_CLIENT_SECRET&&env.PAYPAL_WEBHOOK_ID&&env.PAYMENTS_ENABLED==='true');
const base=env=>env.PAYPAL_MODE==='sandbox'?'https://api-m.sandbox.paypal.com':'https://api-m.paypal.com';
export function cents(value){if(!/^\d+\.\d{2}$/.test(String(value)))throw Error('amount');return Number(String(value).replace('.',''));}
function decode(value){return Uint8Array.from(atob(value.replaceAll('-','+').replaceAll('_','/')),c=>c.charCodeAt(0));}
async function token(env){const r=await fetch(base(env)+'/v1/oauth2/token',{method:'POST',headers:{Authorization:'Basic '+btoa(env.PAYPAL_CLIENT_ID+':'+env.PAYPAL_CLIENT_SECRET),'Content-Type':'application/x-www-form-urlencoded'},body:'grant_type=client_credentials',signal:AbortSignal.timeout(12000)});if(!r.ok)throw Error('paypal');return (await r.json()).access_token;}
async function paypal(env,path,body,requestId){const r=await fetch(base(env)+path,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+await token(env),'Content-Type':'application/json',...(requestId?{'PayPal-Request-Id':requestId}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error('paypal');return r.json();}
const q=(env,sql,...args)=>env.ANALYTICS_DB.prepare(sql).bind(...args);
export async function recordRegistration(env,data){
  if(!env.ANALYTICS_DB)return; // Existing forms keep working before the database is connected.
  await q(env,'INSERT OR IGNORE INTO registrations (id,resend_id,kind,topic,title,customer_name,customer_email) VALUES (?,?,?,?,?,?,?)',data.id,data.resendId,data.kind,data.topic,data.title,data.name,data.email).run();
}
async function body(request){if(!request.headers.get('Content-Type')?.includes('application/json'))throw Error('invalid');const raw=await request.text();if(raw.length>200000)throw Error('invalid');return JSON.parse(raw);}
async function workshopRegistration(env,product,receipt){
  const parts=String(receipt||'').split('.');if(parts.length!==3||!/^[-a-z0-9]+$/.test(parts[0])||Number(parts[1])<Date.now()/1000||!env.REGISTRATION_SECRET)return null;
  const k=await crypto.subtle.importKey('raw',new TextEncoder().encode(env.REGISTRATION_SECRET),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const mac=new Uint8Array(await crypto.subtle.sign('HMAC',k,new TextEncoder().encode(parts[0]+'.'+parts[1])));
  const signed=btoa(String.fromCharCode(...mac)).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');
  if(signed!==parts[2])return null;
  return q(env,"SELECT id FROM registrations WHERE resend_id=? AND topic=? AND kind='workshop'",parts[0],product).first();
}
// Verify Access's signature, issuer, audience, expiry and owner email; a forged email header is insufficient.
export async function isOwner(request,env){
  if(!env.ACCESS_TEAM_DOMAIN||!env.ACCESS_AUD||!env.OWNER_EMAIL)return false;
  const issuer=env.ACCESS_TEAM_DOMAIN.replace(/\/$/,'');if(!/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(issuer))return false;
  try{
    const [h,p,s,...extra]=String(request.headers.get('Cf-Access-Jwt-Assertion')||'').split('.');if(extra.length||!s)return false;
    const header=JSON.parse(new TextDecoder().decode(decode(h))),claims=JSON.parse(new TextDecoder().decode(decode(p)));
    if(header.alg!=='RS256'||!header.kid||claims.iss!==issuer||!Number.isFinite(claims.exp)||claims.exp<=Date.now()/1000||(claims.nbf&&claims.nbf>Date.now()/1000)||claims.email?.toLowerCase()!==env.OWNER_EMAIL.toLowerCase()||!(Array.isArray(claims.aud)?claims.aud:[claims.aud]).includes(env.ACCESS_AUD))return false;
    const res=await fetch(issuer+'/cdn-cgi/access/certs',{signal:AbortSignal.timeout(10000)});if(!res.ok)return false;
    const jwk=(await res.json()).keys?.find(key=>key.kid===header.kid&&key.kty==='RSA');if(!jwk)return false;
    const key=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
    return crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,decode(s),new TextEncoder().encode(h+'.'+p));
  }catch{return false;}
}
async function orderRecord(env,id){return q(env,'SELECT o.id,p.id purchase_id,p.amount_cents,p.currency,p.product FROM paypal_orders o JOIN purchases p ON p.id=o.purchase_id WHERE o.id=?',id).first();}
export async function syncCapture(env,orderId,captureId){
  if(!/^[A-Z0-9]+$/.test(orderId)||!/^[A-Z0-9]+$/.test(captureId))throw Error('invalid');
  const order=await orderRecord(env,orderId);if(!order)throw Error('unknown');
  const cap=await paypal(env,'/v2/payments/captures/'+captureId);
  if(cap.id!==captureId||cap.supplementary_data?.related_ids?.order_id!==orderId||cap.amount?.currency_code!==order.currency||cents(cap.amount?.value)!==order.amount_cents)throw Error('mismatch');
  if(!['COMPLETED','PENDING','DECLINED','FAILED','REFUNDED','PARTIALLY_REFUNDED','REVERSED'].includes(cap.status))throw Error('status');
  await q(env,"INSERT INTO payments(id,order_id,amount_cents,currency,status) VALUES(?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET status=excluded.status,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now')",cap.id,order.id,order.amount_cents,order.currency,cap.status).run();
  return cap.status;
}
async function webhook(request,env){
  if(!ready(env))return response({error:'unavailable'},503);
  const event=await body(request);
  const verification=await paypal(env,'/v1/notifications/verify-webhook-signature',{
    auth_algo:request.headers.get('paypal-auth-algo'),cert_url:request.headers.get('paypal-cert-url'),transmission_id:request.headers.get('paypal-transmission-id'),transmission_sig:request.headers.get('paypal-transmission-sig'),transmission_time:request.headers.get('paypal-transmission-time'),webhook_id:env.PAYPAL_WEBHOOK_ID,webhook_event:event,
  });
  if(verification.verification_status!=='SUCCESS')return response({error:'signature'},403);
  const resource=event.resource||{};
  if(event.event_type==='PAYMENT.CAPTURE.REFUNDED'){
    if(!/^[A-Z0-9]+$/.test(resource.id||''))return response({error:'invalid'},400);
    const refund=await paypal(env,'/v2/payments/refunds/'+resource.id);
    const captureId=refund.links?.find(l=>l.rel==='up')?.href?.match(/\/captures\/([A-Z0-9]+)$/)?.[1];
    let payment=captureId&&await q(env,'SELECT * FROM payments WHERE id=?',captureId).first();
    if(captureId&&!payment){
      const capture=await paypal(env,'/v2/payments/captures/'+captureId);
      const orderId=capture.supplementary_data?.related_ids?.order_id;
      if(orderId&&await orderRecord(env,orderId)){await syncCapture(env,orderId,captureId);payment=await q(env,'SELECT * FROM payments WHERE id=?',captureId).first();}
    }
    if(!payment)return response({ignored:true});
    if(refund.status==='COMPLETED'&&refund.amount?.currency_code===payment.currency&&cents(refund.amount.value)<=payment.amount_cents){
      await q(env,'INSERT OR IGNORE INTO refunds(id,capture_id,amount_cents,currency) VALUES(?,?,?,?)',refund.id,captureId,cents(refund.amount.value),payment.currency).run();
      await syncCapture(env,payment.order_id,captureId);
    }
  }else if(event.event_type?.startsWith('PAYMENT.CAPTURE.')){
    const orderId=resource.supplementary_data?.related_ids?.order_id;
    if(orderId&&await orderRecord(env,orderId))await syncCapture(env,orderId,resource.id);
  }
  return response({received:true});
}
export async function privateRoute(request,env){
  const path=new URL(request.url).pathname;
  if(path==='/api/private-payments/config')return response({enabled:ready(env),...(ready(env)?{clientId:env.PAYPAL_CLIENT_ID}: {})});
  if(path==='/api/private-payments/context'){
    if(!ready(env))return response({error:'unavailable'},503);
    const receipt=new URL(request.url).searchParams.get('receipt');
    const id=String(receipt||'').split('.')[0];
    const reg=await q(env,'SELECT topic FROM registrations WHERE resend_id=?',id).first();
    if(!reg||!await workshopRegistration(env,reg.topic,receipt)||!products[reg.topic])return response({error:'invalid'},403);
    return response({product:reg.topic,title:products[reg.topic].title});
  }
  if(path==='/api/owner/marketing.csv'){if(!await isOwner(request,env))return response({error:'private'},403);if(request.method!=='GET')return response({error:'method'},405);return marketingCsv(env);}
  if(path==='/api/owner/summary'){
    if(!await isOwner(request,env))return response({error:'private'},403);
    if(request.method!=='GET')return response({error:'method'},405);
    if(!env.ANALYTICS_DB)return response({error:'database_not_connected'},503);
    const registrations=await q(env,'SELECT kind,topic,title,COUNT(*) total FROM registrations GROUP BY kind,topic,title').all();
    const payments=await q(env,"SELECT p.product,p.title,COUNT(*) total,SUM(pay.amount_cents) gross_cents FROM payments pay JOIN paypal_orders o ON o.id=pay.order_id JOIN purchases p ON p.id=o.purchase_id WHERE pay.status IN ('COMPLETED','REFUNDED','PARTIALLY_REFUNDED') GROUP BY p.product,p.title").all();
    const refunds=await q(env,'SELECT COALESCE(SUM(amount_cents),0) cents,COUNT(*) total FROM refunds').first();
    const recent=await q(env,"SELECT r.id,r.kind,r.title,r.customer_name,r.customer_email,r.created_at,EXISTS(SELECT 1 FROM purchases p JOIN paypal_orders o ON o.purchase_id=p.id JOIN payments pay ON pay.order_id=o.id WHERE p.registration_id=r.id AND pay.status='COMPLETED') paid FROM registrations r ORDER BY r.created_at DESC LIMIT 100").all();
    return response({marketing:await marketingSummary(env),traffic:await visitorAnalytics(env),registrations:registrations.results,payments:payments.results,refunds,recent:recent.results,automaticPayments:ready(env),note:'Solo se incluyen solicitudes registradas desde la activación y pagos del nuevo checkout. PayPal.me y pagos anteriores no se importan.'});
  }
  if(request.method!=='POST')return response({error:'method'},405);
  if(path==='/api/paypal/webhook')return webhook(request,env);
  if(request.headers.get('Origin')!==new URL(request.url).origin)return response({error:'origin'},403);
  if(!ready(env))return response({error:'unavailable'},503);
  const input=await body(request);
  if(path==='/api/private-payments/order'){
    const product=products[input.product];if(!product||!/^[-a-f0-9]{36}$/.test(input.reference||''))return response({error:'product'},400);
    let registration=null;
    if(!input.product.startsWith('book-')){registration=await workshopRegistration(env,input.product,input.receipt);if(!registration)return response({error:'registration_required'},403);}
    await q(env,'INSERT OR IGNORE INTO purchases(id,product,title,amount_cents,registration_id) VALUES(?,?,?,?,?)',input.reference,input.product,product.title,product.cents,registration?.id||null).run();
    const purchase=await q(env,'SELECT * FROM purchases WHERE id=?',input.reference).first();
    if(purchase.product!==input.product||purchase.registration_id!==(registration?.id||null))return response({error:'conflict'},409);
    const existing=await q(env,'SELECT id FROM paypal_orders WHERE purchase_id=?',purchase.id).first();if(existing)return response({id:existing.id});
    const order=await paypal(env,'/v2/checkout/orders',{intent:'CAPTURE',purchase_units:[{custom_id:purchase.id,description:product.title,amount:{currency_code:'EUR',value:(product.cents/100).toFixed(2)}}]},purchase.id);
    await q(env,'INSERT OR IGNORE INTO paypal_orders(id,purchase_id) VALUES(?,?)',order.id,purchase.id).run();
    return response({id:order.id});
  }
  if(path==='/api/private-payments/capture'){
    if(!/^[A-Z0-9]+$/.test(input.orderId||'')||!/^[-a-f0-9]{36}$/.test(input.reference||''))return response({error:'invalid'},400);
    const order=await orderRecord(env,input.orderId);if(!order||order.purchase_id!==input.reference)return response({error:'unknown'},403);
    let result;
    try{result=await paypal(env,'/v2/checkout/orders/'+order.id+'/capture',{},'capture-'+order.purchase_id);}catch{result=await paypal(env,'/v2/checkout/orders/'+order.id);}
    const cap=result.purchase_units?.[0]?.payments?.captures?.[0];if(!cap)return response({status:'pending'},202);
    const status=await syncCapture(env,order.id,cap.id);
    return response({status:status==='COMPLETED'?'completed':'pending'});
  }
  return response({error:'not_found'},404);
}
