'use client';

export async function purchaseRequest(path, token, { signal, pdf = false } = {}) {
  const response = await fetch(path, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store', signal });
  if (!response.ok) {
    const result = await response.json().catch(() => null);
    const error = new Error(result?.error?.message ?? 'No pudimos consultar la compra. Intenta nuevamente.');
    error.code = result?.error?.code;
    throw error;
  }
  return pdf ? response.blob() : response.json();
}

export async function downloadReceipt(id, token, signal) {
  const blob = await purchaseRequest(`/api/cuenta/compras/${encodeURIComponent(id)}/comprobante`, token, { signal, pdf: true });
  if (signal?.aborted) return;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = `comprobante-pedido-${id}.pdf`;
  document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const formatPurchaseMoney = (value) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(Number(value));
export const formatPurchaseDate = (value) => new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeZone: 'America/Santiago' }).format(new Date(value));

export function receiptLabel(order) {
  if (order.comprobante?.estado_documento === 'anulado') return 'Comprobante anulado';
  if (order.estado !== 'exitoso') return order.estado === 'pendiente' ? 'Disponible al confirmarse el pago' : 'Sin comprobante de pago aprobado';
  if (!order.comprobante) return 'Sin comprobante disponible para esta compra';
  if (order.comprobante.estado_pdf === 'disponible') return 'Comprobante disponible';
  if (order.comprobante.estado_pdf === 'error') return 'Preparación pendiente de reintento';
  return 'Estamos preparando tu comprobante';
}
