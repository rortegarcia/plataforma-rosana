import test from 'node:test';import assert from 'node:assert/strict';import {webcrypto} from 'node:crypto';import {recordMarketingConsent,unsubscribeToken,unsubscribeMarketing,marketingCsv} from '../server/marketing.js';import {privateRoute} from '../server/private-panel.js';

test('marketing needs explicit consent; signed opt-out removes exported contact',async()=>{
const contacts=new Map();const env={REGISTRATION_SECRET:'test-only-secret',ANALYTICS_DB:{prepare(sql){return {bind(...args){this.args=args;return this},async run(){if(sql.startsWith('INSERT'))contacts.set(this.args[0],{email:this.args[0],name:this.args[1],consent_text:this.args[3],consent_version:this.args[4],source:this.args[5],consented_at:this.args[6]});if(sql.startsWith('UPDATE'))contacts.get(this.args[1]).unsubscribed_at=this.args[0]},async all(){return {results:[...contacts.values()].filter(x=>!x.unsubscribed_at)}}}}}};
await recordMarketingConsent(env,{accepted:false,email:'no@example.com'});assert.equal(contacts.size,0);
await recordMarketingConsent(env,{accepted:true,email:'PERSON@example.com',name:'=formula',registrationId:'id',source:'popup'});assert.equal(contacts.size,1);
let csv=await (await marketingCsv(env)).text();assert.match(csv,/person@example.com/);assert.match(csv,/'=formula/);assert.match(csv,/preferencias-email\?token=/);
const token=await unsubscribeToken(env,'person@example.com');
const req=value=>new Request('https://rosanaortega.com/api/marketing/unsubscribe',{method:'POST',headers:{Origin:'https://rosanaortega.com','Content-Type':'application/json'},body:JSON.stringify({token:value})});
assert.equal((await unsubscribeMarketing(req(token+'bad'),env)).status,403);
assert.equal((await unsubscribeMarketing(req(token),env)).status,200);
csv=await(await marketingCsv(env)).text();assert.doesNotMatch(csv,/person@example.com/);
assert.equal((await privateRoute(new Request('https://rosanaortega.com/api/owner/marketing.csv'),env)).status,403);
});
