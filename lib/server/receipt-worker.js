import 'server-only';
import { Resend } from 'resend';
import { timingSafeEqual } from 'node:crypto';
import { createServerAdmin } from './supabase.js';
import { applicationUrl, requiredSetting } from './config.js';
import { checkDatabase } from './http.js';
import { processReceiptTasks } from '../comprobantes/processor.mjs';
import { sha256 } from '../comprobantes/pdf.mjs';
import { PurchaseError, receiptNumber } from '../comprobantes/errors.mjs';

export function authorizeReceiptJob(request) {
  const expected = Buffer.from(`Bearer ${requiredSetting('COMPROBANTES_JOB_SECRET')}`);
  const actual = Buffer.from(request.headers.get('authorization') ?? '');
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) throw new PurchaseError('JOB_UNAUTHORIZED', 'Invocación del procesador no autorizada.', 401);
}

function storageAdapter(db) {
  const bucket = db.storage.from('comprobantes');
  return {
    async read(path) {
      const { data, error } = await bucket.download(path);
      if (error || !data) throw new PurchaseError('PDF_UNAVAILABLE', 'No se pudo recuperar el PDF.', 503);
      return Buffer.from(await data.arrayBuffer());
    },
    async putOnce(path, bytes, expectedHash) {
      const { error } = await bucket.upload(path, bytes, { contentType: 'application/pdf', upsert: false, cacheControl: '0' });
      if (!error) return;
      // Si se subió antes de una caída, solo reutilizar el objeto al verificarlo.
      const existing = await this.read(path);
      if (sha256(existing) !== expectedHash) {
        const issue = new PurchaseError('PDF_VERSION_CONFLICT', 'El PDF existente requiere revisión.');
        issue.manualReview = true; throw issue;
      }
    }
  };
}

function repositoryAdapter(db) {
  return {
    async claim() {
      const { data, error } = await db.rpc('adquirir_tarea_comprobante');
      checkDatabase(error); return data;
    },
    async complete(task, value) {
      const { error } = await db.rpc('finalizar_tarea_comprobante', { p_tarea: task.id, p_token: task.token_bloqueo, p_resultado: value });
      checkDatabase(error);
    },
    async fail(task, { code, manual, uncertain }) {
      const { error } = await db.rpc('fallar_tarea_comprobante', {
        p_tarea: task.id, p_token: task.token_bloqueo, p_codigo: code, p_revision: manual, p_incierto: uncertain
      });
      checkDatabase(error);
    }
  };
}

async function sendReceiptEmail(receipt, bytes, key) {
  const resend = new Resend(requiredSetting('RESEND_API_KEY'));
  const from = requiredSetting('EMAIL_FROM');
  const number = receiptNumber(receipt.numero);
  const { data, error } = await resend.emails.send({
    from, to: [receipt.email_destinatario],
    subject: `Comprobante de tu compra #${receipt.pedido_id} — Zapatillas Duoc`,
    text: `Gracias por tu compra en Zapatillas Duoc.\n\nAdjuntamos tu comprobante ${number}.\nPuedes consultar tus compras iniciando sesión en ${applicationUrl()}/cuenta/compras.\n\nDocumento de demostración académica, sin validez tributaria.`,
    attachments: [{ filename: `comprobante-${number}.pdf`, content: bytes }]
  }, { idempotencyKey: key, signal: AbortSignal.timeout(15_000) });
  if (error || !data?.id) {
    const issue = new PurchaseError('EMAIL_PROVIDER_FAILED', 'El proveedor no confirmó el correo.', 503);
    issue.manualReview = error?.statusCode >= 400 && error?.statusCode < 500 && error?.statusCode !== 429;
    issue.deliveryUncertain = !error?.statusCode || error.statusCode >= 500;
    throw issue;
  }
  return { id: data.id };
}

export async function runReceiptWorker(limit = 2) {
  const db = createServerAdmin();
  return processReceiptTasks({ repository: repositoryAdapter(db), storage: storageAdapter(db), sendEmail: sendReceiptEmail, limit });
}
