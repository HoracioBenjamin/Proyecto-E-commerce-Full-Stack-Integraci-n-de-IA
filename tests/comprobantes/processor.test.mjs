import test from 'node:test';
import assert from 'node:assert/strict';
import { processReceiptTasks } from '../../lib/comprobantes/processor.mjs';
import { createReceiptPdf } from '../../lib/comprobantes/pdf.mjs';
import { receiptFixture } from './fixtures.mjs';

function task(tipo) { return { id: 'tarea-prueba', tipo, clave_idempotencia: 'clave-estable-prueba', token_bloqueo: 'lease-prueba', primer_intento_at: new Date().toISOString() }; }
function repository(work, complete = async () => {}) {
  let claimed = false; const failures = [];
  return { failures, claim: async () => { if (claimed) return null; claimed = true; return work; }, complete,
    fail: async (_task, value) => failures.push(value) };
}

test('la generación PDF no envía correo y finaliza con ruta y hash', async () => {
  let stored; let completed;
  const repo = repository({ tarea: task('generar_pdf'), comprobante: receiptFixture() }, async (_task, value) => { completed = value; });
  const result = await processReceiptTasks({ repository: repo, storage: { putOnce: async (path, bytes, hash) => { stored = { path, hash, bytes }; } }, sendEmail: () => { throw new Error('No enviar correo en tarea PDF'); } });
  assert.equal(result.completed, 1);
  assert.equal(completed.sha256, stored.hash);
  assert.match(stored.path, /^pedidos\/1\//);
});
test('fallo de correo conserva el PDF y permite reintento con la misma clave', async () => {
  const receipt = receiptFixture(); const pdf = await createReceiptPdf(receipt); receipt.pdf_sha256 = pdf.sha256;
  const repo = repository({ tarea: task('enviar_correo'), comprobante: receipt });
  await processReceiptTasks({ repository: repo, storage: { read: async () => pdf.bytes }, sendEmail: async (_receipt, _bytes, key) => {
    assert.equal(key, 'clave-estable-prueba'); const issue = new Error('timeout ficticio'); issue.deliveryUncertain = true; throw issue;
  } });
  assert.equal(repo.failures[0].uncertain, true);
  assert.equal(receipt.pdf_sha256, pdf.sha256);
});
test('caída de BD después de aceptar email registra incertidumbre', async () => {
  const receipt = receiptFixture(); const pdf = await createReceiptPdf(receipt); receipt.pdf_sha256 = pdf.sha256;
  const repo = repository({ tarea: task('enviar_correo'), comprobante: receipt }, async () => { throw new Error('Fallo de BD ficticio'); });
  await processReceiptTasks({ repository: repo, storage: { read: async () => pdf.bytes }, sendEmail: async () => ({ id: 'aceptado-ficticio' }) });
  assert.equal(repo.failures[0].uncertain, true);
});
test('un PDF alterado no se adjunta al correo', async () => {
  const receipt = receiptFixture(); receipt.pdf_sha256 = '0'.repeat(64);
  const repo = repository({ tarea: task('enviar_correo'), comprobante: receipt });
  const result = await processReceiptTasks({ repository: repo, storage: { read: async () => Buffer.from('alterado') }, sendEmail: () => { throw new Error('No debe enviarse'); } });
  assert.equal(result.review, 1);
  assert.equal(repo.failures[0].code, 'PDF_INTEGRITY_FAILED');
});
test('fuera de la ventana de idempotencia no hay reenvío automático', async () => {
  const stale = task('enviar_correo'); stale.primer_intento_at = new Date(Date.now() - 25 * 3600_000).toISOString();
  const repo = repository({ tarea: stale, comprobante: receiptFixture() });
  const result = await processReceiptTasks({ repository: repo, storage: {}, sendEmail: () => { throw new Error('No debe enviarse'); } });
  assert.equal(result.review, 1);
  assert.equal(repo.failures[0].uncertain, true);
});
