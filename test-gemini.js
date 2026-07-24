import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';

// Leer la API Key directamente del .env.local
const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const match = envContent.match(/NEXT_PUBLIC_GEMINI_API_KEY=["']?([^"'\n]+)["']?/);
const apiKey = match ? match[1] : null;

if (!apiKey) {
  console.log("❌ No se pudo extraer la API Key de .env.local");
  process.exit(1);
}

console.log("✅ API Key encontrada:", apiKey.substring(0, 10) + "...");

const ai = new GoogleGenAI({ apiKey });

async function checkModels() {
  // Primero listamos todos los modelos disponibles para esta API Key
  console.log("\n📋 Listando modelos disponibles para tu API Key...\n");
  try {
    const response = await ai.models.list();
    const embeddingModels = [];
    for await (const model of response) {
      if (model.name.includes('embed') || model.name.includes('Embed')) {
        embeddingModels.push(model.name);
        console.log(`  ✅ ${model.name}`);
      }
    }
    if (embeddingModels.length === 0) {
      console.log("  ❌ No se encontraron modelos de embedding para esta API Key.");
    }
  } catch(e) {
    console.log("Error listando modelos:", e.message);
  }
  console.log("\n--- Prueba finalizada ---");
}

checkModels();