export function checkoutFixture(extra = {}) {
  return {
    productos: [{ id: 1, size: '42', quantity: 2, price_raw: 35000 }],
    metodo_pago: 'mercadopago', tipo_envio: 'domicilio', total_pagar: 70010,
    datos_envio: { nombre: 'María', apellido: 'Muñoz', email: 'cliente@example.test', telefono: '5550100', rut: '', direccion: 'Calle de prueba 1', region: '1', comuna: '1' },
    ...extra
  };
}
export const catalogFixture = [{ id: 1, nombre: 'Zapatilla de prueba', precio: 40000, precio_oferta: 35000, en_oferta: true, marcas: { nombre: 'Marca académica' }, colores: { nombre: 'Rojo' }, stock: [{ talla: '42', cantidad: 10 }] }];
export function snapshotFixture() {
  return {
    schema_version: 1, moneda: 'CLP', cliente: { nombre: 'María Muñoz', email: 'cliente@example.test' },
    lineas: [{ producto_id: '1', nombre: 'Zapatilla de prueba', marca: 'Marca académica', color: 'Rojo', talla: '42', cantidad: 2, precio_unitario: 35000, total_linea: 70000 }],
    subtotal: 70000, descuento: 0, costo_envio: 10, tipo_envio: 'domicilio', total: 70010
  };
}
export function receiptFixture() {
  return {
    id: '00000000-0000-4000-8000-000000000001', numero: 1, pedido_id: '1', pago_id: '12345',
    created_at: '2026-10-20T12:00:00.000Z', estado_documento: 'vigente',
    datos_emision: { ...snapshotFixture(), fecha_pago: '2026-10-20T11:59:00.000Z' },
    email_destinatario: 'cliente@example.test'
  };
}
