# Configurar historial, PDF y correo

Proyecto: e-commerce Next.js. No se configura en Ionic ni en Retail Analytics.
Los comprobantes son académicos, sin validez tributaria.

## 1. Comprobar el esquema real (hacer primero)

En el mismo proyecto Supabase indicado por la URL de la tienda, abrir **SQL Editor → New query**.
Copiar el contenido completo de `supabase/00_verificar_esquema.sql` y ejecutar **Run**.
Devuelve una fila `diagnostico`: compartir ese JSON para revisar tipos, columnas,
estados permitidos, permisos y triggers antes de aplicar las migraciones.
No devuelve ventas, clientes ni claves. No modifica la base.

Esta comprobación importa porque las pruebas locales usaron un esquema de prueba;
todavía no se ha verificado que el esquema remoto sea idéntico. Si hay triggers de
stock, revisar su función antes de probar pagos para evitar descuentos duplicados.

## 2. Aplicar migraciones después de revisar el diagnóstico

Usar los archivos de **este proyecto**, no los borradores de `planificacion-comprobantes`.
En SQL Editor ejecutar el contenido completo de cada archivo, uno por uno:

| Orden | Archivo en `supabase/migrations/` | Resultado |
| --- | --- | --- |
| 1 | `202610200001_comprobantes.sql` | Tablas `comprobantes`, `comprobante_tareas`, índices y permisos de servidor. |
| 2 | `202610200002_snapshot.sql` | Columna JSONB `pedidos.compra_snapshot`. |
| 3 | `202610200003_bucket.sql` | Bucket privado `comprobantes`, PDF hasta 5 MiB y política restrictiva. |
| 4 | `202610200004_operaciones_comprobantes.sql` | Funciones transaccionales para pedidos, pagos y tareas. |

Ante un error, detenerse en ese archivo y compartir el mensaje. No borrar tablas
para repetir ni volver a ejecutar archivos ya completados: algunos rechazan objetos
existentes expresamente. Cada archivo usa su propia transacción.

El paso 3 crea el bucket: no es necesario crearlo además en la interfaz. Si ya
existe, se comprueba su configuración y se detiene si es distinta. No hacerlo público.

Tras los pasos 1–2, el historial debe poder consultar compras si los permisos y
columnas originales coinciden. Una cuenta sin compras verá una lista vacía.
Los pedidos antiguos no reciben snapshots ni PDFs automáticamente. No asociar
pedidos invitados por coincidencia de email: la propiedad se determina por `perfil_id`.

## 3. Variables de Next.js

Editar manualmente `.env.local`, junto a `package.json`, conservando las variables
existentes. Usar `.env.example` como referencia; no reemplazar el archivo completo.
Nunca publicar claves privadas ni compartir el archivo.

| Variable | Origen / finalidad |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto de la tienda. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | Clave pública del mismo proyecto. |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave privada de servidor del mismo proyecto. |
| `MERCADOPAGO_ACCESS_TOKEN` | Token privado del vendedor para el entorno elegido. |
| `MERCADOPAGO_WEBHOOK_SECRET` | Secreto de firma obtenido en Webhooks de la aplicación de Mercado Pago. |
| `MERCADOPAGO_ENVIRONMENT` | `test` para pruebas o `production` para pagos reales; debe coincidir con los pagos recibidos. |
| `MERCADOPAGO_COLLECTOR_ID` | ID numérico del vendedor correspondiente al token y entorno. |
| `APP_BASE_URL` | Origen de la tienda, sin ruta; por ejemplo `http://localhost:3000` para desarrollo. Para recibir webhooks, origen HTTPS accesible desde internet. |
| `RESEND_API_KEY` | Clave del proveedor Resend para enviar correos. |
| `EMAIL_FROM` | Remitente autorizado; en pruebas `Zapatillas Duoc <onboarding@resend.dev>`. |
| `COMPROBANTES_JOB_SECRET` | Secreto aleatorio de al menos 32 caracteres para proteger el procesador. |

Generar el secreto localmente en PowerShell (copiarlo solo a configuración privada):

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Si la tienda está desplegada, configurar también las variables privadas en el
hosting y volver a desplegar. No añadir `NEXT_PUBLIC_` a las claves privadas.
Reiniciar `npm run dev` después de editar configuración. Si se usa `npm start`,
ejecutar primero `npm run build` y después `npm start`.

Comprobar únicamente presencia de variables sin imprimir sus valores (Node 22):

```powershell
node --env-file=.env.local scripts/comprobantes/check-config.mjs
```

## 4. Mercado Pago: confirmar el pago

Configurar notificaciones **de pagos** en Webhooks de la aplicación del vendedor:
`https://TU-DOMINIO/api/webhooks/mercadopago`.
Copiar su secreto de firma a la variable privada correspondiente. La preferencia
de pago usa también esa dirección calculada desde `APP_BASE_URL`.

Mercado Pago no puede acceder a `localhost` del computador: para probar el flujo
completo se necesita desplegar la tienda o usar una URL pública HTTPS de desarrollo.
Usar credenciales y cuentas de prueba compatibles entre sí antes de pagos reales.
Volver a la página de éxito no confirma por sí solo una compra: la confirmación
proviene del webhook verificado. Un pago aprobado crea el comprobante y su tarea PDF.

## 5. Resend: enviar el correo

Crear la API key en Resend y configurar el remitente. Con `onboarding@resend.dev`
las pruebas se limitan al correo de la propia cuenta de Resend. Para enviar a
otros compradores se necesita verificar un dominio propio y usar un remitente de él.
El destinatario se toma del snapshot de la compra, no se sustituye automáticamente.
La aceptación del correo por el proveedor no garantiza su entrega a la bandeja.

## 6. Ejecutar el procesador

El webhook registra trabajo pendiente; el procesador genera el PDF privado y luego
envía el correo. Sin ejecutarlo, las tareas permanecen pendientes.
Con Next.js ya funcionando y la configuración lista, desde otra PowerShell en la raíz:

```powershell
node --env-file=.env.local scripts/comprobantes/run-job.mjs
```

Este comando **sí procesa tareas reales del proyecto configurado** y puede enviar
correos. Cada llamada procesa hasta dos tareas; volver a invocarlo si queda trabajo.
El historial puede consultarse sin ejecutar el procesador.

Para automatizar tras desplegar, revisar `supabase/cron_comprobantes.example.sql`.
Requiere URL pública HTTPS y crear en Supabase Vault `comprobantes_app_base_url`
y `comprobantes_job_secret` (mismo secreto que en Next.js). Después se puede programar
la llamada cada minuto. No ejecutar este ejemplo antes de configurar y probar el flujo.

## 7. Verificación final

1. Entrar con una cuenta y abrir `/cuenta/compras`: compras propias o lista vacía.
2. Crear una compra nueva con las cuentas de prueba y confirmar el webhook.
3. Revisar en Supabase que exista el comprobante y una tarea pendiente.
4. Ejecutar el procesador: PDF disponible en bucket privado y correo aceptado.
5. Descargar desde el historial y comprobar tallas, colores, cantidades e importes.
6. Otra cuenta no debe acceder a esa compra ni descargar su documento.

Referencias: [Supabase Storage](https://supabase.com/docs/guides/storage/buckets/fundamentals),
[Mercado Pago Webhooks](https://www.mercadopago.cl/developers/es/docs/checkout-pro/additional-content/notifications/webhooks),
[Resend: dominio de prueba](https://resend.com/docs/knowledge-base/403-error-resend-dev-domain).
