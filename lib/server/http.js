import 'server-only';
import { PurchaseError } from '../comprobantes/errors.mjs';

export function privateJson(value, status = 200) {
  return Response.json(value, { status, headers: { 'Cache-Control': 'private, no-store', Vary: 'Authorization' } });
}

export function errorResponse(error) {
  if (error instanceof PurchaseError) return privateJson({ error: { code: error.code, message: error.message } }, error.status);
  // No registrar respuestas del proveedor, cuerpos de pedidos ni mensajes con secretos.
  console.error('[compras] Operación fallida', { code: 'SERVICE_UNAVAILABLE' });
  return privateJson({ error: { code: 'SERVICE_UNAVAILABLE', message: 'No pudimos completar la operación. Intenta nuevamente.' } }, 503);
}

export function checkDatabase(error) {
  if (!error) return;
  const known = {
    P0002: [404, 'NOT_FOUND', 'No encontramos esa compra.'],
    '23514': [409, 'INVALID_PURCHASE', 'El pedido o pago no coincide con el detalle registrado.'],
    '23505': [409, 'PAYMENT_CONFLICT', 'La referencia de pago requiere conciliación.'],
    '55000': [409, 'TASK_CONFLICT', 'La tarea cambió de estado. Intenta nuevamente.']
  };
  const missing = ['42P01', '42703', '42883', 'PGRST202', 'PGRST205'].includes(error.code);
  const entry = missing ? [503, 'DATABASE_SETUP_REQUIRED', 'Falta aplicar o revisar la configuración de comprobantes en Supabase.'] : known[error.code];
  if (entry) throw new PurchaseError(entry[1], entry[2], entry[0]);
  throw new PurchaseError('DATABASE_UNAVAILABLE', 'No se pudo consultar o registrar la compra.', 503);
}

export async function readJson(request, maxBytes = 100_000) {
  if (Number(request.headers.get('content-length') ?? 0) > maxBytes) throw new PurchaseError('REQUEST_TOO_LARGE', 'La solicitud supera el tamaño permitido.', 413);
  const reader = request.body?.getReader();
  if (!reader) throw new PurchaseError('INVALID_JSON', 'La solicitud no contiene datos.');
  const chunks = []; let length = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > maxBytes) { await reader.cancel(); throw new PurchaseError('REQUEST_TOO_LARGE', 'La solicitud supera el tamaño permitido.', 413); }
      chunks.push(Buffer.from(value));
    }
    try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
    catch { throw new PurchaseError('INVALID_JSON', 'El formato de la solicitud no es válido.'); }
  } finally { reader.releaseLock(); }
}
