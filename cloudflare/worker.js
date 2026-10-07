import { apiRoute } from '../server/worker.js';
const routes = new Set(['/api/inquiries', '/api/registrations', '/api/registration-status']);
export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    if (routes.has(path)) {
      try { return await apiRoute(request, env); }
      catch { return Response.json({error:'unavailable'}, {status:503}); }
    }
    if (path.startsWith('/api/')) return new Response('Not found', {status:404});
    return env.ASSETS.fetch(request);
  }
};
