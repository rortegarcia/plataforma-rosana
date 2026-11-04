import test from 'node:test';import assert from 'node:assert/strict';import {apiRoute} from '../server/worker.js';import definitions from '../public/portuguese-tests-data.json' with {type:'json'};
const env={RESEND_API_KEY:'test-only',REGISTRATION_SECRET:'test-secret',CONTACT_EMAIL:'owner@example.com'},origin='https://example.com';
const request=(path,input,options={})=>new Request(origin+path,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(input),...options});
const valid=level=>({level,email:'learner@example.com',name:'Learner',consent:true,reference:crypto.randomUUID(),answers:{[definitions[level].fields[0].id]:definitions[level].fields[0].options?.[0]||'minha resposta'}});
test('all six complete tests are public data with the original exercise types and no answer key',()=>{
assert.deepEqual(Object.keys(definitions),['A1','A2','B1','B2','C1','C2']);
const counts={A1:67,A2:46,B1:41,B2:56,C1:41,C2:41};for(const [level,d]of Object.entries(definitions)){assert.equal(d.fields.length,counts[level]);assert(d.exercises.length>=3);for(const f of d.fields)assert(!Object.hasOwn(f,'correct'));}assert.equal(definitions.B2.fields.filter(f=>f.options).length,45);
});
test('answers and contact email are sent together for every level, without a prior request or automatic grading',async()=>{
const original=globalThis.fetch;let payload,header;const rows=[];const database={prepare(){return{bind(...args){rows.push(args);return this},async run(){}}}};
globalThis.fetch=async(url,options)=>{assert.equal(url,'https://api.resend.com/emails');payload=JSON.parse(options.body);header=options.headers['Idempotency-Key'];return Response.json({id:'online-test-id'});};
try{for(const level of Object.keys(definitions)){
const response=await apiRoute(request('/api/portuguese-tests/submit',valid(level)),{...env,ANALYTICS_DB:database});assert.equal(response.status,202);const result=await response.json();assert(result.receipt);assert.equal(result.score,undefined);assert.match(payload.subject,new RegExp(level));assert.equal(payload.reply_to,'learner@example.com');assert.deepEqual(payload.to,['owner@example.com']);assert(payload.text.includes(definitions[level].fields[0].label));assert(payload.text.includes('Marketing autorizado: NÃO'));assert(header.startsWith('online-test/'));assert.equal(rows.at(-1)[3],'portuguese-test-'+level);}
}finally{globalThis.fetch=original;}
});
test('email, consent and valid answer data are required only at submission; malformed submissions do not send email',async()=>{
const original=globalThis.fetch;globalThis.fetch=()=>{throw Error('must not fetch')};
try{for(const patch of [{email:''},{consent:false},{answers:{}},{level:'__proto__'},{answers:{invented:'answer'}},{answers:{[definitions.A1.fields[0].id]:'x'.repeat(251)}}]){
const r=await apiRoute(request('/api/portuguese-tests/submit',{...valid('A1'),...patch}),env);assert.equal(r.status,400);}
const radio=definitions.A2.fields[0];assert.equal((await apiRoute(request('/api/portuguese-tests/submit',{...valid('A2'),answers:{[radio.id]:'not an option'}}),env)).status,400);
assert.equal((await apiRoute(request('/api/portuguese-tests/submit',valid('A1'),{headers:{Origin:'https://other.example','Content-Type':'application/json'}}),env)).status,403);
assert.equal((await apiRoute(new Request(origin+'/api/portuguese-tests/download?level=A1'),env)).status,410);
}finally{globalThis.fetch=original;}
});
test('workshop notice requests identify the selected upcoming workshop and never opt into marketing',async()=>{
const original=globalThis.fetch;let payload;const rows=[];const database={prepare(){return{bind(...args){rows.push(args);return this},async run(){}}}};
globalThis.fetch=async(url,options)=>{payload=JSON.parse(options.body);return Response.json({id:'notice-id'});};
try{
const input={topic:'workshop-waitlist',workshop:'fernando-sabino',email:'learner@example.com',consent:true,reference:crypto.randomUUID(),message:'Avise-me sobre novas datas.'};
const response=await apiRoute(request('/api/inquiries',input),{...env,ANALYTICS_DB:database});assert.equal(response.status,202);assert.match(payload.subject,/Aviso de próximas fechas.*Fernando Sabino/);assert.equal(rows.at(-1)[3],'waitlist:fernando-sabino');assert.equal(rows.length,1);
assert.equal((await apiRoute(request('/api/inquiries',{...input,workshop:'garcia-lorca'}),env)).status,400);
assert.equal((await apiRoute(request('/api/inquiries',{...input,workshop:'__proto__'}),env)).status,400);
}finally{globalThis.fetch=original;}
});
