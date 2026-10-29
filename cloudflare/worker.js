import {unsubscribeMarketing} from '../server/marketing.js';
import { apiRoute } from '../server/worker.js';
import { privateRoute } from '../server/private-panel.js';
const routes = new Set(['/api/inquiries', '/api/registrations', '/api/registration-status', '/api/portuguese-tests/download']);
export default {
 async fetch(request, env) {
  const path=new URL(request.url).pathname;if(path==='/api/marketing/unsubscribe')return unsubscribeMarketing(request,env);
  if(path.startsWith('/api/private-payments/')||path.startsWith('/api/owner/')||path==='/api/paypal/webhook'){
   try{return await privateRoute(request,env);}catch{return Response.json({error:'unavailable'},{status:503,headers:{'Cache-Control':'no-store'}});}
  }
  if(routes.has(path)){try{return await apiRoute(request,env);}catch{return Response.json({error:'unavailable'},{status:503});}}
  if(path.startsWith('/api/'))return new Response('Not found',{status:404});
  return env.ASSETS.fetch(request);
 }
};
