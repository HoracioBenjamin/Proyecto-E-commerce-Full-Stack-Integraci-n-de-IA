import { PurchaseError, identifier, receiptNumber } from './errors.mjs';

const orderFields = 'id,created_at,estado,total,compra_snapshot';
const receiptFields = 'id,numero,pedido_id,estado_documento,estado_pdf,estado_correo,storage_path,pdf_sha256,emitido_at';

export function receiptSummary(receipt) {
  if (!receipt) return null;
  return {
    numero: receiptNumber(receipt.numero), estado_documento: receipt.estado_documento,
    estado_pdf: receipt.estado_pdf, estado_correo: receipt.estado_correo,
    emitido_at: receipt.emitido_at,
    descargable: receipt.estado_pdf === 'disponible' && receipt.estado_documento === 'vigente'
  };
}

export async function findOwnedOrder(db, userId, rawId, checkDatabase) {
  const id = identifier(rawId);
  const { data, error } = await db.from('pedidos').select(orderFields)
    .eq('id', id).eq('perfil_id', userId).maybeSingle();
  checkDatabase(error);
  if (!data) throw new PurchaseError('NOT_FOUND', 'No encontramos esa compra.', 404);
  return data;
}

export async function findOrderReceipt(db, orderId, checkDatabase) {
  const { data, error } = await db.from('comprobantes').select(receiptFields).eq('pedido_id', orderId).maybeSingle();
  checkDatabase(error); return data;
}

export async function listOwnedOrders(db, userId, { page, pageSize }, checkDatabase) {
  const { data, error, count } = await db.from('pedidos').select(orderFields, { count: 'exact' })
    .eq('perfil_id', userId).order('created_at', { ascending: false }).order('id', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);
  checkDatabase(error);
  const orders = data ?? [];
  let receipts = [];
  if (orders.length) {
    const result = await db.from('comprobantes').select(receiptFields).in('pedido_id', orders.map((order) => order.id));
    checkDatabase(result.error); receipts = result.data ?? [];
  }
  return {
    data: orders.map((order) => ({
      id: String(order.id), created_at: order.created_at, estado: order.estado, total: order.total,
      resumen: order.compra_snapshot?.lineas?.slice(0, 2).map((line) => `${line.nombre} · Talla ${line.talla}`).join(' / ') ?? null,
      comprobante: receiptSummary(receipts.find((receipt) => String(receipt.pedido_id) === String(order.id)))
    })),
    pagination: { page, pageSize, total: count ?? 0 }
  };
}

export async function orderDetail(db, userId, id, checkDatabase) {
  const order = await findOwnedOrder(db, userId, id, checkDatabase);
  const receipt = await findOrderReceipt(db, order.id, checkDatabase);
  let lines = order.compra_snapshot?.lineas ?? null;
  if (!lines) {
    const { data, error } = await db.from('detalles_pedido')
      .select('cantidad,precio_unitario,talla,productos(nombre,colores(nombre))').eq('pedido_id', order.id);
    checkDatabase(error);
    lines = (data ?? []).map((line) => ({
      nombre: line.productos?.nombre ?? 'Producto no disponible', color: line.productos?.colores?.nombre ?? '',
      talla: line.talla, cantidad: line.cantidad, precio_unitario: line.precio_unitario,
      total_linea: Number(line.precio_unitario) * Number(line.cantidad)
    }));
  }
  return {
    id: String(order.id), created_at: order.created_at, estado: order.estado, total: order.total,
    lineas: lines, snapshot_disponible: !!order.compra_snapshot,
    subtotal: order.compra_snapshot?.subtotal ?? null,
    descuento: order.compra_snapshot?.descuento ?? null,
    costo_envio: order.compra_snapshot?.costo_envio ?? null,
    tipo_envio: order.compra_snapshot?.tipo_envio ?? null,
    comprobante: receiptSummary(receipt)
  };
}
