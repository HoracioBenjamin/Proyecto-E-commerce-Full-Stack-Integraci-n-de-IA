-- Implementación local: aplicar únicamente tras revisar el diagnóstico del esquema real.
-- BORRADOR ADITIVO. Ejecutar solo después de revisar el esquema y el plan.
-- Esta columna conserva datos de la compra ANTES del pago.
-- No rellena pedidos anteriores ni programa la captura desde el checkout.

BEGIN;

DO $do$
BEGIN
  IF to_regclass('public.pedidos') IS NULL THEN
    RAISE EXCEPTION 'No existe public.pedidos.';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_attribute
    WHERE attrelid = 'public.pedidos'::regclass
      AND attname = 'compra_snapshot' AND NOT attisdropped
      AND atttypid <> 'jsonb'::regtype
  ) THEN
    RAISE EXCEPTION 'compra_snapshot ya existe con otro tipo; revisar antes de continuar.';
  END IF;
END
$do$;

ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS compra_snapshot jsonb;

COMMENT ON COLUMN public.pedidos.compra_snapshot IS
  'Datos comerciales calculados y congelados por el servidor al crear el pedido; copiar a comprobantes al confirmar pago.';

COMMIT;

-- Revisar con 00_diagnostico si fecha_pago ya existe. No se cambia en este archivo.
-- Las políticas existentes de pedidos no se alteran aquí: auditar quién puede
-- crear/modificar pedidos y snapshots antes de publicar la funcionalidad.
