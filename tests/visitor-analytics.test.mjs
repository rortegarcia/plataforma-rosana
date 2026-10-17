import test from 'node:test';
import assert from 'node:assert/strict';
import {visitorAnalytics,pageBreakdown} from '../server/visitor-analytics.js';
const env={CF_ANALYTICS_TOKEN:'test-secret',CF_ZONE_ID:'a'.repeat(32)};
test('no credentials does not fetch or report false zero',async()=>{assert.deepEqual(await visitorAnalytics({}),{status:'not_configured'});});
test('aggregates visits and hourly pageviews without returning credentials',async()=>{const original=globalThis.fetch;try{globalThis.fetch=async(url,options)=>{assert.equal(url,'https://api.cloudflare.com/client/v4/graphql');const input=JSON.parse(options.body);assert.equal(new Date(input.variables.to)-new Date(input.variables.from),86400000);assert.match(input.query,/requestSource:"eyeball"/);return Response.json({data:{viewer:{zones:[{traffic:[{sum:{visits:252}}],pages:[{sum:{pageViews:200}},{sum:{pageViews:157}}]}]}}});};const result=await visitorAnalytics(env);assert.equal(result.visits,252);assert.equal(result.pageViews,357);assert.equal(result.status,'ready');assert.ok(!JSON.stringify(result).includes('test-secret'));}finally{globalThis.fetch=original;}});
test('GraphQL and network errors do not masquerade as zero visits',async()=>{const original=globalThis.fetch;try{globalThis.fetch=async()=>Response.json({errors:[{message:'denied'}]});assert.deepEqual(await visitorAnalytics(env),{status:'unavailable'});globalThis.fetch=async()=>{throw Error('network');};assert.deepEqual(await visitorAnalytics(env),{status:'unavailable'});}finally{globalThis.fetch=original;}});

test('page breakdown merges aliases and excludes private routes and handles failure',async()=>{const original=globalThis.fetch;try{
 globalThis.fetch=async()=>Response.json({data:{viewer:{zones:[{byPage:[
 {count:3,dimensions:{clientRequestPath:'/libro.html'}},{count:2,dimensions:{clientRequestPath:'/libro'}},
 {count:9,dimensions:{clientRequestPath:'/gestion'}},{count:1,dimensions:{clientRequestPath:'/'}}
 ]}]}}});
 const result=await pageBreakdown(env,'2026-10-16T00:00:00Z','2026-10-17T00:00:00Z');
 assert.deepEqual(result.pages,[{path:'/libro',views:5},{path:'/',views:1}]);
 globalThis.fetch=async()=>Response.json({errors:[{message:'field denied'}]});
 assert.deepEqual(await pageBreakdown(env,'',''),{status:'unavailable'});
 }finally{globalThis.fetch=original;}});
