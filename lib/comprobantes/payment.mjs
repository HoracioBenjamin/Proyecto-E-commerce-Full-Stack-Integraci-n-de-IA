import { createHmac, timingSafeEqual } from 'node:crypto';
import { assertPurchase, identifier } from './errors.mjs';

export function verifyPaymentSignature({ signature, requestId, dataId, secret, now = Date.now() }) {
  assertPurchase(secret, 'CONFIGURATION_REQUIRED', 'Falta configurar MERCADOPAGO_WEBHOOK_SECRET.', 503);
  assertPurchase(typeof signature === 'string' && signature.length <= 2048 && typeof requestId === 'string' && requestId.length <= 200 && dataId,
    'INVALID_SIGNATURE', 'Notificación de pago no autorizada.', 401);
  const parts = signature.split(',').map((part) => part.trim().split('='));
  const timestamp = parts.find(([key]) => key === 'ts')?.[1];
  const digests = parts.filter(([key]) => key === 'v1').map(([, value]) => value);
  const numericTimestamp = Number(timestamp);
  const time = timestamp?.length >= 13 ? numericTimestamp : numericTimestamp * 1000;
  assertPurchase(/^\d+$/.test(timestamp ?? '') && Number.isSafeInteger(numericTimestamp) && Math.abs(now - time) <= 600_000,
    'INVALID_SIGNATURE', 'La notificación de pago no tiene una firma vigente.', 401);
  const manifest = `id:${String(dataId).toLowerCase()};request-id:${requestId};ts:${timestamp};`;
  const expected = createHmac('sha256', secret).update(manifest).digest();
  const valid = digests.some((digest) => /^[a-f\d]{64}$/i.test(digest ?? '') && timingSafeEqual(expected, Buffer.from(digest, 'hex')));
  assertPurchase(valid, 'INVALID_SIGNATURE', 'Notificación de pago no autorizada.', 401);
}

export function normalizePayment(payment, { environment, collectorId }) {
  assertPurchase(['test', 'production'].includes(environment) && collectorId,
    'CONFIGURATION_REQUIRED', 'Configura MERCADOPAGO_ENVIRONMENT y MERCADOPAGO_COLLECTOR_ID en el servidor.', 503);
  assertPurchase(payment.live_mode === (environment === 'production') && String(payment.collector_id) === String(collectorId),
    'PAYMENT_MISMATCH', 'El pago no corresponde al comercio o entorno configurado.', 409);
  const amount = Number(payment.transaction_amount);
  assertPurchase(Number.isSafeInteger(amount) && amount > 0 && payment.currency_id === 'CLP',
    'PAYMENT_MISMATCH', 'No coincide la moneda o importe del pago.', 409);
  const id = String(payment.id ?? '');
  assertPurchase(/^\d+$/.test(id), 'INVALID_PAYMENT', 'La referencia de pago no es válida.', 409);
  const status = payment.status;
  assertPurchase(['approved', 'pending', 'in_process', 'authorized', 'rejected', 'cancelled', 'refunded', 'charged_back'].includes(status),
    'UNSUPPORTED_PAYMENT_STATUS', 'El estado del pago requiere revisión.', 409);
  const date = payment.date_approved ? new Date(payment.date_approved) : null;
  assertPurchase(status !== 'approved' || (date && Number.isFinite(date.getTime())), 'INVALID_PAYMENT', 'No se recibió una fecha de aprobación válida.', 409);
  return {
    id, pedido_id: identifier(payment.external_reference), status,
    monto: amount, moneda: 'CLP',
    fecha_aprobacion: date && Number.isFinite(date.getTime()) ? date.toISOString() : null,
    monto_reembolsado: Number(payment.transaction_amount_refunded ?? 0)
  };
}
