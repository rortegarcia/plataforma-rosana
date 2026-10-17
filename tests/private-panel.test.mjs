import test from 'node:test';
import assert from 'node:assert/strict';
import {isOwner,privateRoute,cents,syncCapture,recordRegistration} from '../server/private-panel.js';
const origin='https://rosanaortega.com';
const post=(path,data,headers={})=>new Request(origin+path,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',...headers},body:JSON.stringify(data)});
test('private data stays closed before Access setup, including forged email headers',async()=>{
 const r=await privateRoute(new Request(origin+'/api/owner/summary',{headers:{'Cf-Access-Authenticated-User-Email':'rortegarcia@gmail.com'}}),{});
 assert.equal(r.status,403);assert.deepEqual(await r.json(),{error:'private'});
 assert.deepEqual(await (await privateRoute(new Request(origin+'/api/private-payments/config'),{})).json(),{enabled:false});
 assert.equal((await privateRoute(post('/api/private-payments/order',{}),{})).status,503);
 assert.equal((await privateRoute(post('/api/private-payments/order',{}, {Origin:'https://other.example'}),{})).status,403);
});
test('Access validates RSA signature, issuer, audience, expiry and exact owner',async()=>{
 const pair=await crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);
 const jwk=await crypto.subtle.exportKey('jwk',pair.publicKey);jwk.kid='test-key';
 const issuer='https://test-team.cloudflareaccess.com';const env={ACCESS_TEAM_DOMAIN:issuer,ACCESS_AUD:'private-app',OWNER_EMAIL:'owner@example.com'};
 const b64=x=>Buffer.from(x).toString('base64url');
 const jwt=async changes=>{const h=b64(JSON.stringify({alg:'RS256',kid:jwk.kid}));const p=b64(JSON.stringify({iss:issuer,aud:['private-app'],email:'owner@example.com',exp:Math.floor(Date.now()/1000)+300,...changes}));const s=await crypto.subtle.sign('RSASSA-PKCS1-v1_5',pair.privateKey,new TextEncoder().encode(h+'.'+p));return h+'.'+p+'.'+b64(s);};
 const original=globalThis.fetch;globalThis.fetch=async()=>Response.json({keys:[jwk]});
 try{for(const [changes,expected]of [[{},true],[{email:'visitor@example.com'},false],[{aud:['other-app']},false],[{iss:'https://other.example'},false],[{exp:1},false]]){const req=new Request(origin+'/api/owner/summary',{headers:{'Cf-Access-Jwt-Assertion':await jwt(changes)}});assert.equal(await isOwner(req,env),expected);}assert.equal(await isOwner(new Request(origin,{headers:{'Cf-Access-Jwt-Assertion':'forged.payload.signature'}}),env),false);}finally{globalThis.fetch=original;}
});
test('money uses integer cents and rejects ambiguous amounts',()=>{
 assert.equal(cents('15.00'),1500);assert.equal(cents('30.00'),3000);
 for(const amount of ['15','15.001','-1.00','NaN'])assert.throws(()=>cents(amount));
});
test('registration tracking is optional before database activation',async()=>{
 await recordRegistration({},{});
});
test('unverified webhook events cannot change counters',async()=>{
 let writes=0;const original=globalThis.fetch;
 globalThis.fetch=async url=>String(url).endsWith('/v1/oauth2/token')?Response.json({access_token:'test'}):Response.json({verification_status:'FAILURE'});
 const env={PAYMENTS_ENABLED:'true',PAYPAL_CLIENT_ID:'test',PAYPAL_CLIENT_SECRET:'test',PAYPAL_WEBHOOK_ID:'test',ANALYTICS_DB:{prepare(){writes++;throw Error();}}};
 try{assert.equal((await privateRoute(post('/api/paypal/webhook',{event_type:'PAYMENT.CAPTURE.COMPLETED',resource:{id:'CAPTURE'}}),env)).status,403);assert.equal(writes,0);}finally{globalThis.fetch=original;}
});
test('capture confirmation rejects wrong amount and only stores authoritative PayPal result',async()=>{
 let amount='14.00',writes=0;const original=globalThis.fetch;
 const env={PAYPAL_CLIENT_ID:'test',PAYPAL_CLIENT_SECRET:'test',ANALYTICS_DB:{prepare(){return{bind(){return this;},first:async()=>({id:'ORDER1',purchase_id:'purchase',amount_cents:1500,currency:'EUR'}),run:async()=>{writes++;}};}}};
 globalThis.fetch=async url=>String(url).endsWith('/v1/oauth2/token')?Response.json({access_token:'test'}):Response.json({id:'CAPTURE1',status:'COMPLETED',amount:{currency_code:'EUR',value:amount},supplementary_data:{related_ids:{order_id:'ORDER1'}}});
 try{await assert.rejects(syncCapture(env,'ORDER1','CAPTURE1'));assert.equal(writes,0);amount='15.00';assert.equal(await syncCapture(env,'ORDER1','CAPTURE1'),'COMPLETED');assert.equal(writes,1);}finally{globalThis.fetch=original;}
});
