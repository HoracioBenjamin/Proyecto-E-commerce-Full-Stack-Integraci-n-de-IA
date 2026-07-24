import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { PromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';

// 1. Cliente de Supabase y 2. Embeddings 
const supabaseClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY);
const embeddings = new GoogleGenerativeAIEmbeddings({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY, model: 'models/gemini-embedding-001' });

// 3. VectorStore y Retriever
const vectorStore = new SupabaseVectorStore(embeddings, { client: supabaseClient, tableName: 'productos', queryName: 'match_productos', contentColumn: 'nombre' });
const retriever = vectorStore.asRetriever({ k: 5 });

// 4. Modelo de Chat 
const model = new ChatGoogleGenerativeAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY, model: 'gemini-3.5-flash', temperature: 0.7 });

// 5. Helper formatDocs
const formatDocs = (docs) => {
  if (!docs || docs.length === 0) return 'No se encontraron productos.';
  return docs.map((doc) => {
    const meta = doc.metadata || {};
    const nombre = meta.nombre || doc.pageContent;

    // Capturamos los campos de la imagen
    const precioNormal = meta.precio ? `$${meta.precio}` : 'N/A';
    const enOferta = meta.en_oferta === true;
    const precioOferta = meta.precio_oferta ? `$${meta.precio_oferta}` : '';

    const marca = meta.marca ? `*Marca: ${meta.marca}*` : '';
    const color = meta.color ? `🎨 **Color:** ${meta.color}` : '';
    const imagenUrl = meta.imagen_url ? meta.imagen_url : '';

    let stockInfo = '';
    if (Array.isArray(meta.stock) && meta.stock.length > 0) {
      stockInfo = `📦 **Tallas:** ` + meta.stock.map((s) => `**${s.talla}** (${s.cantidad} ud)`).join(', ');
    }

    // Lógica para mostrar el precio dependiendo de si hay oferta o no
    let bloquePrecio = '';
    if (enOferta && precioOferta) {
      // Si está en oferta, tachamos el precio normal (usando ~~texto~~ en Markdown) y destacamos la oferta
      bloquePrecio = `💰 **Precio Original:** ~~${precioNormal}~~ \n🔥 **¡PRECIO DE OFERTA!: ${precioOferta}**\n`;
    } else {
      // Si no está en oferta, mostramos el precio normal
      bloquePrecio = `💰 **Precio:** ${precioNormal}\n`;
    }

    let bloque = `### 👕 ${nombre} ${marca}\n`;
    if (imagenUrl) bloque += `![${nombre}](${imagenUrl})\n\n`;

    // Insertamos el bloque de precio dinámico
    bloque += bloquePrecio;

    if (color) bloque += `${color}\n`;
    if (stockInfo) bloque += `${stockInfo}\n`;

    return bloque;
  }).join('\n\n---\n\n');
};

export async function POST(request) {
  try {
    // 🎯 AHORA RECIBIMOS EL MENSAJE Y EL HISTORIAL
    const { message, history = [] } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'El mensaje es requerido' }, { status: 400 });
    }

    // Convertimos el historial a un bloque de texto para que el LLM lo entienda fácilmente
    const chatHistoryText = history
      .map(msg => `${msg.sender === 'user' ? 'Cliente' : 'Asistente'}: ${msg.text}`)
      .join('\n');

    // --- 🤖 PASO A: REFORMULAR LA PREGUNTA (Query Condensation) ---
    // Si el usuario dice "y en rojo?", la IA lo transforma a "tienes jeans en color rojo?"
    const promptReformular = PromptTemplate.fromTemplate(
      `Dada la siguiente conversación y la pregunta final del cliente, reformula la pregunta final para que sea una pregunta independiente y completa, sin cambiar su intención original.
      Si la pregunta ya es clara por sí sola, devuélvela tal cual. No respondas a la pregunta, SOLO reformúlala.
      
      Historial de conversación:
      {chat_history}
      
      Pregunta final del cliente: {question}
      
      Pregunta reformulada:`
    );

    const cadenaReformuladora = RunnableSequence.from([
      promptReformular,
      model,
      new StringOutputParser(),
    ]);

    // Generamos la pregunta optimizada para la base de datos
    const preguntaOptimizada = await cadenaReformuladora.invoke({
      chat_history: chatHistoryText || "Sin historial previo.",
      question: message.trim()
    });

    console.log("Pregunta original:", message);
    console.log("Pregunta optimizada para BD:", preguntaOptimizada);

    // --- 🤖 PASO B: RESPUESTA FINAL CON CONTEXTO ---
    const promptTemplate = PromptTemplate.fromTemplate(
      `Eres un asistente experto en ventas de una tienda de ropa. 
      Tu ÚNICA función es recomendar ropa del catálogo proporcionado.
      
      Historial de la charla:
      {chat_history}

      Pregunta del cliente: "{question}"

      Productos encontrados en nuestro catálogo (Contexto):
      {context}

      REGLAS DE FORMATO Y COMPORTAMIENTO:
      1. Muestra los productos usando exactamente el formato Markdown proporcionado en el contexto (no alteres cómo se muestran las imágenes ni los precios).
      2. Usa un tono amable y conversacional. 
      3. Bajo NINGUNA circunstancia inventes productos.
      4. 🚫 REGLA ESTRICTA: NO digas "Hola", "¡Hola de nuevo!" ni ningún saludo similar si ya existe un "Historial de la charla". Ve directo a la respuesta de forma natural y amigable.`
    );

    const chain = RunnableSequence.from([
      {
        context: async (input) => {
          // Buscamos en la BD usando la pregunta OPTIMIZADA
          const docs = await retriever.invoke(input.pregunta_optimizada);
          return formatDocs(docs);
        },
        question: (input) => input.question,
        chat_history: (input) => input.chat_history,
      },
      promptTemplate,
      model,
      new StringOutputParser(),
    ]);

    const respuestaFinal = await chain.invoke({
      question: message.trim(),
      pregunta_optimizada: preguntaOptimizada,
      chat_history: chatHistoryText
    });

    return NextResponse.json({ reply: respuestaFinal });

  } catch (err) {
    console.error('Error en RAG con Memoria:', err);
    return NextResponse.json({ error: 'Error generando respuesta' }, { status: 500 });
  }
}
/* =====================================================================
   CÓDIGO ANTERIOR: RAG NATIVO (Guardado para referencia de aprendizaje)
   ===================================================================== 
   
import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabaseClient';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });

export async function POST(request) {
  try {
    const { message } = await request.json();
    if (!message) {
      return NextResponse.json({ error: 'El mensaje es requerido' }, { status: 400 });
    }

    // --- PASO 1: Convertir la pregunta del usuario en un vector ---
    const embeddingResult = await ai.models.embedContent({
      model: 'models/gemini-embedding-001',
      contents: message,
      config: { outputDimensionality: 768 },
    });
    const queryEmbedding = embeddingResult.embeddings[0].values;

    // --- PASO 2: Buscar productos similares en Supabase (RAG: Retrieval) ---
    const { data: productosRelevantes, error } = await supabase.rpc('match_productos', {
      query_embedding: queryEmbedding,
      match_threshold: 0.5,  // Mínimo 50% de similitud
      match_count: 5,         // Máximo 5 productos
    });

    if (error) {
      console.error('Error en match_productos:', error);
    }

    // --- PASO 3: Construir el prompt con contexto (RAG: Augmentation) ---
    let contexto = '';
    if (productosRelevantes && productosRelevantes.length > 0) {
      contexto = productosRelevantes
        .map(p => \`- \${p.nombre}: \${p.descripcion} (Precio: $\${p.precio})\`)
        .join('\\n');
    }

    const prompt = contexto
      ? \`Eres un asistente de una tienda de ropa. Responde de forma amigable y concisa.
         
         El cliente preguntó: "\${message}"
         
         Basándote SOLO en estos productos de nuestro catálogo que son relevantes a su consulta:
         \${contexto}
         
         Da una respuesta útil mencionando los productos encontrados. Si ninguno es ideal, dilo honestamente.\`
      : \`Eres un asistente de una tienda de ropa. El cliente preguntó: "\${message}".
         No encontramos productos específicos para esa búsqueda en nuestro catálogo. 
         Responde amablemente y sugiere que intente con otros términos.\`;

    // --- PASO 4: Gemini genera la respuesta final (RAG: Generation) ---
    const chatModel = ai.getGenerativeModel 
      ? ai.getGenerativeModel({ model: 'gemini-1.5-flash' })
      : null;

    // Usamos el nuevo SDK correctamente
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
    });

    const respuestaFinal = response.text;

    return NextResponse.json({ reply: respuestaFinal });

  } catch (err) {
    console.error('Error en /api/chat:', err);
    return NextResponse.json({ error: 'Error generando respuesta' }, { status: 500 });
  }
}
*/
