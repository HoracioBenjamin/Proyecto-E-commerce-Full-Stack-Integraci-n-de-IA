-- Configuración OPCIONAL del programador. No forma parte de las migraciones automáticas.
-- Requiere la tienda desplegada por HTTPS y las migraciones/variables comprobadas.
-- Crear MANUALMENTE en Supabase Vault:
--   comprobantes_app_base_url: origen HTTPS de la tienda, sin barra final.
--   comprobantes_job_secret: mismo secreto privado que COMPROBANTES_JOB_SECRET.
-- No publicar valores en este archivo. No registrar headers de las solicitudes.

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM vault.decrypted_secrets WHERE name='comprobantes_app_base_url')
    OR NOT EXISTS (SELECT 1 FROM vault.decrypted_secrets WHERE name='comprobantes_job_secret') THEN
    RAISE EXCEPTION 'Crear primero los dos secretos de configuración en Vault.';
  END IF;
END $$;

SELECT cron.schedule('comprobantes-cada-minuto','* * * * *',$job$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='comprobantes_app_base_url') || '/api/internal/comprobantes/procesar',
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'Authorization','Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='comprobantes_job_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 55000
  );
$job$);

SELECT jobname,schedule,active FROM cron.job WHERE jobname='comprobantes-cada-minuto';
