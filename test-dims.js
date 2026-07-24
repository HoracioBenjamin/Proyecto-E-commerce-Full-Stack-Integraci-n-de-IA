import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
  try {
    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
      modelName: 'models/gemini-embedding-001',
    });
    const queryVector = await embeddings.embedQuery("jeans");
    console.log("Vector length:", queryVector.length);
  } catch (err) {
    console.error("Error:", err);
  }
}
run();
