-- Implementación local: aplicar únicamente tras revisar el diagnóstico del esquema real.
-- BORRADOR. Alternativa a crear el bucket desde Storage > New bucket.
-- El bucket almacena PDFs privados, no imágenes públicas del catálogo.
-- Revisar políticas existentes con 00_diagnostico antes de ejecutar.

BEGIN;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('comprobantes', 'comprobantes', false, 5242880, ARRAY['application/pdf']::text[])
ON CONFLICT (id) DO NOTHING;

DO $do$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets
    WHERE id = 'comprobantes' AND public IS FALSE
      AND file_size_limit = 5242880
      AND allowed_mime_types = ARRAY['application/pdf']::text[]
  ) THEN
    RAISE EXCEPTION 'El bucket existente no coincide: revisar privacidad, límite de 5 MiB y MIME application/pdf. No se sobrescribe su configuración.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'comprobantes_solo_backend_guard'
  ) THEN
    RAISE EXCEPTION 'La política ya existe: revisar antes de volver a ejecutar.';
  END IF;
END
$do$;

-- Guard restrictivo: evita que una política permisiva global ya existente
-- conceda acceso directo a este bucket a anon o authenticated.
-- Para otros buckets la condición es true y sus reglas actuales siguen aplicándose.
-- El backend utiliza una credencial privada de servidor con bypass RLS.
CREATE POLICY comprobantes_solo_backend_guard
ON storage.objects AS RESTRICTIVE
FOR ALL TO anon, authenticated
USING (bucket_id <> 'comprobantes')
WITH CHECK (bucket_id <> 'comprobantes');

COMMIT;

SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets WHERE id = 'comprobantes';

-- No se crean políticas públicas de descarga ni de subida desde el navegador.
-- No insertar/eliminar filas directamente en storage.objects.
-- Subir y descargar archivos mediante la API de Storage desde el backend.
