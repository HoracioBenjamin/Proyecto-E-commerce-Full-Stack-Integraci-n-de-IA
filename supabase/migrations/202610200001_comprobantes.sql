-- Implementación local: aplicar únicamente tras revisar el diagnóstico del esquema real.
-- BORRADOR. Revisar 00_diagnostico_solo_lectura.sql antes de ejecutarlo.
-- Crea DOS tablas nuevas, índices y permisos. No emite PDFs ni correos.
-- No modifica políticas ni datos de las tablas comerciales existentes.
-- Modelo elegido: acceso exclusivamente mediante endpoints del servidor.
-- No hay permisos directos para navegadores, aunque estén autenticados.

BEGIN;

DO $do$
DECLARE
  tipo_pedido text;
BEGIN
  IF to_regclass('public.pedidos') IS NULL THEN
    RAISE EXCEPTION 'Falta public.pedidos. Revisar esquema antes de continuar.';
  END IF;

  IF to_regclass('public.comprobantes') IS NOT NULL
     OR to_regclass('public.comprobante_tareas') IS NOT NULL THEN
    RAISE EXCEPTION 'Ya existe una tabla propuesta. No sobrescribir: revisar y preparar una migración diferencial.';
  END IF;

  SELECT format_type(a.atttypid, a.atttypmod)
  INTO tipo_pedido
  FROM pg_attribute a
  WHERE a.attrelid = 'public.pedidos'::regclass
    AND a.attname = 'id' AND NOT a.attisdropped
    AND a.atttypid IN ('smallint'::regtype, 'integer'::regtype, 'bigint'::regtype, 'uuid'::regtype);

  IF tipo_pedido IS NULL THEN
    RAISE EXCEPTION 'pedidos.id no es smallint/integer/bigint/uuid. Adaptar el borrador al tipo real.';
  END IF;

  -- Se copia el tipo real de pedidos.id; no se adivina bigint o UUID.
  EXECUTE format($ddl$
    CREATE TABLE public.comprobantes (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      numero bigint GENERATED ALWAYS AS IDENTITY UNIQUE,
      pedido_id %s NOT NULL REFERENCES public.pedidos(id) ON DELETE RESTRICT,
      pago_id text NOT NULL,
      tipo text NOT NULL DEFAULT 'comprobante_compra'
        CHECK (tipo = 'comprobante_compra'),
      version_plantilla integer NOT NULL DEFAULT 1 CHECK (version_plantilla > 0),
      estado_documento text NOT NULL DEFAULT 'vigente'
        CHECK (estado_documento IN ('vigente', 'anulado')),
      datos_emision jsonb NOT NULL
        CHECK (jsonb_typeof(datos_emision) = 'object' AND datos_emision <> '{}'::jsonb),
      email_destinatario text NOT NULL CHECK (length(email_destinatario) BETWEEN 3 AND 320),
      estado_pdf text NOT NULL DEFAULT 'pendiente'
        CHECK (estado_pdf IN ('pendiente', 'generando', 'disponible', 'error')),
      storage_bucket text NOT NULL DEFAULT 'comprobantes'
        CHECK (storage_bucket = 'comprobantes'),
      storage_path text UNIQUE,
      pdf_sha256 text CHECK (pdf_sha256 IS NULL OR pdf_sha256 ~ '^[0-9a-f]{64}$'),
      estado_correo text NOT NULL DEFAULT 'pendiente'
        CHECK (estado_correo IN (
          'pendiente', 'enviando', 'aceptado', 'entregado',
          'error', 'envio_incierto', 'cancelado'
        )),
      correo_proveedor_id text,
      correo_aceptado_at timestamptz,
      emitido_at timestamptz,
      anulado_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT comprobantes_un_pedido UNIQUE (pedido_id),
      CONSTRAINT comprobantes_un_pago UNIQUE (pago_id),
      CONSTRAINT comprobantes_pdf_disponible CHECK (
        estado_pdf <> 'disponible'
        OR (storage_path IS NOT NULL AND pdf_sha256 IS NOT NULL AND emitido_at IS NOT NULL)
      )
    )
  $ddl$, tipo_pedido);
END
$do$;

CREATE TABLE public.comprobante_tareas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comprobante_id uuid NOT NULL REFERENCES public.comprobantes(id) ON DELETE RESTRICT,
  tipo text NOT NULL CHECK (tipo IN ('generar_pdf', 'enviar_correo')),
  estado text NOT NULL DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente', 'procesando', 'completada', 'error', 'revision_manual', 'cancelada')),
  clave_idempotencia text NOT NULL UNIQUE CHECK (length(clave_idempotencia) BETWEEN 1 AND 256),
  intentos integer NOT NULL DEFAULT 0 CHECK (intentos >= 0),
  max_intentos integer NOT NULL DEFAULT 6 CHECK (max_intentos > 0),
  proximo_intento_at timestamptz NOT NULL DEFAULT now(),
  primer_intento_at timestamptz,
  bloqueado_hasta timestamptz,
  token_bloqueo uuid,
  ultimo_error_codigo text,
  ultimo_error_resumen text,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT comprobante_tareas_un_tipo UNIQUE (comprobante_id, tipo)
);

CREATE INDEX comprobante_tareas_pendientes_idx
  ON public.comprobante_tareas (proximo_intento_at, created_at)
  WHERE estado IN ('pendiente', 'error', 'procesando');

ALTER TABLE public.comprobantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comprobante_tareas ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.comprobantes, public.comprobante_tareas
  FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.comprobantes, public.comprobante_tareas
  TO service_role;

DO $do$
BEGIN
  EXECUTE format('REVOKE ALL ON SEQUENCE %s FROM PUBLIC, anon, authenticated',
    pg_get_serial_sequence('public.comprobantes', 'numero'));
  EXECUTE format('GRANT USAGE, SELECT ON SEQUENCE %s TO service_role',
    pg_get_serial_sequence('public.comprobantes', 'numero'));
END
$do$;

COMMENT ON TABLE public.comprobantes IS
  'Comprobantes académicos sin validez tributaria. Lectura y escritura solo por backend autorizado.';
COMMENT ON TABLE public.comprobante_tareas IS
  'Trabajo durable de PDF y correo. No ejecutar tareas externas dentro de una transacción SQL.';
COMMENT ON COLUMN public.comprobantes.datos_emision IS
  'Snapshot inmutable validado por el servidor; no reconstruir desde el catálogo actual.';

COMMIT;

-- Verificación posterior (solo estructura; no mostrar datos personales).
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('comprobantes', 'comprobante_tareas')
ORDER BY table_name, ordinal_position;

-- updated_at NO tiene trigger automático en este borrador.
-- La implementación debe actualizarlo explícitamente, también al adquirir/finalizar una tarea.
-- Las funciones transaccionales de registro y adquisición de tareas son trabajo posterior.
