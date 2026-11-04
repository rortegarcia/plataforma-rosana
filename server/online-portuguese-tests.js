import portugueseTestDefinitions from '../public/portuguese-tests-data.json' with {type:'json'};
import {recordRegistration} from './private-panel.js';
import {recordMarketingConsent,marketingConsentText} from './marketing.js';
const reply=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const encode=bytes=>btoa(String.fromCharCode(...new Uint8Array(bytes))).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');
async function hmac(secret,value){const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);return encode(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(value)));}
export async function submitPortugueseTest(request,env){
 if(request.method!=='POST')return reply({error:'method'},405);
 if(request.headers.get('Origin')!==new URL(request.url).origin)return reply({error:'origin'},403);
 if(!request.headers.get('Content-Type')?.includes('application/json'))return reply({error:'type'},415);
 if(!env.RESEND_API_KEY||!env.REGISTRATION_SECRET)return reply({error:'unavailable'},503);
 const raw=await request.text();if(raw.length>64000)return reply({error:'size'},413);let input;try{input=JSON.parse(raw);}catch{return reply({error:'invalid'},400);}
 if(!input||typeof input!=='object'||Array.isArray(input)||!Object.hasOwn(portugueseTestDefinitions,input.level||''))return reply({error:'invalid'},400);
 const definition=portugueseTestDefinitions[input.level],email=String(input.email||'').trim(),name=String(input.name||'').trim()||'Não informado',answers=input.answers;
 if(!definition||!answers||Array.isArray(answers)||typeof answers!=='object'||!/^\S+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>200||name.length>100||/[\r\n]/.test(name)||!name||input.consent!==true||input.honey||!/^[-a-f0-9]{36}$/.test(input.reference||''))return reply({error:'invalid'},400);
 const keys=new Set(definition.fields.map(f=>f.id));if(Object.keys(answers).some(key=>!keys.has(key)))return reply({error:'answers'},400);
 const normalized={};for(const field of definition.fields){const value=answers[field.id]??'';if(typeof value!=='string'||value.length>field.maxLength||field.options&&value&&!field.options.includes(value))return reply({error:'answers'},400);normalized[field.id]=value.trim();}
 if(!Object.values(normalized).some(Boolean))return reply({error:'empty'},400);
 if(input.marketingConsent===true&&!env.ANALYTICS_DB)return reply({error:'storage'},503);
 const title='Teste de português '+input.level+' — respostas para correção humana';
 const text=['TESTE RESPONDIDO NA PÁGINA — CORREÇÃO HUMANA','Nível escolhido: '+input.level,'Nome: '+name,'E-mail para correção: '+email,'Referência: '+input.reference,'Consentimento para avaliação: aceito','Marketing autorizado: '+(input.marketingConsent===true?'SIM':'NÃO'),...(input.marketingConsent===true?[marketingConsentText]:[]),'','Sem correção automática. Analise as respostas e envie a avaliação individual ao e-mail acima.','',...definition.fields.flatMap(field=>[field.label,'Resposta: '+(normalized[field.id]||'(em branco)'), ''])].join('\n');
 const payload={from:env.RESEND_FROM||'Plataforma Português <onboarding@resend.dev>',to:[env.CONTACT_EMAIL||'rortegarcia@gmail.com'],reply_to:email,subject:'Teste respondido — Português '+input.level,text};
 const key=await hmac(env.REGISTRATION_SECRET,JSON.stringify([input.reference,email,name,input.level,normalized,input.marketingConsent===true]));
 let response;try{response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+env.RESEND_API_KEY,'Content-Type':'application/json','Idempotency-Key':'online-test/'+key},body:JSON.stringify(payload),signal:AbortSignal.timeout(12000)});}catch{return reply({error:'send'},502);}
 if(!response.ok)return reply({error:'send'},502);const result=await response.json();if(!result.id)return reply({error:'send'},502);
 try{await recordRegistration(env,{id:result.id,resendId:result.id,kind:'inquiry',topic:'portuguese-test-'+input.level,title,name,email});if(input.marketingConsent===true)await recordMarketingConsent(env,{accepted:true,email,name:name==='Não informado'?'':name,registrationId:result.id,source:'test-page'});}catch{return reply({error:'storage'},503);}
 const value=result.id+'.'+(Math.floor(Date.now()/1000)+86400);return reply({status:'pending',receipt:value+'.'+await hmac(env.REGISTRATION_SECRET,value)},202);
}
