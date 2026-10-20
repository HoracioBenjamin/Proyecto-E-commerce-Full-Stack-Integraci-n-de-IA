-- Primer paso: ejecutar en SQL Editor. Solo lectura de estructura/configuración.
-- Devuelve UNA fila JSON. No consulta clientes, pedidos ni credenciales.
WITH tablas AS (
  SELECT unnest(ARRAY['pedidos','detalles_pedido','envios','perfiles','productos',
    'stock','marcas','colores','metodos_pago','comprobantes','comprobante_tareas']) AS nombre
)
SELECT jsonb_build_object(
  'columnas', (SELECT coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) FROM (
    SELECT table_name,column_name,data_type,udt_name,is_nullable,column_default
    FROM information_schema.columns
    WHERE table_schema='public' AND table_name IN (SELECT nombre FROM tablas)
    ORDER BY table_name,ordinal_position
  ) x),
  'restricciones', (SELECT coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) FROM (
    SELECT c.relname AS tabla,con.conname AS nombre,pg_get_constraintdef(con.oid) AS definicion
    FROM pg_constraint con JOIN pg_class c ON c.oid=con.conrelid
    JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relname IN (SELECT nombre FROM tablas)
    ORDER BY c.relname,con.conname
  ) x),
  'enums', (SELECT coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) FROM (
    SELECT t.typname AS tipo,e.enumlabel AS valor
    FROM pg_type t JOIN pg_enum e ON e.enumtypid=t.oid
    JOIN pg_namespace n ON n.oid=t.typnamespace
    WHERE n.nspname='public' ORDER BY t.typname,e.enumsortorder
  ) x),
  'triggers', (SELECT coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) FROM (
    SELECT c.relname AS tabla,t.tgname AS nombre,p.proname AS funcion,t.tgenabled AS habilitado
    FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid
    JOIN pg_namespace n ON n.oid=c.relnamespace JOIN pg_proc p ON p.oid=t.tgfoid
    WHERE NOT t.tgisinternal AND n.nspname='public' AND c.relname IN (SELECT nombre FROM tablas)
    ORDER BY c.relname,t.tgname
  ) x),
  'permisos', (SELECT coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) FROM (
    SELECT table_name,grantee,privilege_type FROM information_schema.role_table_grants
    WHERE table_schema='public' AND table_name IN (SELECT nombre FROM tablas)
      AND grantee IN ('anon','authenticated','service_role','PUBLIC')
    ORDER BY table_name,grantee,privilege_type
  ) x),
  'rls', (SELECT coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) FROM (
    SELECT c.relname AS tabla,c.relrowsecurity AS activo,c.relforcerowsecurity AS forzado
    FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relname IN (SELECT nombre FROM tablas)
    ORDER BY c.relname
  ) x),
  'politicas', (SELECT coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) FROM (
    SELECT schemaname,tablename,policyname,permissive,roles,cmd,qual,with_check FROM pg_policies
    WHERE (schemaname='public' AND tablename IN (SELECT nombre FROM tablas))
       OR (schemaname='storage' AND tablename='objects')
    ORDER BY schemaname,tablename,policyname
  ) x),
  'bucket', (SELECT coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) FROM (
    SELECT id,name,public,file_size_limit,allowed_mime_types FROM storage.buckets
    WHERE id='comprobantes'
  ) x),
  'funciones_instaladas', (SELECT coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) FROM (
    SELECT p.proname AS nombre,pg_get_function_identity_arguments(p.oid) AS argumentos
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname IN ('crear_pedido_comprobante',
      'registrar_pago_comprobante','adquirir_tarea_comprobante',
      'finalizar_tarea_comprobante','fallar_tarea_comprobante')
    ORDER BY p.proname
  ) x)
) AS diagnostico;
