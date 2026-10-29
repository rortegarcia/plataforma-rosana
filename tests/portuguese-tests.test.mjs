import test from 'node:test';
import assert from 'node:assert/strict';
import {apiRoute} from '../server/worker.js';
import {downloadPortugueseTest,portugueseTestTopic} from '../server/portuguese-tests.js';
import {portugueseTests} from '../server/portuguese-test-files.js';
const env={RESEND_API_KEY:'test-only',REGISTRATION_SECRET:'local-test-only',CONTACT_EMAIL:'owner@example.com'};
const origin='https://example.com';
const encode=bytes=>Buffer.from(bytes).toString('base64url');
async function receipt(){const data='test-id.'+(Math.floor(Date.now()/1000)+3600);const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(env.REGISTRATION_SECRET),{name:'HMAC',hash:'SHA-256'},false,['sign']);return data+'.'+encode(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(data)));}
const req=(token,level='A1')=>new Request(origin+'/api/portuguese-tests/download?level='+level+'&receipt='+encodeURIComponent(token));
test('downloads reject missing or forged receipt and unknown levels before fetching',async()=>{
 const original=globalThis.fetch;globalThis.fetch=()=>{throw Error('should not fetch');};
 try{assert.equal((await downloadPortugueseTest(req(''),env)).status,403);assert.equal((await downloadPortugueseTest(req('test-id.9999999999.fake'),env)).status,403);assert.equal((await downloadPortugueseTest(req('', 'A9'),env)).status,404);}finally{globalThis.fetch=original;}
});
test('only delivered test requests unlock the six original Word files',async()=>{
 const original=globalThis.fetch,token=await receipt();
 let subject='Other purpose',last_event='delivered';
 globalThis.fetch=async()=>Response.json({subject,to:['owner@example.com'],last_event});
 try{
 assert.equal((await downloadPortugueseTest(req(token),env)).status,403);
 subject='Solicitud de información — '+portugueseTestTopic;last_event='pending';
 assert.equal((await downloadPortugueseTest(req(token),env)).status,409);
 last_event='delivered';
 for(const level of Object.keys(portugueseTests)){
 const response=await downloadPortugueseTest(req(token,level),env);
 assert.equal(response.status,200);assert.match(response.headers.get('Content-Disposition'),/attachment/);assert.match(response.headers.get('Cache-Control'),/no-store/);
 const bytes=Buffer.from(await response.arrayBuffer());assert.deepEqual(bytes,Buffer.from(portugueseTests[level],'base64'));assert.equal(bytes.subarray(0,2).toString(),'PK');
 }
 }finally{globalThis.fetch=original;}
});
test('email-only test access records a clear request without requiring a name',async()=>{
 const original=globalThis.fetch;let payload;
 globalThis.fetch=async(url,options)=>{assert.equal(url,'https://api.resend.com/emails');payload=JSON.parse(options.body);return Response.json({id:'test-id'});};
 try{const response=await apiRoute(new Request(origin+'/api/inquiries',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({name:'',email:'student@example.com',topic:'portuguese-tests',reference:crypto.randomUUID(),consent:true,message:'Test access'})}),env);
 assert.equal(response.status,202);assert.equal(payload.reply_to,'student@example.com');assert.equal(payload.subject,'Solicitud de información — '+portugueseTestTopic);assert.match(payload.text,/Não informado/);assert((await response.json()).receipt);
 }finally{globalThis.fetch=original;}
});
