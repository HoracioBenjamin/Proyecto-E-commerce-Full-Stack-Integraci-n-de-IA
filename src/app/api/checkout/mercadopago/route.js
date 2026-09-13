import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { supabase } from '../../../../../lib/supabaseClient'; 

const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
const client = accessToken ? new MercadoPagoConfig({ accessToken }) : null;

export async function POST(request) {
  if (!client) {
    return NextResponse.json({ error: 'Configuración del servidor incompleta' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { 
      perfil_id, datos_envio, tipo_envio, costo_envio, 
      metodo_pago, productos, total_productos, total_pagar, metodo_invitado 
    } = body;

    if (!productos || !Array.isArray(productos) || productos.length === 0) {
      return NextResponse.json({ error: 'El carrito está vacío o es inválido' }, { status: 400 });
    }

    // =====================================================================
    // BLOQUE SUPABASE: INSERCIÓN DE DATOS ANTES DE CREAR EL PAGO
    // =====================================================================

    // 1. Normalizamos lo que viene del frontend para evitar errores de tipeo
    // Si viene "Mercado Pago" o "mercadopago", lo transformamos a un estándar para buscarlo
    const nombreMetodoBuscar = (metodo_pago || '').toString().toLowerCase().trim();

    let metodoPagoId = null;

    // Buscamos dinámicamente en la tabla metodos_pago
    if (nombreMetodoBuscar.includes('mercado') || nombreMetodoBuscar.includes('mp')) {
      // Caso A: Si el frontend mandó algo relacionado a Mercado Pago
      const { data: mpData } = await supabase
        .from('metodos_pago')
        .select('id')
        .ilike('nombre', '%mercado pago%') // Buscamos exactamente el nombre de tu fila
        .single();
        
      metodoPagoId = mpData?.id; 
    } 

    // --- SALVADO DE EMERGENCIA SEGURO (FALLBACK) ---
    // Si por alguna razón la base de datos falló o el método no coincide, 
    // apuntamos dinámicamente al primer ID real que exista en tu tabla, 
    // en lugar de inventar un número (como 1 o 2) que podría no existir.
    if (!metodoPagoId) {
      const { data: primerMetodo } = await supabase
        .from('metodos_pago')
        .select('id')
        .limit(1);
        
      // Si hay registros, toma el primero que encuentre en tu tabla (en tu caso será el 1)
      metodoPagoId = primerMetodo && primerMetodo.length > 0 ? primerMetodo[0].id : null;
    }

    // Si la tabla está absolutamente vacía en Supabase (lo cual no debería pasar porque ya tienes el ID 1)
    if (!metodoPagoId) {
      throw new Error("Error estructural: No existen métodos de pago registrados en la base de datos.");
    }

        // A. Crear el Pedido Principal (El Snapshot del Cliente)
        const { data: pedidoNuevo, error: errorPedido } = await supabase
          .from('pedidos')
          .insert({
            perfil_id: perfil_id || null, 
            nombre_cliente: `${datos_envio.nombre} ${datos_envio.apellido}`.trim(),
            email: datos_envio.email,
            telefono: datos_envio.telefono,
            total: total_pagar,
            estado: 'pendiente', 
            metodo_pago_id: metodoPagoId 
          })
          .select()
          .single();

        if (errorPedido) throw new Error(`Error creando pedido: ${errorPedido.message}`);
        const pedidoId = pedidoNuevo.id;

        // B. Insertar Detalles del Pedido (Tus productos)
        const detallesData = productos.map(item => ({
          pedido_id: pedidoId,
          producto_id: item.id,
          cantidad: item.quantity,
          precio_unitario: item.price_raw,
          talla: item.size // Agregamos la talla que vimos en tu diagrama
        }));

        const { error: errorDetalles } = await supabase
          .from('detalles_pedido')
          .insert(detallesData);

        if (errorDetalles) throw new Error(`Error guardando detalles: ${errorDetalles.message}`);

    // C. Guardar el Envío (El Snapshot Logístico de esta compra en particular)
        const { error: errorEnvio } = await supabase
          .from('envios')
          .insert({
            pedido_id: pedidoId,
            tipo_envio: tipo_envio,
            estado_logistico: 'preparacion',
            nombre_destinatario: `${datos_envio.nombre} ${datos_envio.apellido}`.trim(),
            rut_destinatario: datos_envio.rut || null,
            telefono_contacto: datos_envio.telefono,
            direccion: datos_envio.direccion || null, // También lo protegemos
            
            // AQUÍ ESTÁ LA MAGIA: Si hay dato lo convierte a número, si no, pasa null
            region_id: datos_envio.region ? Number(datos_envio.region) : null,
            comuna_id: datos_envio.comuna ? Number(datos_envio.comuna) : null,
            
            estacion_metro: datos_envio.estacionMetro || null,
            costo_envio: costo_envio
          });

        if (errorEnvio) throw new Error(`Error guardando envío: ${errorEnvio.message}`);

        // D. (Opcional) Guardar en la Libreta de Direcciones solo si hay un usuario registrado
        if (perfil_id) {
          await supabase
            .from('direcciones')
            .insert({
              perfil_id: perfil_id,
              nombre_direccion: 'Dirección de envío',
              nombre_destinatario: `${datos_envio.nombre} ${datos_envio.apellido}`.trim(),
              telefono_contacto: datos_envio.telefono,
              direccion: datos_envio.direccion,
              region_id: Number(datos_envio.region),
              comuna_id: Number(datos_envio.comuna),
              es_principal: true // O falso, dependiendo de tu lógica de negocio
            });
            // No arrojamos error aquí para no interrumpir el pago si falla la libreta de direcciones
        }

    // =====================================================================
    // BLOQUE MERCADO PAGO: CREACIÓN DE LA PREFERENCIA
    // =====================================================================

    const items = productos.map((item) => ({
      title: `${item.name} (Talla: ${item.size})`,
      quantity: Number(item.quantity) || 1,
      unit_price: Number(item.price_raw) || 0,
      currency_id: 'CLP'
    }));

    const envioNum = Number(costo_envio);
    if (envioNum > 0) {
      items.push({
        title: `Costo de Envío (${tipo_envio === 'domicilio' ? 'A Domicilio' : 'Entrega Presencial'})`,
        quantity: 1,
        unit_price: envioNum,
        currency_id: 'CLP'
      });
    }

const host = request.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https'; 
    const baseUrl = `${protocol}://${host}`;

const preference = new Preference(client);
    const result = await preference.create({
      body: {
        items,
        external_reference: pedidoId.toString(),
        back_urls: {
          // Estos pueden seguir usando baseUrl si quieres, o cámbialos a localhost
          success: `${baseUrl}/checkout/exito`,
          failure: `${baseUrl}/checkout/fallo`,
          pending: `${baseUrl}/checkout/pendiente`,
        },
        auto_return: 'approved',
        binary_mode: true, 
        
        // 👇 REEMPLAZA ESTA LÍNEA POR ESTO EXACTAMENTE 👇
        notification_url: "https://exfoliate-clapping-denim.ngrok-free.dev/api/webhooks/mercadopago",
      }
    });
    return NextResponse.json({ 
      id: result.id,
      init_point: result.init_point,
      sandbox_init_point: result.sandbox_init_point 
    });

  } catch (error) {
    console.error("❌ Error en el proceso de pago/base de datos:", error);
    return NextResponse.json({ error: 'Error interno al procesar el pedido' }, { status: 500 });
  }
}