import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { createHash } from 'node:crypto';
import { validateSnapshot } from './snapshot.mjs';
import { PurchaseError, receiptNumber } from './errors.mjs';

const navy = rgb(0, 0.157, 0.333);
const gray = rgb(0.36, 0.39, 0.43);
const money = (value) => `$${new Intl.NumberFormat('es-CL').format(value)}`;
export const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

export async function createReceiptPdf(receipt) {
  const snapshot = validateSnapshot(receipt.datos_emision);
  const created = new Date(receipt.created_at);
  const paid = new Date(receipt.datos_emision.fecha_pago);
  if (!Number.isFinite(created.getTime()) || !Number.isFinite(paid.getTime())) throw new PurchaseError('INVALID_PDF_DATE', 'No hay una fecha verificada para emitir el documento.', 409);
  const document = await PDFDocument.create({ updateMetadata: false });
  document.setTitle(`Comprobante ${receiptNumber(receipt.numero)}`);
  document.setAuthor('Zapatillas Duoc — Proyecto académico');
  document.setCreator('Zapatillas Duoc');
  document.setCreationDate(created);
  document.setModificationDate(created);
  const font = await document.embedFont(StandardFonts.Helvetica);
  const bold = await document.embedFont(StandardFonts.HelveticaBold);
  let page; let y; const pages = [];
  const left = 42; const right = 553; const width = right - left;
  const text = (value, x, positionY, size = 10, typeface = font, color = gray) => {
    const content = String(value).replace(/[\r\n\t]/g, ' ');
    try { typeface.encodeText(content); }
    catch { throw new PurchaseError('PDF_FONT_REQUIRED', 'El documento necesita una fuente que admita los caracteres del pedido.', 409); }
    page.drawText(content, { x, y: positionY, size, font: typeface, color });
  };
  const wrap = (value, available, size = 10, typeface = font) => {
    const lines = []; let current = '';
    for (const character of String(value).replace(/[\r\n\t]/g, ' ')) {
      let fits;
      try { fits = typeface.widthOfTextAtSize(current + character, size) <= available; }
      catch { throw new PurchaseError('PDF_FONT_REQUIRED', 'El documento necesita una fuente compatible con el pedido.', 409); }
      if (!fits && current) { lines.push(current.trimEnd()); current = ''; }
      current += character;
    }
    if (current || !lines.length) lines.push(current.trimEnd());
    return lines;
  };
  const tableHeader = () => {
    page.drawRectangle({ x: left, y: y - 7, width, height: 23, color: navy });
    text('Producto / variante', left + 8, y, 9, bold, rgb(1, 1, 1));
    text('Cant.', 344, y, 9, bold, rgb(1, 1, 1));
    text('Precio', 390, y, 9, bold, rgb(1, 1, 1));
    text('Importe', 480, y, 9, bold, rgb(1, 1, 1));
    y -= 30;
  };
  const newPage = (withTable = false) => {
    page = document.addPage([595.28, 841.89]); pages.push(page); y = 790;
    text('ZAPATILLAS DUOC', left, y, 17, bold, navy);
    text('Comprobante de compra', left, y - 25, 13, bold, navy);
    text(receiptNumber(receipt.numero), 400, y - 25, 12, bold, navy);
    page.drawLine({ start: { x: left, y: y - 39 }, end: { x: right, y: y - 39 }, thickness: 2, color: rgb(1, 0.72, 0) });
    y -= 63;
    if (withTable) tableHeader();
  };
  newPage();
  const info = [
    `Pedido: ${receipt.pedido_id}  |  Pago: ${receipt.pago_id}`,
    `Fecha de pago: ${new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Santiago' }).format(paid)}`,
    `Cliente: ${snapshot.cliente.nombre}`,
    `Correo: ${snapshot.cliente.email}`
  ];
  for (const value of info) {
    for (const line of wrap(value, width)) { text(line, left, y); y -= 14; }
  }
  y -= 12; tableHeader();
  for (const line of snapshot.lineas) {
    const names = wrap(line.nombre, 282, 10, bold);
    const variants = wrap([line.marca, line.color, `Talla ${line.talla}`].filter(Boolean).join(' · '), 282, 9);
    const height = (names.length + variants.length) * 13 + 17;
    if (y - height < 100) newPage(true);
    let lineY = y;
    for (const name of names) { text(name, left + 8, lineY, 10, bold, navy); lineY -= 13; }
    for (const variant of variants) { text(variant, left + 8, lineY, 9); lineY -= 13; }
    text(line.cantidad, 348, y, 10);
    text(money(line.precio_unitario), 385, y, 9);
    text(money(line.total_linea), 477, y, 9);
    y -= height;
    page.drawLine({ start: { x: left, y: y + 7 }, end: { x: right, y: y + 7 }, thickness: 0.5, color: rgb(0.88, 0.89, 0.91) });
  }
  if (y < 205) newPage();
  y -= 15;
  for (const [label, value] of [['Subtotal', snapshot.subtotal], ['Descuento adicional', snapshot.descuento], ['Envío', snapshot.costo_envio], ['TOTAL PAGADO (CLP)', snapshot.total]]) {
    const total = label.startsWith('TOTAL');
    text(label, 300, y, total ? 11 : 10, total ? bold : font, navy);
    text(money(value), 460, y, total ? 11 : 10, total ? bold : font, navy);
    y -= total ? 25 : 20;
  }
  text(`Entrega: ${snapshot.tipo_envio === 'domicilio' ? 'A domicilio' : 'Presencial'}`, left, y - 8, 10);
  for (const [index, target] of pages.entries()) {
    page = target;
    text('Documento de demostración académica, sin validez tributaria', left, 48, 9);
    text(`${index + 1} / ${pages.length}`, 515, 48, 9);
  }
  const bytes = Buffer.from(await document.save({ useObjectStreams: false }));
  return { bytes, sha256: sha256(bytes), emitido_at: created.toISOString() };
}
