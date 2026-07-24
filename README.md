E-commerce Full-Stack Moderno con Integración de Pagos, RAG Autónomo y Copiloto de IA
Este proyecto consiste en el diseño, desarrollo e implementación de una plataforma de comercio electrónico de alta fidelidad orientada al sector retail (ropa y calzado). El sistema destaca por una arquitectura limpia basada en componentes reactivos, un motor de base de datos relacional con desnormalización estratégica para vectores, procesamiento asíncrono de pagos, y un asistente conversacional RAG (Retrieval-Augmented Generation) impulsado por LangChain y Google Gemini.

1. Arquitectura del Frontend (React & Next.js)
El cliente de la aplicación está construido utilizando Next.js bajo la arquitectura moderna de App Router (app/).

Renderizado Eficiente: Combina componentes de servidor (Server Components) para maximizar la velocidad de carga inicial y el posicionamiento SEO, junto con componentes de cliente ('use client') como CheckoutClient.js para gestionar estados interactivos complejos (manejo del carrito de compras, selección dinámica de tallas y validación de formularios de envío).

Flujo del Checkout: El frontend empaqueta de forma segura la información logística del usuario (datos de envío, región, comuna) y el arreglo de productos seleccionados para despacharlos en una única petición HTTP POST hacia las APIs internas del servidor.

2. Infraestructura Backend y Base de Datos (Next.js APIs & Supabase)
La lógica de servidor y el almacenamiento de datos se desacoplan utilizando herramientas serverless de última generación, garantizando alta disponibilidad y escalabilidad.

Capa de Endpoints (API Routes): Rutas seguras (/api/checkout/mercadopago, /api/chat, /api/generate-embeddings) actúan como intermediarias para procesar las solicitudes del cliente, manejar variables de entorno privadas (tokens de acceso, llaves de API) y comunicarse con servicios externos sin exponer credenciales en el navegador.

Persistencia Relacional + PgVector (Supabase / PostgreSQL):

Tablas de Negocio: pedidos, detalles_pedido, envios, direcciones y metodos_pago manejan el ciclo de vida transaccional con esquemas estrictamente normalizados e historiales inalterables (snapshots logísticos).

Optimización Vectorial (pgvector + metadata JSONB): Se incorporó un patrón de desnormalización estratégica mediante una columna metadata (JSONB) en la tabla productos. Esto encapsula relaciones de 1-a-N (tallas, stock, marcas, categorías) en una sola fila por producto, eliminando la necesidad de JOINs SQL costosos durante las búsquedas por similitud vectorial y evitando problemas de duplicación de filas en consultas con LIMIT.

3. Integración de Pasarela de Pagos (Mercado Pago API)
El flujo transaccional se integró siguiendo los estándares más seguros de la industria fintech.

Preferencia Dinámica: Al procesar un carrito, el backend calcula montos, suma costos logísticos y genera una Preference en pesos chilenos (CLP) enviando el ID del pedido insertado previamente en Supabase con estado pendiente dentro del campo external_reference.

Arquitectura de Webhooks (Servidor a Servidor): Para garantizar un cambio de estado 100% confiable, la ruta /api/webhooks/mercadopago procesa notificaciones asíncronas del estado del pago de forma automatizada mediante el SDK oficial, actualizando la base de datos sin importar si el cliente cerró el navegador.

4. Motor de IA Conversacional (LangChain + Google Gemini 1.5/3.5)
El sistema incluye un copiloto conversacional RAG autónomo integrado directamente en la tienda web (/api/chat).

A. Transición a Arquitectura LangChain Pura (SupabaseVectorStore)
Se migró de un enfoque híbrido con llamadas directas a funciones RPC a una implementación de LangChain (LCEL - LangChain Expression Language) apoyada en SupabaseVectorStore:

Generación de Embeddings: Utiliza el modelo text-embedding-001 de Google Gemini para convertir las consultas de los usuarios en vectores de 768 dimensiones.

Recuperación Directa: Gracias a la columna pre-calculada metadata, el motor vectorial recupera contexto completo (nombre, precio, stock por talla, marca, categoría) en una sola consulta de sub-milisegundo.

Pipeline Asíncrono LCEL: Una cadena declarativa (RunnableSequence) procesa la consulta, extrae el contexto vectorial, formatea las instrucciones con PromptTemplate y envía el prompt al modelo gemini-3.5-flash finalizando con un StringOutputParser.

B. Capa de Seguridad y Defensa (AI Hardening)
Para evitar abusos de uso, ataques de inyección de prompts y costos elevados de API, la ruta de chat implementa dos barreras de defensa:

Sanitización de Entrada: Validación estricta del tipo de dato y limitación de longitud (< 250 caracteres) para bloquear payloads maliciosos o scripts automatizados.

System Prompt Blindado: Instrucciones de comportamiento restringido que obligan al modelo a comportarse exclusivamente como un asistente de ventas de ropa, rechazando solicitudes de ejecución de código, revelación de configuración del sistema o temas ajenos al catálogo.

5. Sincronización Automatizada de Datos (Triggers + Webhooks)
Para mantener la consistencia entre clientes externos (ej. Dashboard Administrativo en Ionic) y la base de datos sin duplicar lógica de código, se implementó un flujo impulsado por eventos:

[Dashboard Ionic] ──(INSERT)──> [PostgreSQL productos]
                                        │
                                        ├──> (Trigger) ──> Auto-construye JSONB 'metadata'
                                        │
                                        └──> (Webhook) ──> [Next.js /api/generate-embeddings] ──> [Gemini Embeddings] ──> Guarda Vector
Triggers de PostgreSQL (BEFORE INSERT/UPDATE):

Interceptan la creación o edición de un producto y resuelven automáticamente las relaciones (marcas, colores, categorías) construyendo el objeto metadata JSONB antes de guardar en disco.

Un trigger secundario en la tabla stock propaga automáticamente los cambios de inventario hacia la columna metadata del producto padre.

Supabase Database Webhooks:

Al detectar un nuevo INSERT en la tabla productos, Supabase notifica de forma asíncrona mediante un Webhook a la API /api/generate-embeddings de Next.js.

La API toma los productos que aún tienen embedding = NULL, genera sus vectores con Gemini de forma transparente y actualiza la columna embedding sin necesidad de exponer credenciales de IA en la app móvil/dashboard de Ionic.