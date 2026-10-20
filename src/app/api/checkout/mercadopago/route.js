import { MercadoPagoConfig, Preference } from 'mercadopago';
import { createServerAdmin } from '../../../../../lib/server/supabase';
import { requireUser } from '../../../../../lib/server/auth';
import { requiredSetting, applicationUrl } from '../../../../../lib/server/config';
import { privateJson, errorResponse, readJson, checkDatabase } from '../../../../../lib/server/http';
import { parseCheckout, buildSnapshot } from '../../../../../lib/comprobantes/snapshot.mjs';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const user = await requireUser(request, { optional: true });
    const checkout = parseCheckout(await readJson(request));
    const db = createServerAdmin();
    const baseUrl = applicationUrl();
    const client = new MercadoPagoConfig({ accessToken: requiredSetting('MERCADOPAGO_ACCESS_TOKEN'), options: { timeout: 15000 } });
    const { data: products, error } = await db.from('productos')
      .select('id,nombre,precio,precio_oferta,en_oferta,marcas(nombre),colores(nombre),stock(talla,cantidad)')
      .in('id', [...new Set(checkout.productos.map((item) => item.id))]);
    checkDatabase(error);
    const snapshot = buildSnapshot(checkout, products ?? []);
    const created = await db.rpc('crear_pedido_comprobante', {
      p_perfil_id: user?.id ?? null, p_snapshot: snapshot, p_envio: checkout.datos_envio
    });
    checkDatabase(created.error);
    const pedidoId = created.data.pedido_id;
    const items = snapshot.lineas.map((line) => ({
      id: line.producto_id, title: `${line.nombre} (Talla ${line.talla})`,
      quantity: line.cantidad, unit_price: line.precio_unitario, currency_id: 'CLP'
    }));
    if (snapshot.costo_envio > 0) items.push({ title: 'Costo de envío', quantity: 1, unit_price: snapshot.costo_envio, currency_id: 'CLP' });
    const preference = await new Preference(client).create({ body: {
      items, external_reference: String(pedidoId),
      back_urls: {
        success: `${baseUrl}/checkout/exito`, failure: `${baseUrl}/checkout/fallo`, pending: `${baseUrl}/checkout/pendiente`
      },
      auto_return: 'approved', binary_mode: true,
      notification_url: `${baseUrl}/api/webhooks/mercadopago`
    } });
    return privateJson({ pedido_id: pedidoId, id: preference.id, init_point: preference.init_point, sandbox_init_point: preference.sandbox_init_point });
  } catch (error) { return errorResponse(error); }
}
