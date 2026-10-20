import { z } from 'zod';
import { SHIPPING_RATES } from '../checkout-policy.mjs';
import { PurchaseError, assertPurchase, identifier } from './errors.mjs';

const money = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const text = (max) => z.string().trim().min(1).max(max);
const itemSchema = z.object({
  id: z.union([z.string(), z.number().int().positive()]),
  size: text(30), quantity: z.number().int().min(1).max(50),
  price_raw: money.optional()
});
export const checkoutSchema = z.object({
  productos: z.array(itemSchema).min(1).max(100),
  metodo_pago: z.literal('mercadopago'),
  tipo_envio: z.enum(['domicilio', 'presencial']),
  total_pagar: money.positive(),
  datos_envio: z.object({
    nombre: text(100), apellido: text(100), email: z.string().trim().email().max(320),
    telefono: text(40), rut: z.string().trim().max(30).optional().default(''),
    direccion: z.string().trim().max(300).optional().default(''),
    region: z.union([z.string(), z.number()]).optional().default(''),
    comuna: z.union([z.string(), z.number()]).optional().default(''),
    estacionMetro: z.string().trim().max(150).optional().default('')
  })
}).superRefine((value, ctx) => {
  if (value.tipo_envio === 'domicilio' && (!value.datos_envio.direccion || !value.datos_envio.region || !value.datos_envio.comuna)) {
    ctx.addIssue({ code: 'custom', message: 'Completa dirección, región y comuna.' });
  }
});

export const snapshotSchema = z.object({
  schema_version: z.literal(1), moneda: z.literal('CLP'),
  cliente: z.object({ nombre: text(201), email: z.string().email().max(320) }),
  lineas: z.array(z.object({
    producto_id: z.string().min(1), nombre: text(300), marca: z.string().max(150),
    color: z.string().max(150), talla: text(30), cantidad: z.number().int().min(1).max(50),
    precio_unitario: money.positive(), total_linea: money.positive()
  })).min(1).max(100),
  subtotal: money, descuento: money, costo_envio: money,
  tipo_envio: z.enum(['domicilio', 'presencial']), total: money.positive()
});

export function parseCheckout(body) {
  const result = checkoutSchema.safeParse(body);
  if (!result.success) throw new PurchaseError('INVALID_CHECKOUT', 'Revisa productos, cantidades, datos de envío y método de pago.');
  const merged = new Map();
  for (const item of result.data.productos) {
    const id = identifier(item.id);
    const key = `${id}\0${item.size}`;
    const previous = merged.get(key);
    const quantity = (previous?.quantity ?? 0) + item.quantity;
    assertPurchase(quantity <= 50, 'INVALID_QUANTITY', 'La cantidad por variante supera el máximo permitido.');
    merged.set(key, { ...item, id, quantity });
  }
  return { ...result.data, productos: [...merged.values()] };
}

function relationName(value) {
  const row = Array.isArray(value) ? value[0] : value;
  return typeof row?.nombre === 'string' ? row.nombre : '';
}

export function buildSnapshot(checkout, catalog) {
  const byId = new Map(catalog.map((product) => [String(product.id).toLowerCase(), product]));
  const lineas = checkout.productos.map((item) => {
    const product = byId.get(item.id);
    assertPurchase(product, 'PRODUCT_UNAVAILABLE', 'Uno de los productos ya no está disponible.', 409);
    const stock = product.stock?.find((row) => String(row.talla) === item.size);
    assertPurchase(stock && Number(stock.cantidad) >= item.quantity, 'INSUFFICIENT_STOCK', 'Una de las tallas no tiene existencias suficientes.', 409);
    const price = Number(product.en_oferta ? product.precio_oferta : product.precio);
    assertPurchase(Number.isSafeInteger(price) && price > 0, 'INVALID_CATALOG_PRICE', 'No se pudo confirmar el precio de un producto.', 409);
    assertPurchase(item.price_raw === undefined || item.price_raw === price, 'PRICE_CHANGED', 'Cambió el precio de un producto. Actualiza la bolsa antes de pagar.', 409);
    return {
      producto_id: item.id, nombre: product.nombre,
      marca: relationName(product.marcas), color: relationName(product.colores),
      talla: item.size, cantidad: item.quantity, precio_unitario: price,
      total_linea: price * item.quantity
    };
  });
  const subtotal = lineas.reduce((sum, line) => sum + line.total_linea, 0);
  const costo_envio = SHIPPING_RATES[checkout.tipo_envio];
  const total = subtotal + costo_envio;
  assertPurchase(total === checkout.total_pagar, 'PRICE_CHANGED', 'El total cambió. Revisa la bolsa y vuelve a confirmar la compra.', 409);
  return validateSnapshot({
    schema_version: 1, moneda: 'CLP',
    cliente: { nombre: `${checkout.datos_envio.nombre} ${checkout.datos_envio.apellido}`, email: checkout.datos_envio.email },
    lineas, subtotal, descuento: 0, costo_envio, tipo_envio: checkout.tipo_envio, total
  });
}

export function validateSnapshot(value) {
  const result = snapshotSchema.safeParse(value);
  if (!result.success) throw new PurchaseError('INVALID_SNAPSHOT', 'La compra no tiene un detalle verificable.', 409);
  const snapshot = result.data;
  const subtotal = snapshot.lineas.reduce((sum, line) => {
    assertPurchase(line.total_linea === line.cantidad * line.precio_unitario, 'INVALID_SNAPSHOT', 'Los importes del detalle no coinciden.', 409);
    return sum + line.total_linea;
  }, 0);
  assertPurchase(subtotal === snapshot.subtotal && snapshot.total === subtotal - snapshot.descuento + snapshot.costo_envio,
    'INVALID_SNAPSHOT', 'El total del comprobante no coincide con su detalle.', 409);
  return snapshot;
}
