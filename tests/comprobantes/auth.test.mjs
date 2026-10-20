import test from 'node:test';
import assert from 'node:assert/strict';
import { requireUser } from '../../lib/server/auth.js';
import { authorizeReceiptJob } from '../../lib/server/receipt-worker.js';

test('invitado solo cuando no hay token; un token inválido no se degrada a invitado', async () => {
  assert.equal(await requireUser(new Request('https://tienda.example'), { optional: true }), null);
  await assert.rejects(() => requireUser(new Request('https://tienda.example', { headers: { authorization: 'Bearer invalido' } }), {
    optional: true, verifier: () => ({ auth: { getUser: async () => ({ data: { user: null }, error: {} }) } })
  }), { code: 'AUTH_REQUIRED' });
});
test('identidad viene del servidor Auth, no de campos proporcionados por el comprador', async () => {
  const result = await requireUser(new Request('https://tienda.example?perfil_id=otro', { headers: { authorization: 'Bearer prueba' } }), {
    verifier: () => ({ auth: { getUser: async (token) => { assert.equal(token, 'prueba'); return { data: { user: { id: 'propietario-verificado', email: 'prueba@example.test' } } }; } } })
  });
  assert.equal(result.id, 'propietario-verificado');
});
test('un token de comprador no autoriza el procesador interno', () => {
  process.env.COMPROBANTES_JOB_SECRET = 'secreto-ficticio-solo-test';
  assert.throws(() => authorizeReceiptJob(new Request('https://tienda.example', { headers: { authorization: 'Bearer comprador' } })), { code: 'JOB_UNAUTHORIZED' });
  assert.doesNotThrow(() => authorizeReceiptJob(new Request('https://tienda.example', { headers: { authorization: 'Bearer secreto-ficticio-solo-test' } })));
  delete process.env.COMPROBANTES_JOB_SECRET;
});
