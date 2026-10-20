import { test, before, beforeEach, afterEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { snapshotFixture, checkoutFixture } from './fixtures.mjs';

let db;
before(async () => {
  db = new PGlite();
  // Esquema ficticio basado en el código: no es introspección del proyecto real.
  await db.exec(`
    CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
    CREATE TABLE public.metodos_pago(id bigint PRIMARY KEY,nombre text);
    CREATE TABLE public.productos(id bigint PRIMARY KEY,nombre text,precio bigint,precio_oferta bigint,en_oferta boolean);
    CREATE TABLE public.stock(producto_id bigint,talla text,cantidad integer,UNIQUE(producto_id,talla));
    CREATE TABLE public.pedidos(id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,perfil_id uuid,nombre_cliente text,email text,telefono text,total bigint,estado text,metodo_pago_id bigint,created_at timestamptz DEFAULT now(),fecha_pago timestamptz);
    CREATE TABLE public.detalles_pedido(pedido_id bigint REFERENCES public.pedidos,producto_id bigint,cantidad integer,precio_unitario bigint,talla text);
    CREATE TABLE public.envios(pedido_id bigint,tipo_envio text,estado_logistico text,nombre_destinatario text,rut_destinatario text,telefono_contacto text,direccion text,region_id bigint,comuna_id bigint,estacion_metro text,costo_envio bigint);
    CREATE SCHEMA storage;
    CREATE TABLE storage.buckets(id text PRIMARY KEY,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    CREATE TABLE storage.objects(id uuid DEFAULT gen_random_uuid(),bucket_id text,name text);
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
    INSERT INTO public.metodos_pago VALUES(1,'Mercado Pago');
    INSERT INTO public.productos VALUES(1,'Zapatilla de prueba',40000,35000,true);
    INSERT INTO public.stock VALUES(1,'42',10);
    GRANT USAGE ON SCHEMA public TO service_role;
    GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
    GRANT USAGE,SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;
  `);
  const directory = new URL('../../supabase/migrations/', import.meta.url);
  for (const name of (await readdir(directory)).filter((value) => value.endsWith('.sql')).sort()) {
    await db.exec(await readFile(new URL(name, directory), 'utf8'));
  }
});
beforeEach(async () => db.exec('BEGIN'));
afterEach(async () => db.exec('ROLLBACK'));
after(async () => db?.close());

async function createOrder() {
  const result = await db.query('SELECT public.crear_pedido_comprobante($1::uuid,$2::jsonb,$3::jsonb) AS value', [
    '11111111-1111-4111-8111-111111111111', JSON.stringify(snapshotFixture()), JSON.stringify(checkoutFixture().datos_envio)
  ]);
  return result.rows[0].value.pedido_id;
}
async function pay(id, extra = {}) {
  const event = { id: `10000${id}`, pedido_id: id, status: 'approved', monto: 70010, moneda: 'CLP', fecha_aprobacion: '2026-10-20T12:00:00Z', monto_reembolsado: 0, ...extra };
  const result = await db.query('SELECT public.registrar_pago_comprobante($1::jsonb) AS value', [JSON.stringify(event)]);
  return result.rows[0].value;
}
async function claim() { return (await db.query('SELECT public.adquirir_tarea_comprobante() AS value')).rows[0].value; }
async function complete(work, result) { await db.query('SELECT public.finalizar_tarea_comprobante($1::uuid,$2::uuid,$3::jsonb)', [work.tarea.id, work.tarea.token_bloqueo, JSON.stringify(result)]); }

test('todas las migraciones crean tablas y funciones ejecutables solo por servidor', async () => {
  const result = await db.query("SELECT has_function_privilege('authenticated','public.registrar_pago_comprobante(jsonb)','EXECUTE') AS browser, has_table_privilege('anon','public.comprobantes','SELECT') AS anon");
  assert.equal(result.rows[0].browser, false); assert.equal(result.rows[0].anon, false);
});
test('creación de pedido transaccional almacena snapshot y no inventa reserva de stock', async () => {
  await db.exec('SET LOCAL ROLE service_role');
  const id = await createOrder();
  const result = await db.query('SELECT p.compra_snapshot,p.estado,(SELECT count(*) FROM public.detalles_pedido d WHERE d.pedido_id=p.id) AS lineas FROM public.pedidos p WHERE id=$1', [id]);
  assert.equal(result.rows[0].estado, 'pendiente');
  assert.equal(result.rows[0].compra_snapshot.total, 70010);
  assert.equal(Number(result.rows[0].lineas), 1);
  assert.equal((await db.query('SELECT cantidad FROM public.stock')).rows[0].cantidad, 10);
});
test('notificaciones duplicadas y cambio de catálogo no duplican ni cambian el snapshot', async () => {
  const id = await createOrder();
  const first = await pay(id); const second = await pay(id);
  assert.equal(first.comprobante_id, second.comprobante_id);
  await db.exec("UPDATE public.productos SET nombre='Otro nombre',precio_oferta=99999");
  const count = await db.query('SELECT count(*) AS count FROM public.comprobantes');
  assert.equal(Number(count.rows[0].count), 1);
  const receipt = (await db.query('SELECT datos_emision FROM public.comprobantes')).rows[0];
  assert.equal(receipt.datos_emision.lineas[0].nombre, 'Zapatilla de prueba');
});
test('solo un worker adquiere la tarea mientras su lease esté vigente', async () => {
  const id = await createOrder(); await pay(id);
  const work = await claim();
  assert.equal(work.tarea.tipo, 'generar_pdf');
  assert.equal(await claim(), null);
});
test('un lease vencido se recupera y un token anterior no finaliza la tarea', async () => {
  const id = await createOrder(); await pay(id); const old = await claim();
  await db.query("UPDATE public.comprobante_tareas SET bloqueado_hasta=now()-interval '1 minute' WHERE id=$1", [old.tarea.id]);
  const current = await claim();
  assert.notEqual(old.tarea.token_bloqueo, current.tarea.token_bloqueo);
  await assert.rejects(() => complete(old, {}), { code: '55000' });
});
test('PDF disponible crea una sola tarea de correo y esta termina como aceptada', async () => {
  const id = await createOrder(); await pay(id); const pdf = await claim();
  await complete(pdf, { storage_path: `pedidos/${id}/test.pdf`, sha256: 'a'.repeat(64), emitido_at: '2026-10-20T12:00:00Z' });
  const email = await claim(); assert.equal(email.tarea.tipo, 'enviar_correo');
  await complete(email, { proveedor_id: 'correo-ficticio' });
  assert.equal((await db.query('SELECT estado_correo FROM public.comprobantes')).rows[0].estado_correo, 'aceptado');
  assert.equal(await claim(), null);
});
test('rechazado no emite PDF; reembolso anula y cancela trabajo pendiente', async () => {
  const id = await createOrder(); await pay(id, { status: 'rejected' });
  assert.equal((await db.query('SELECT count(*) AS count FROM public.comprobantes')).rows[0].count, 0);
  await pay(id); await pay(id, { status: 'refunded' });
  assert.equal((await db.query('SELECT estado_documento FROM public.comprobantes')).rows[0].estado_documento, 'anulado');
  assert.equal(await claim(), null);
});
test('monto distinto y segundo pago aprobado para el mismo pedido se rechazan', async () => {
  const id = await createOrder();
  await db.exec('SAVEPOINT bad_amount');
  await assert.rejects(() => pay(id, { monto: 1 }), { code: '23514' });
  await db.exec('ROLLBACK TO SAVEPOINT bad_amount');
  await pay(id);
  await assert.rejects(() => pay(id, { id: 'otro-pago' }), { code: '23505' });
});
