import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabaseClient';
import { GoogleGenAI } from '@google/genai';

// Nueva librería compatible con las claves AQ. de Google AI Studio
const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });

export async function POST(request) {
  try {
    // BARRERA DE SEGURIDAD: Validar el token secreto
    const secretHeader = request.headers.get('x-webhook-secret');
    
    if (secretHeader !== process.env.WEBHOOK_SECRET) {
      console.warn('⚠️ Intento de acceso no autorizado al Webhook.');
      return NextResponse.json(
        { error: 'No autorizado. Se requiere un token secreto válido.' }, 
        { status: 401 }
      );
    }

    // 1. Obtener productos que NO tienen embedding todavía
    const { data: productos, error } = await supabase
      .from('productos')
      .select('id, nombre, descripcion')
      .is('embedding', null); // Solo traemos los que están vacíos

    if (error) throw error;
    if (!productos || productos.length === 0) {
      return NextResponse.json({ message: 'Todos los productos ya tienen embedding.' });
    }

    let generados = 0;

    // 2. Procesar cada producto uno por uno
    for (const prod of productos) {
      // Unimos la información para crear el "Contexto Semántico"
      const textoRepresentativo = `Producto: ${prod.nombre}. Descripción: ${prod.descripcion}`;

      // 🎯 CAMBIO CLAVE: Llamamos a Gemini sin limitarle las dimensiones
      // Al no pasar 'config', Gemini genera sus 3072 dimensiones por defecto, 
      // encajando perfecto con tu nueva base de datos.
      const result = await ai.models.embedContent({
        model: 'models/gemini-embedding-001',
        contents: textoRepresentativo,
      });
      
      const embeddingArray = result.embeddings[0].values;

      // 3. Guardar ese vector en la nueva columna de tu tabla de Supabase
      const { error: updateError } = await supabase
        .from('productos')
        .update({ embedding: embeddingArray })
        .eq('id', prod.id);

      if (updateError) {
        console.error(`Error actualizando producto ${prod.id}:`, updateError);
      } else {
        generados++;
      }
    }

    return NextResponse.json({
      message: `Proceso completado. Se generaron embeddings para ${generados} productos.`
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Hubo un problema generando los embeddings' }, { status: 500 });
  }
}