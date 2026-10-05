import { apiRoute } from '../../server/worker.js';

export const config = {
  path: ['/api/inquiries', '/api/registrations', '/api/registration-status'],
};

export default async function handler(request) {
  if (!config.path.includes(new URL(request.url).pathname)) {
    return Response.json({ error: 'not_found' }, { status: 404 });
  }
  try {
    return await apiRoute(request, process.env);
  } catch {
    return Response.json({ error: 'unavailable' }, {
      status: 503,
      headers: { 'Cache-Control': 'no-store' },
    });
  }
}
