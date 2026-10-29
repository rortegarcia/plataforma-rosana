import {portugueseTests} from './portuguese-test-files.js';
export const portugueseTestTopic='Testes de nível de português';
const error=(code,status)=>Response.json({error:code},{status,headers:{'Cache-Control':'no-store'}});
export async function downloadPortugueseTest(request,env){
 if(request.method!=='GET')return error('method',405);
 if(!env.RESEND_API_KEY||!env.REGISTRATION_SECRET)return error('unavailable',503);
 const url=new URL(request.url),level=url.searchParams.get('level');
 if(!Object.hasOwn(portugueseTests,level||''))return error('level',404);
 const parts=String(url.searchParams.get('receipt')||'').split('.');
 if(parts.length!==3||!/^[-a-z0-9]+$/.test(parts[0])||!/^\d+$/.test(parts[1])||Number(parts[1])<=Date.now()/1000||!/^[A-Za-z0-9_-]+$/.test(parts[2]))return error('invalid',403);
 try{
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(env.REGISTRATION_SECRET),{name:'HMAC',hash:'SHA-256'},false,['verify']);
 const signature=Uint8Array.from(atob(parts[2].replaceAll('-','+').replaceAll('_','/')),c=>c.charCodeAt(0));
 if(!await crypto.subtle.verify('HMAC',key,signature,new TextEncoder().encode(parts[0]+'.'+parts[1])))return error('invalid',403);
 const res=await fetch('https://api.resend.com/emails/'+parts[0],{headers:{Authorization:'Bearer '+env.RESEND_API_KEY},signal:AbortSignal.timeout(12000)});
 if(!res.ok)return error('unavailable',503);
 const email=await res.json();
 if(email.subject!=='Solicitud de información — '+portugueseTestTopic||!email.to?.includes(env.CONTACT_EMAIL||'rortegarcia@gmail.com'))return error('invalid',403);
 if(!['delivered','opened','clicked'].includes(email.last_event))return error('pending',409);
 return new Response(Uint8Array.from(atob(portugueseTests[level]),c=>c.charCodeAt(0)),{headers:{
 'Content-Type':'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
 'Content-Disposition':'attachment; filename="teste-portugues-'+level.toLowerCase()+'.docx"',
 'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'
 }});
 }catch{return error('unavailable',503);}
}
