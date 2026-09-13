import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { supabase } from '../../../../../lib/supabaseClient'; 

const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
const client = accessToken ? new MercadoPagoConfig({ accessToken }) : null;

export async function POST(request) {
  try {
    // 1. Leemos el cuerpo como texto plano primero para evitar que se rompa si viene vacío
    const textBody = await request.text();
    let body = {};
    
    if (textBody) {
      body = JSON.parse(textBody);
    }

    // 2. Extraemos los parámetros de la URL (a veces Mercado Pago envía la alerta por aquí)
    const { searchParams } = new URL(request.url);
    
    // El tipo de notificación puede venir en el JSON o en la URL
    const type = body.type || body.topic || searchParams.get('type') || searchParams.get('topic');
    // El ID del pago puede venir en el JSON o en la URL
    const paymentId = body.data?.id || searchParams.get('data.id') || searchParams.get('id');

    // Si es solo un ping de prueba o no es un pago, respondemos 200 OK para que MP esté feliz
    if (type !== 'payment' || !paymentId) {
      console.log("Webhook recibido pero no es un pago procesable (o es un ping).", { type, paymentId });
      return NextResponse.json({ success: true }, { status: 200 });
    }

    // 3. Buscamos el pago oficial en los servidores de Mercado Pago por seguridad
    const payment = new Payment(client);
    const paymentData = await payment.get({ id: paymentId });

    const estadoPago = paymentData.status; 
    const pedidoId = paymentData.external_reference; 

    if (!pedidoId) {
      console.log("⚠️ Pago sin external_reference. Ignorando...");
      return NextResponse.json({ received: true }, { status: 200 }); 
    }

    // 4. Traducimos el estado
    let estadoSupabase = 'pendiente';
    if (estadoPago === 'approved') {
      estadoSupabase = 'exitoso';
    } else if (estadoPago === 'rejected' || estadoPago === 'cancelled' || estadoPago === 'refunded') {
      estadoSupabase = 'erroneo';
    }

    // 5. Actualizamos Supabase
    const { error } = await supabase
      .from('pedidos')
      .update({ estado: estadoSupabase })
      .eq('id', pedidoId);

    if (error) {
      console.error("❌ Error actualizando Supabase:", error.message);
      return NextResponse.json({ error: 'Error de base de datos' }, { status: 500 });
    }

    console.log(`✅ Pedido ${pedidoId} actualizado correctamente a estado: ${estadoSupabase}`);

    // 6. Respuesta final obligatoria
    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error("❌ Error crítico en el Webhook:", error);
    return NextResponse.json({ error: 'Error procesando el Webhook' }, { status: 500 });
  }
}