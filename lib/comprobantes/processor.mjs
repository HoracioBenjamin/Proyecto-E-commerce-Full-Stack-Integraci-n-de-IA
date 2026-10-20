import { createReceiptPdf, sha256 } from './pdf.mjs';
import { PurchaseError } from './errors.mjs';

/** Dependencias inyectadas: las pruebas nunca llaman a Storage ni envían emails. */
export async function processReceiptTasks({ repository, storage, sendEmail, limit = 2 }) {
  const result = { processed: 0, completed: 0, retried: 0, review: 0 };
  for (let index = 0; index < Math.min(Math.max(limit, 1), 4); index++) {
    const work = await repository.claim();
    if (!work) break;
    const { tarea, comprobante } = work;
    result.processed++;
    let externalEmailAccepted = false;
    try {
      if (tarea.tipo === 'generar_pdf') {
        const pdf = await createReceiptPdf(comprobante);
        const path = `pedidos/${comprobante.pedido_id}/${comprobante.id}.pdf`;
        await storage.putOnce(path, pdf.bytes, pdf.sha256);
        await repository.complete(tarea, { storage_path: path, sha256: pdf.sha256, emitido_at: pdf.emitido_at });
      } else if (tarea.tipo === 'enviar_correo') {
        const first = new Date(tarea.primer_intento_at).getTime();
        if (!Number.isFinite(first) || Date.now() - first > 23.5 * 3600_000) {
          const issue = new PurchaseError('EMAIL_RECONCILIATION_REQUIRED', 'El envío necesita conciliación.');
          issue.manualReview = true; issue.deliveryUncertain = true; throw issue;
        }
        const bytes = await storage.read(comprobante.storage_path);
        if (sha256(bytes) !== comprobante.pdf_sha256) {
          const issue = new PurchaseError('PDF_INTEGRITY_FAILED', 'El archivo no coincide con el comprobante.');
          issue.manualReview = true; throw issue;
        }
        const email = await sendEmail(comprobante, bytes, tarea.clave_idempotencia);
        externalEmailAccepted = true;
        await repository.complete(tarea, { proveedor_id: email.id });
      } else {
        const issue = new PurchaseError('UNKNOWN_TASK', 'Tipo de tarea no reconocido.');
        issue.manualReview = true; throw issue;
      }
      result.completed++;
    } catch (error) {
      const manual = error.manualReview === true || ['PDF_FONT_REQUIRED', 'INVALID_SNAPSHOT', 'INVALID_PDF_DATE'].includes(error.code);
      await repository.fail(tarea, {
        code: error instanceof PurchaseError ? error.code : 'TASK_FAILED',
        manual, uncertain: externalEmailAccepted || error.deliveryUncertain === true
      });
      result[manual ? 'review' : 'retried']++;
    }
  }
  return result;
}
