import { MercadoPagoConfig, Payment } from 'mercadopago';
import { createServerAdmin } from '../../../../../lib/server/supabase';
import { requiredSetting } from '../../../../../lib/server/config';
import { privateJson, errorResponse, readJson, checkDatabase } from '../../../../../lib/server/http';
import { verifyPaymentSignature, normalizePayment } from '../../../../../lib/comprobantes/payment.mjs';
import { PurchaseError } from '../../../../../lib/comprobantes/errors.mjs';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const body = await readJson(request, 16_000);
    const query = new URL(request.url).searchParams;
    const type = body.type ?? body.topic ?? query.get('type') ?? query.get('topic');
    if (type !== 'payment') return privateJson({ received: true });
    const dataId = query.get('data.id');
    if (!dataId || (body.data?.id && String(body.data.id) !== dataId)) throw new PurchaseError('INVALID_NOTIFICATION', 'La notificación no identifica un pago válido.', 400);
    verifyPaymentSignature({
      signature: request.headers.get('x-signature'), requestId: request.headers.get('x-request-id'),
      dataId, secret: requiredSetting('MERCADOPAGO_WEBHOOK_SECRET')
    });
    const client = new MercadoPagoConfig({ accessToken: requiredSetting('MERCADOPAGO_ACCESS_TOKEN'), options: { timeout: 15000 } });
    const payment = await new Payment(client).get({ id: dataId });
    const event = normalizePayment(payment, {
      environment: requiredSetting('MERCADOPAGO_ENVIRONMENT'), collectorId: requiredSetting('MERCADOPAGO_COLLECTOR_ID')
    });
    const { data, error } = await createServerAdmin().rpc('registrar_pago_comprobante', { p_pago: event });
    checkDatabase(error);
    // El cron procesa las tareas persistidas aunque el comprador cierre la web.
    return privateJson({ received: true, estado: data?.estado });
  } catch (error) { return errorResponse(error); }
}
