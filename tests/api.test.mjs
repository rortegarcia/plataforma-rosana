import test from 'node:test';
import assert from 'node:assert/strict';
import handler, { config } from '../netlify/functions/api.mjs';

const origin = 'https://rosanaortega.com';
const input = {
  name: 'Prueba', email: 'visitor@example.com', topic: 'portugues',
  workshop: 'garcia-lorca', message: 'Consulta de prueba', consent: true,
  reference: '12345678-1234-1234-1234-123456789abc',
};
function request(path, body = input, headers = {}) {
  return new Request(origin + path, {
    method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

test('Netlify routes, validation, email receipt and payment flow', async () => {
  const keys = ['RESEND_API_KEY', 'REGISTRATION_SECRET', 'RESEND_FROM', 'CONTACT_EMAIL', 'PAYPAL_URL'];
  const previous = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  const originalFetch = globalThis.fetch;
  try {
    for (const key of keys) delete process.env[key];
    assert.deepEqual(config.path, ['/api/inquiries', '/api/registrations', '/api/registration-status']);
    assert.equal((await handler(new Request(origin + '/api/inquiries'))).status, 405);
    assert.equal((await handler(request('/api/inquiries', input, { Origin: 'https://other.example' }))).status, 403);
    assert.equal((await handler(request('/api/inquiries'))).status, 503);
    assert.equal((await handler(request('/api/unknown'))).status, 404);
    Object.assign(process.env, {
      RESEND_API_KEY: 'test-only-not-a-real-key', REGISTRATION_SECRET: 'test-only-secret',
      RESEND_FROM: 'Test <test@example.com>', CONTACT_EMAIL: 'owner@example.com',
      PAYPAL_URL: 'https://paypal.me/example/30EUR',
    });
    assert.equal((await handler(request('/api/inquiries', { ...input, consent: false }))).status, 400);
    assert.equal((await handler(request('/api/inquiries', input, { 'Content-Type': 'text/plain' }))).status, 415);
    let event = 'sent';
    const sent = [];
    globalThis.fetch = async (url, options) => {
      assert.ok(url.startsWith('https://api.resend.com/emails'));
      if (options.method === 'POST') {
        const payload = JSON.parse(options.body);
        sent.push(payload);
        assert.deepEqual(payload.to, ['owner@example.com']);
        assert.equal(payload.from, 'Test <test@example.com>');
        assert.equal(payload.reply_to, 'visitor@example.com');
        assert.ok(options.headers['Idempotency-Key']);
        return Response.json({ id: 'email-123' });
      }
      return Response.json({ to: ['owner@example.com'], last_event: event });
    };
    for (const path of ['/api/inquiries', '/api/registrations']) {
      const response = await handler(request(path));
      assert.equal(response.status, 202);
      const { receipt } = await response.json();
      const pending = await (await handler(request('/api/registration-status', { receipt }))).json();
      assert.equal(pending.status, 'pending');
      assert.equal(pending.paypal, undefined);
      event = 'delivered';
      const delivered = await (await handler(request('/api/registration-status', { receipt }))).json();
      assert.equal(delivered.status, 'delivered');
      assert.equal(delivered.paypal, process.env.PAYPAL_URL);
      assert.equal((await handler(request('/api/registration-status', { receipt: receipt + 'tampered' }))).status, 403);
      event = 'bounced';
      const failed = await (await handler(request('/api/registration-status', { receipt }))).json();
      assert.equal(failed.status, 'failed');
      assert.equal(failed.paypal, undefined);
      event = 'sent';
    }
    assert.match(sent[0].subject, /Solicitud de información/);
    assert.match(sent[1].subject, /Inscripción/);
    globalThis.fetch = async () => Response.json({ error: 'unavailable' }, { status: 400 });
    assert.equal((await handler(request('/api/inquiries'))).status, 502);
  } finally {
    globalThis.fetch = originalFetch;
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
});
