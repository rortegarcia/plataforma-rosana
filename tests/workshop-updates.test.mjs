import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import vm from 'node:vm';import {apiRoute} from '../server/worker.js';
test('four newly documented workshops have consistent sessions, prices, forms and payment receipts',async()=>{
 const source=await readFile(new URL('../public/workshops-data.js',import.meta.url),'utf8');const workshops=vm.runInNewContext(source+'workshops;');const oldFetch=globalThis.fetch;let payload;
 const expected={'miguel-hernandez':[30,2],'carlos-drummond-de-andrade':[30,2],'fernando-pessoa':[30,2],'memorias-postumas':[44,3]};
 const env={RESEND_API_KEY:'test',REGISTRATION_SECRET:'test'};const request=(path,data)=>new Request('https://example.com/api/'+path,{method:'POST',headers:{Origin:'https://example.com','Content-Type':'application/json'},body:JSON.stringify(data)});
 globalThis.fetch=async(url,options)=>{if(options.method==='POST'){payload=JSON.parse(options.body);return Response.json({id:'workshop-test'});}return Response.json({subject:payload.subject,to:['rortegarcia@gmail.com'],last_event:'delivered'});};
 try{for(const [id,[price,sessions]] of Object.entries(expected)){
 const w=workshops.find(w=>w.id===id);assert.equal(w.upcoming,false);assert.equal(w.priceEuros,price);assert.equal(w.sessionCount,sessions);
 for(const group of [1,2])assert.equal(w.calendarDates.filter(d=>d.group===group).length,sessions);
 const page=await readFile(new URL('../public/taller/'+id+'.html',import.meta.url),'utf8');assert.match(page,/id="workshop-form"/);assert(!page.includes('Clarice'));
 const sent=await apiRoute(request('registrations',{workshop:id,name:'Test',email:'test@example.com',consent:true,reference:crypto.randomUUID()}),env);assert.equal(sent.status,202);assert(payload.text.includes('Importe: '+price+' EUR por '+sessions+' sesiones'));
 const status=await apiRoute(request('registration-status',{receipt:(await sent.json()).receipt}),env);assert.equal((await status.json()).paypal,'https://paypal.me/rosanaortega/'+price+'EUR');
 }
 assert.equal(workshops.find(w=>w.id==='cien-anos-de-soledad').event.closed,true);
 }finally{globalThis.fetch=oldFetch;}
});
