Resumen del Proyecto: E-commerce Full-Stack Moderno con Integración de Pagos y Copiloto de IA
Este proyecto consiste en el diseño, desarrollo e implementación de una plataforma de comercio electrónico de alta fidelidad orientada al sector retail (ropa y calzado). El sistema destaca por una arquitectura limpia basada en componentes reactivos, un motor de base de datos relacional estrictamente normalizado, procesamiento asíncrono de pagos y automatización inteligente de inventario.

1. Arquitectura del Frontend (React & Next.js)
El cliente de la aplicación está construido utilizando Next.js bajo la arquitectura moderna de App Router (app/).

Renderizado Eficiente: Combina componentes de servidor (Server Components) para maximizar la velocidad de carga inicial y el posicionamiento SEO, junto con componentes de cliente ('use client') como CheckoutClient.js para gestionar estados interactivos complejos (manejo del carrito de compras, selección dinámica de tallas y validación de formularios de envío).

Flujo del Checkout: El frontend empaqueta de forma segura la información logística del usuario (datos de envío, región, comuna) y el arreglo de productos seleccionados para despacharlos en una única petición HTTP POST hacia las APIs internas del servidor.

2. Infraestructura del Backend y Base de Datos (Next.js APIs & Supabase)
La lógica de servidor y el almacenamiento de datos se desacoplan utilizando herramientas serverless de última generación, garantizando alta disponibilidad y escalabilidad.

Capa de Endpoints (API Routes): Rutas seguras (/api/checkout/mercadopago) actúan como intermediarias para procesar las solicitudes del cliente, manejar variables de entorno privadas (tokens de acceso) y comunicarse con servicios externos sin exponer credenciales en el navegador.

Persistencia Relacional Normalizada (Supabase / PostgreSQL): La base de datos fue diseñada bajo las reglas de normalización relacional, distribuyendo responsabilidades de forma atómica:

pedidos: Actúa como el centro de control; almacena un Snapshot (captura histórica inalterable) del cliente (nombre, email, teléfono) al momento de la compra para auditorías, el total pagado y la llave foránea (metodo_pago_id).

detalles_pedido: Maneja la relación 1-a-Muchos para guardar los productos de la orden con sus respectivas cantidades, precios unitarios y tallas.

envios: Almacena de forma aislada el Snapshot logístico (dirección de destino exacta, región, comuna, costo de envío) protegiendo el historial en caso de que el usuario modifique sus datos en el futuro.

direcciones y metodos_pago: Tablas catálogo y libretas de direcciones independientes vinculadas mediante Foreign Keys para optimizar el almacenamiento de perfiles registrados.

3. Integración de Pasarela de Pagos y Procesamiento Asíncrono (Mercado Pago API)
El flujo transaccional se integró siguiendo los estándares más seguros de la industria de la tecnología financiera.

Preferencia Dinámica: Al procesar un carrito, el backend calcula montos, suma costos logísticos y genera una Preference en pesos chilenos (CLP) enviando el ID del pedido insertado previamente en Supabase con estado pendiente dentro del campo external_reference.

Arquitectura de Webhooks (Servidor a Servidor): Para garantizar que el estado del pedido cambie de forma 100% confiable, se implementó una ruta de Webhook (/api/webhooks/mercadopago). Cuando Mercado Pago aprueba o rechaza una transacción, sus servidores notifican directamente a este endpoint de manera asíncrona. El sistema valida la veracidad del pago mediante el SDK oficial y actualiza Supabase a estado exitoso o erroneo de forma automatizada, independientemente de si el cliente cerró o no la pestaña de su navegador.

4. Próxima Implementación: Innovación con Inteligencia Artificial (Copiloto de Inventario)
Como elemento diferenciador e innovador dentro del portafolio, se integrará un módulo de Inteligencia Artificial enfocado en la automatización de procesos internos del comercio (Backoffice).

Tecnología (OpenAI GPT-4o con Visión): El administrador de la tienda podrá tomar una fotografía de cualquier prenda de ropa desde su teléfono celular al momento de recibir stock físico.

Procesamiento e Impacto Visual: La imagen se enviará codificada en Base64 hacia los modelos de visión de OpenAI. El modelo analizará la imagen nativamente y devolverá un objeto JSON estructurado con: un título comercial atractivo, una descripción de producto optimizada para SEO y las etiquetas/categorías correspondientes. Esto auto-completará el formulario de creación de productos en 3 segundos, logrando una demostración en vivo de alto impacto visual que valida la viabilidad del e-commerce inteligente en el mundo real.