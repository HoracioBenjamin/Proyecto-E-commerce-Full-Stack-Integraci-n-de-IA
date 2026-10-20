# 🛍️ Resumen del Proyecto

**E-commerce Full-Stack Moderno con Integración de Pagos, RAG Autónomo y Copiloto de IA**

Proyecto académico (Duoc UC): una plataforma de comercio electrónico de alta fidelidad orientada al **sector retail (ropa y calzado)**, con arquitectura de componentes reactivos, base de datos relacional con desnormalización estratégica para vectores, procesamiento asíncrono de pagos y un asistente conversacional RAG (Retrieval-Augmented Generation).

---

## 📦 ¿Qué incluye?

| Sección | Detalle |
|---|---|
| **Páginas** | Home, catálogo por categoría (`/productos/[categoria]`), detalle de producto, ofertas, login/registro, checkout con estados (`exito`, `fallo`, `pendiente`) |
| **Carrito** | Contexto de React (`CartContext`) + `CartDrawer` |
| **Pagos** | Mercado Pago (Preference en CLP + Webhooks servidor-a-servidor para confirmar el estado del pago) |
| **IA** | Asistente RAG (`/api/chat`) con LangChain + Google Gemini, ventana de chat flotante, embeddings con `text-embedding-001` |
| **APIs** | `/api/chat`, `/api/checkout/mercadopago`, `/api/webhooks/mercadopago`, `/api/generate-embeddings`, `/api/dashboard` |
| **Dashboard** | Dashboard administrativo externo hecho en **Ionic**, que se sincroniza vía triggers/webhooks |

---

## 💻 Lenguajes y Tecnologías

- **Frontend:** JavaScript (JSX) con **Next.js 16** (App Router) + **React 19**
- **Estilos:** **Tailwind CSS 4** + **MUI (Material UI) 7** + Emotion, animaciones con **Framer Motion** y **Swiper**
- **Backend:** Route Handlers de Next.js (serverless) — no hay servidor aparte
- **Lenguaje:** el código real es **JavaScript**; los archivos TypeScript (`tsconfig.json`, `next-env.d.ts`) son generados por Next.js

---

## 🗄️ Base de datos

- **Supabase (PostgreSQL)** con extensión **pgvector** para búsqueda por similitud vectorial
- **Tablas:** `productos`, `pedidos`, `detalles_pedido`, `envios`, `direcciones`, `metodos_pago`, `stock`, entre otras
- **Patrón clave:**
  - Columna `metadata` (JSONB) desnormalizada en `productos` → encapsula relaciones 1-a-N (tallas, stock, marcas, categorías) y elimina JOINs costosos en las búsquedas vectoriales
  - **Triggers de PostgreSQL** (`BEFORE INSERT/UPDATE`) que construyen el `metadata` automáticamente y propagan cambios de inventario
  - **Database Webhooks** de Supabase → notifican a `/api/generate-embeddings` cuando entra un producto nuevo

---

## 🤖 Inteligencia Artificial

- **Stack:** **LangChain** (LCEL + `SupabaseVectorStore`) + **Google Gemini** (`@google/genai`, `@langchain/google-genai`)
- **Pipeline:** consulta → embedding (768 dimensiones) → recuperación vectorial → `PromptTemplate` → `gemini-3.5-flash` → `StringOutputParser`
- **Protecciones (AI Hardening):**
  - Sanitización de entrada: validación de tipo y largo máx. 250 caracteres
  - System Prompt blindado: solo responde como asistente de ventas de ropa

---

## 💳 Pasarela de pagos

- **Mercado Pago** (SDK oficial)
  - Preferencia dinámica en pesos chilenos (CLP) con el ID del pedido en `external_reference`
  - Webhook servidor-a-servidor (`/api/webhooks/mercadopago`) que actualiza el estado del pedido de forma asíncrona

---

## 🔑 Variables de entorno (`.env.local`)

| Variable | Uso |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | Conexión a Supabase |
| `MERCADOPAGO_ACCESS_TOKEN` / `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` | Mercado Pago |
| `NEXT_PUBLIC_GEMINI_API_KEY` | Google Gemini (IA) |
| `NEXT_PUBLIC_BASE_URL` | URL base de la app |
| `WEBHOOK_SECRET` | Seguridad de webhooks |

---

## 📁 Estructura de carpetas

```
src/
├── app/                  # Páginas (App Router) + APIs
│   ├── api/              # Route Handlers (chat, checkout, webhooks, embeddings, dashboard)
│   ├── checkout/         # Checkout, exito, fallo, pendiente
│   ├── productos/        # Catálogo por categoría y detalle
│   ├── login/ registro/  # Autenticación
│   └── ofertas/          # Ofertas
├── components/           # UI (navbar, footer, carrito, categorías, IA)
│   ├── context/          # CartContext
│   └── IA/               # AiAssistant, AiChatButton, AiChatWindow
└── services/             # geminiService.js
lib/                      # Utilidades
public/                   # Assets estáticos
```

---

## 🧠 En una frase

> **Next.js + Supabase/PostgreSQL con pgvector, Mercado Pago y un chat RAG con LangChain/Gemini para una tienda de ropa.**
