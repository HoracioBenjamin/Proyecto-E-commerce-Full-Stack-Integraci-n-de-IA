import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { PDFDocument } from 'pdf-lib';
import { parseCheckout, buildSnapshot, validateSnapshot } from '../../lib/comprobantes/snapshot.mjs';
import { verifyPaymentSignature, normalizePayment } from '../../lib/comprobantes/payment.mjs';
import { createReceiptPdf } from '../../lib/comprobantes/pdf.mjs';
import { findOwnedOrder } from '../../lib/comprobantes/orders.mjs';
import { cartFingerprint } from '../../lib/cuenta/cart.mjs';
import { checkoutFixture, catalogFixture, receiptFixture, snapshotFixture } from './fixtures.mjs';

test('checkout ignora propietario y congela nombres, color y precio efectivo desde catálogo', () => {
  const parsed = parseCheckout(checkoutFixture({ perfil_id: 'otra-cuenta' }));
  assert.equal(parsed.perfil_id, undefined);
  const result = buildSnapshot(parsed, catalogFixture);
  assert.equal(result.lineas[0].precio_unitario, 35000);
  assert.equal(result.lineas[0].color, 'Rojo');
  assert.equal(result.total, 70010);
});
test('líneas duplicadas no eluden el control de existencias', () => {
  const parsed = parseCheckout(checkoutFixture({ productos: [{ id: 1, size: '42', quantity: 6 }, { id: 1, size: '42', quantity: 6 }] }));
  assert.equal(parsed.productos[0].quantity, 12);
  assert.throws(() => buildSnapshot(parsed, catalogFixture), { code: 'INSUFFICIENT_STOCK' });
});
test('rechaza precios manipulados, cantidades no enteras y totales inconsistentes', () => {
  assert.throws(() => buildSnapshot(parseCheckout(checkoutFixture({ total_pagar: 1 })), catalogFixture), { code: 'PRICE_CHANGED' });
  assert.throws(() => parseCheckout(checkoutFixture({ productos: [{ id: 1, size: '42', quantity: 0.5 }] })), { code: 'INVALID_CHECKOUT' });
  assert.throws(() => validateSnapshot({ ...snapshotFixture(), total: 70000 }), { code: 'INVALID_SNAPSHOT' });
});
test('firma válida, manipulada y vencida del webhook', () => {
  const now = Date.now(); const ts = String(now);
  const digest = createHmac('sha256', 'secreto-ficticio').update(`id:12345;request-id:prueba;ts:${ts};`).digest('hex');
  const args = { signature: `ts=${ts},v1=${digest}`, requestId: 'prueba', dataId: '12345', secret: 'secreto-ficticio', now };
  assert.doesNotThrow(() => verifyPaymentSignature(args));
  assert.throws(() => verifyPaymentSignature({ ...args, dataId: '999' }), { code: 'INVALID_SIGNATURE' });
  assert.throws(() => verifyPaymentSignature({ ...args, now: now + 601000 }), { code: 'INVALID_SIGNATURE' });
});
test('conciliación verifica entorno, comercio, moneda y fecha de aprobación', () => {
  const payment = { id: 12345, external_reference: '1', status: 'approved', live_mode: false, collector_id: 99, currency_id: 'CLP', transaction_amount: 70010, date_approved: '2026-10-20T12:00:00Z' };
  assert.equal(normalizePayment(payment, { environment: 'test', collectorId: '99' }).pedido_id, '1');
  assert.throws(() => normalizePayment(payment, { environment: 'production', collectorId: '99' }), { code: 'PAYMENT_MISMATCH' });
  assert.throws(() => normalizePayment({ ...payment, currency_id: 'USD' }, { environment: 'test', collectorId: '99' }), { code: 'PAYMENT_MISMATCH' });
});
test('pedido ajeno devuelve 404 antes de consultar detalles o PDF', async () => {
  const filters = [];
  const query = { select() { return this; }, eq(key, value) { filters.push([key, value]); return this; }, async maybeSingle() { return { data: null, error: null }; } };
  const db = { from(name) { assert.equal(name, 'pedidos'); return query; } };
  await assert.rejects(() => findOwnedOrder(db, 'usuario-A', '1', () => {}), { code: 'NOT_FOUND', status: 404 });
  assert.deepEqual(filters, [['id', '1'], ['perfil_id', 'usuario-A']]);
});
test('PDF conserva español y genera salida reproducible para conciliar reintentos', async () => {
  const first = await createReceiptPdf(receiptFixture());
  const second = await createReceiptPdf(receiptFixture());
  assert.equal(first.sha256, second.sha256);
  assert.equal(first.bytes.subarray(0, 4).toString(), '%PDF');
  assert.equal((await PDFDocument.load(first.bytes)).getPageCount(), 1);
});
test('PDF extenso pagina sin depender de datos actuales del catálogo', async () => {
  const receipt = receiptFixture();
  const line = receipt.datos_emision.lineas[0];
  receipt.datos_emision.lineas = Array.from({ length: 60 }, (_, i) => ({ ...line, nombre: `Modelo académico ${i + 1}: nombre largo de prueba de ajuste de texto` }));
  receipt.datos_emision.subtotal = line.total_linea * 60;
  receipt.datos_emision.total = receipt.datos_emision.subtotal + 10;
  const pdf = await createReceiptPdf(receipt);
  assert.ok((await PDFDocument.load(pdf.bytes)).getPageCount() > 1);
});
test('una bolsa modificada después del pago no tiene la misma huella', () => {
  const cart = [{ id: 1, size: '42', quantity: 2, price_raw: 35000 }];
  assert.notEqual(cartFingerprint(cart), cartFingerprint([...cart, { id: 2, size: '40', quantity: 1, price_raw: 100 }]));
});
