import { requireUser } from '../../../../../../../lib/server/auth';
import { createServerAdmin } from '../../../../../../../lib/server/supabase';
import { errorResponse, checkDatabase } from '../../../../../../../lib/server/http';
import { findOwnedOrder, findOrderReceipt } from '../../../../../../../lib/comprobantes/orders.mjs';
import { PurchaseError, receiptNumber } from '../../../../../../../lib/comprobantes/errors.mjs';
import { sha256 } from '../../../../../../../lib/comprobantes/pdf.mjs';

export const runtime = 'nodejs';

export async function GET(request, context) {
  try {
    const user = await requireUser(request);
    const { pedidoId } = await context.params;
    const db = createServerAdmin();
    const order = await findOwnedOrder(db, user.id, pedidoId, checkDatabase);
    const receipt = await findOrderReceipt(db, order.id, checkDatabase);
    if (!receipt) throw new PurchaseError('RECEIPT_UNAVAILABLE', 'Esta compra todavía no tiene comprobante disponible.', 409);
    if (order.estado !== 'exitoso' || receipt.estado_documento !== 'vigente') throw new PurchaseError('RECEIPT_CANCELLED', 'El comprobante no corresponde a un pago vigente.', 409);
    if (receipt.estado_pdf !== 'disponible' || !receipt.storage_path) throw new PurchaseError('RECEIPT_PROCESSING', 'Estamos preparando tu comprobante. Intenta en unos momentos.', 409);
    const { data, error } = await db.storage.from('comprobantes').download(receipt.storage_path);
    if (error || !data) throw new PurchaseError('PDF_UNAVAILABLE', 'No pudimos descargar el PDF. Intenta nuevamente.', 503);
    const bytes = Buffer.from(await data.arrayBuffer());
    if (sha256(bytes) !== receipt.pdf_sha256) throw new PurchaseError('PDF_INTEGRITY_FAILED', 'El archivo necesita revisión. Contacta a la tienda.', 409);
    return new Response(bytes, { headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="comprobante-${receiptNumber(receipt.numero)}.pdf"`,
      'Cache-Control': 'private, no-store', Vary: 'Authorization', 'X-Content-Type-Options': 'nosniff'
    } });
  } catch (error) { return errorResponse(error); }
}
