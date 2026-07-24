import { GoogleGenerativeAI } from '@google/generative-ai';

// Inicializar la API de Gemini con la clave de las variables de entorno
const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

export const getGeminiResponse = async (prompt) => {
  try {
    if (!apiKey) {
      throw new Error("API Key de Gemini no configurada. Añade NEXT_PUBLIC_GEMINI_API_KEY en tu archivo .env.local");
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // Usamos gemini-1.5-flash ya que es rápido e ideal para chatbots
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error al obtener respuesta de Gemini:", error);
    return "Lo siento, tuve un problema al procesar tu solicitud. ¿Podrías intentar de nuevo?";
  }
};
