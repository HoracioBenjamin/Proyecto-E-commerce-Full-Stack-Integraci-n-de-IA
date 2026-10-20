-- Solo servidor. Revisar primero el esquema comercial y las migraciones 001–003.
-- No ejecutar estas funciones con JWT de comprador ni concederlas a anon/authenticated.
BEGIN;

CREATE OR REPLACE FUNCTION public.crear_pedido_comprobante(
  p_perfil_id uuid, p_snapshot jsonb, p_envio jsonb
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  pedido public.pedidos%ROWTYPE;
  metodo public.metodos_pago.id%TYPE;
  producto public.productos%ROWTYPE;
  v_producto_id public.productos.id%TYPE;
  v_tipo_envio public.envios.tipo_envio%TYPE;
  linea jsonb;
  cantidad integer;
  disponibles integer;
  precio bigint;
  suma bigint := 0;
BEGIN
  IF p_snapshot->>'moneda' IS DISTINCT FROM 'CLP'
     OR jsonb_typeof(p_snapshot->'lineas') IS DISTINCT FROM 'array'
     OR jsonb_array_length(p_snapshot->'lineas') NOT BETWEEN 1 AND 100 THEN
    RAISE EXCEPTION 'Snapshot inválido' USING ERRCODE='23514';
  END IF;
  SELECT id INTO metodo FROM public.metodos_pago
    WHERE lower(nombre) LIKE '%mercado%pago%' ORDER BY id LIMIT 1;
  IF metodo IS NULL THEN RAISE EXCEPTION 'Configurar método Mercado Pago' USING ERRCODE='23514'; END IF;

  -- Revalidación bajo bloqueo. No descontar stock aquí: auditar antes los triggers existentes.
  FOR linea IN SELECT value FROM jsonb_array_elements(p_snapshot->'lineas') ORDER BY value->>'producto_id', value->>'talla'
  LOOP
    v_producto_id := linea->>'producto_id';
    cantidad := (linea->>'cantidad')::integer;
    SELECT * INTO producto FROM public.productos WHERE id=v_producto_id FOR SHARE;
    IF NOT FOUND OR cantidad NOT BETWEEN 1 AND 50 THEN
      RAISE EXCEPTION 'Producto/cantidad inválidos' USING ERRCODE='23514';
    END IF;
    SELECT s.cantidad INTO disponibles FROM public.stock s
      WHERE s.producto_id=v_producto_id AND s.talla=linea->>'talla' FOR SHARE;
    precio := CASE WHEN producto.en_oferta THEN producto.precio_oferta ELSE producto.precio END;
    IF disponibles IS NULL OR disponibles<cantidad OR precio IS NULL OR precio<=0
       OR precio<>(linea->>'precio_unitario')::bigint
       OR precio*cantidad<>(linea->>'total_linea')::bigint THEN
      RAISE EXCEPTION 'Stock o precio cambió' USING ERRCODE='23514';
    END IF;
    suma := suma+precio*cantidad;
  END LOOP;
  IF suma<>(p_snapshot->>'subtotal')::bigint
     OR (p_snapshot->>'descuento')::bigint<>0
     OR suma+(p_snapshot->>'costo_envio')::bigint<>(p_snapshot->>'total')::bigint THEN
    RAISE EXCEPTION 'Importes inválidos' USING ERRCODE='23514';
  END IF;

  INSERT INTO public.pedidos(perfil_id,nombre_cliente,email,telefono,total,estado,metodo_pago_id,compra_snapshot)
  VALUES(p_perfil_id,p_snapshot#>>'{cliente,nombre}',p_snapshot#>>'{cliente,email}',
    p_envio->>'telefono',(p_snapshot->>'total')::bigint,'pendiente',metodo,p_snapshot)
  RETURNING * INTO pedido;

  FOR linea IN SELECT value FROM jsonb_array_elements(p_snapshot->'lineas') LOOP
    v_producto_id := linea->>'producto_id';
    INSERT INTO public.detalles_pedido(pedido_id,producto_id,cantidad,precio_unitario,talla)
    VALUES(pedido.id,v_producto_id,(linea->>'cantidad')::integer,(linea->>'precio_unitario')::bigint,linea->>'talla');
  END LOOP;
  v_tipo_envio := p_snapshot->>'tipo_envio';
  INSERT INTO public.envios(pedido_id,tipo_envio,estado_logistico,nombre_destinatario,rut_destinatario,
    telefono_contacto,direccion,region_id,comuna_id,estacion_metro,costo_envio)
  VALUES(pedido.id,v_tipo_envio,'preparacion',p_snapshot#>>'{cliente,nombre}',
    nullif(p_envio->>'rut',''),p_envio->>'telefono',nullif(p_envio->>'direccion',''),
    nullif(p_envio->>'region','')::bigint,nullif(p_envio->>'comuna','')::bigint,
    nullif(p_envio->>'estacionMetro',''),(p_snapshot->>'costo_envio')::bigint);
  RETURN jsonb_build_object('pedido_id',pedido.id::text);
END $$;

CREATE OR REPLACE FUNCTION public.registrar_pago_comprobante(p_pago jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  pedido public.pedidos%ROWTYPE;
  documento public.comprobantes%ROWTYPE;
  estado_pago text := p_pago->>'status';
  pago_id text := p_pago->>'id';
  fecha timestamptz := (p_pago->>'fecha_aprobacion')::timestamptz;
BEGIN
  SELECT * INTO pedido FROM public.pedidos WHERE id::text=p_pago->>'pedido_id' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Pedido no encontrado' USING ERRCODE='P0002'; END IF;
  IF (p_pago->>'monto')::numeric<>pedido.total OR p_pago->>'moneda' IS DISTINCT FROM 'CLP' THEN
    RAISE EXCEPTION 'Importe/moneda no coinciden' USING ERRCODE='23514';
  END IF;
  SELECT * INTO documento FROM public.comprobantes WHERE pedido_id=pedido.id FOR UPDATE;
  IF documento.id IS NOT NULL AND documento.pago_id<>pago_id THEN
    IF estado_pago IN ('approved','refunded','charged_back') THEN
      RAISE EXCEPTION 'Pago diferente para el mismo pedido' USING ERRCODE='23505';
    END IF;
    RETURN jsonb_build_object('estado','ignorado');
  END IF;

  IF estado_pago IN ('refunded','charged_back') THEN
    UPDATE public.pedidos SET estado='erroneo' WHERE id=pedido.id;
    IF documento.id IS NOT NULL THEN
      UPDATE public.comprobantes SET estado_documento='anulado',anulado_at=coalesce(anulado_at,now()),
        estado_correo=CASE WHEN estado_correo IN ('pendiente','error') THEN 'cancelado' ELSE estado_correo END,
        updated_at=now() WHERE id=documento.id;
      UPDATE public.comprobante_tareas SET estado='cancelada',token_bloqueo=NULL,bloqueado_hasta=NULL,updated_at=now()
        WHERE comprobante_id=documento.id AND estado NOT IN ('completada','cancelada');
    END IF;
    RETURN jsonb_build_object('estado','anulado');
  END IF;
  IF estado_pago<>'approved' THEN
    IF documento.id IS NULL AND pedido.estado<>'exitoso' AND estado_pago IN ('rejected','cancelled') THEN
      UPDATE public.pedidos SET estado='erroneo' WHERE id=pedido.id;
    END IF;
    RETURN jsonb_build_object('estado','sin_emision');
  END IF;
  IF coalesce((p_pago->>'monto_reembolsado')::numeric,0)>0 THEN
    IF documento.id IS NOT NULL THEN
      UPDATE public.comprobante_tareas SET estado='revision_manual',ultimo_error_codigo='PARTIAL_REFUND',
        token_bloqueo=NULL,bloqueado_hasta=NULL,updated_at=now()
        WHERE comprobante_id=documento.id AND estado NOT IN ('completada','cancelada');
    END IF;
    RETURN jsonb_build_object('estado','reembolso_parcial_revision');
  END IF;
  IF documento.id IS NOT NULL THEN RETURN jsonb_build_object('estado','existente','comprobante_id',documento.id); END IF;
  IF pedido.compra_snapshot IS NULL OR fecha IS NULL
    OR (pedido.compra_snapshot->>'total')::numeric<>pedido.total THEN
    RAISE EXCEPTION 'Pedido sin snapshot íntegro' USING ERRCODE='23514';
  END IF;

  UPDATE public.pedidos SET estado='exitoso' WHERE id=pedido.id;
  -- fecha_pago puede existir ya en la BD del equipo; se conserva la primera fecha verificada.
  IF EXISTS(SELECT 1 FROM pg_catalog.pg_attribute
    WHERE attrelid='public.pedidos'::regclass AND attname='fecha_pago' AND NOT attisdropped) THEN
    EXECUTE 'UPDATE public.pedidos SET fecha_pago=coalesce(fecha_pago,$1) WHERE id::text=$2'
      USING fecha,pedido.id::text;
  END IF;
  INSERT INTO public.comprobantes(pedido_id,pago_id,datos_emision,email_destinatario)
  VALUES(pedido.id,pago_id,pedido.compra_snapshot||jsonb_build_object('fecha_pago',fecha),pedido.compra_snapshot#>>'{cliente,email}')
  RETURNING * INTO documento;
  INSERT INTO public.comprobante_tareas(comprobante_id,tipo,clave_idempotencia)
  VALUES(documento.id,'generar_pdf','comprobante/'||documento.id::text||'/pdf/v1');
  RETURN jsonb_build_object('estado','registrado','comprobante_id',documento.id);
END $$;

CREATE OR REPLACE FUNCTION public.adquirir_tarea_comprobante()
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE tarea public.comprobante_tareas%ROWTYPE; documento public.comprobantes%ROWTYPE;
BEGIN
  -- Una respuesta incierta no se reenvía al vencer la ventana de idempotencia del proveedor.
  UPDATE public.comprobante_tareas t SET estado='revision_manual',token_bloqueo=NULL,bloqueado_hasta=NULL,updated_at=now()
    WHERE t.tipo='enviar_correo' AND t.estado IN ('pendiente','error','procesando')
      AND (t.bloqueado_hasta IS NULL OR t.bloqueado_hasta<now())
      AND t.primer_intento_at<now()-interval '23 hours 30 minutes';
  UPDATE public.comprobante_tareas SET estado='revision_manual',token_bloqueo=NULL,bloqueado_hasta=NULL,updated_at=now()
    WHERE estado='procesando' AND bloqueado_hasta<now() AND intentos>=max_intentos;

  SELECT t.* INTO tarea FROM public.comprobante_tareas t
    JOIN public.comprobantes c ON c.id=t.comprobante_id
    JOIN public.pedidos p ON p.id=c.pedido_id
    WHERE c.estado_documento='vigente' AND p.estado='exitoso'
      AND t.estado IN ('pendiente','error','procesando') AND t.intentos<t.max_intentos
      AND t.proximo_intento_at<=now() AND (t.bloqueado_hasta IS NULL OR t.bloqueado_hasta<now())
      AND (t.tipo='generar_pdf' OR c.estado_pdf='disponible')
    ORDER BY t.created_at,t.id FOR UPDATE OF c,t SKIP LOCKED LIMIT 1;
  IF NOT FOUND THEN RETURN NULL; END IF;
  UPDATE public.comprobante_tareas SET estado='procesando',intentos=intentos+1,
    primer_intento_at=coalesce(primer_intento_at,now()),token_bloqueo=gen_random_uuid(),
    bloqueado_hasta=now()+interval '120 seconds',updated_at=now()
    WHERE id=tarea.id RETURNING * INTO tarea;
  UPDATE public.comprobantes SET
    estado_pdf=CASE WHEN tarea.tipo='generar_pdf' THEN 'generando' ELSE estado_pdf END,
    estado_correo=CASE WHEN tarea.tipo='enviar_correo' THEN 'enviando' ELSE estado_correo END,
    updated_at=now() WHERE id=tarea.comprobante_id RETURNING * INTO documento;
  RETURN jsonb_build_object('tarea',to_jsonb(tarea),'comprobante',to_jsonb(documento));
END $$;

CREATE OR REPLACE FUNCTION public.finalizar_tarea_comprobante(
  p_tarea uuid,p_token uuid,p_resultado jsonb
) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE tarea public.comprobante_tareas%ROWTYPE; documento public.comprobantes%ROWTYPE;
BEGIN
  SELECT * INTO tarea FROM public.comprobante_tareas WHERE id=p_tarea;
  IF NOT FOUND THEN RAISE EXCEPTION 'Tarea inexistente' USING ERRCODE='55000'; END IF;
  PERFORM 1 FROM public.comprobantes WHERE id=tarea.comprobante_id FOR UPDATE;
  SELECT * INTO tarea FROM public.comprobante_tareas WHERE id=p_tarea FOR UPDATE;
  IF NOT FOUND OR tarea.estado<>'procesando' OR tarea.token_bloqueo IS DISTINCT FROM p_token OR tarea.bloqueado_hasta<now() THEN
    RAISE EXCEPTION 'Lease inválido' USING ERRCODE='55000';
  END IF;
  SELECT * INTO documento FROM public.comprobantes WHERE id=tarea.comprobante_id FOR UPDATE;
  IF documento.estado_documento<>'vigente' THEN RAISE EXCEPTION 'Documento anulado' USING ERRCODE='55000'; END IF;
  IF tarea.tipo='generar_pdf' THEN
    UPDATE public.comprobantes SET estado_pdf='disponible',storage_path=p_resultado->>'storage_path',
      pdf_sha256=p_resultado->>'sha256',emitido_at=(p_resultado->>'emitido_at')::timestamptz,updated_at=now()
      WHERE id=documento.id;
    INSERT INTO public.comprobante_tareas(comprobante_id,tipo,clave_idempotencia)
    VALUES(documento.id,'enviar_correo','comprobante/'||documento.id::text||'/correo/v1')
      ON CONFLICT(comprobante_id,tipo) DO NOTHING;
  ELSE
    IF nullif(p_resultado->>'proveedor_id','') IS NULL THEN RAISE EXCEPTION 'Falta referencia del correo' USING ERRCODE='23514'; END IF;
    UPDATE public.comprobantes SET estado_correo='aceptado',correo_proveedor_id=p_resultado->>'proveedor_id',
      correo_aceptado_at=now(),updated_at=now() WHERE id=documento.id;
  END IF;
  UPDATE public.comprobante_tareas SET estado='completada',completed_at=now(),token_bloqueo=NULL,
    bloqueado_hasta=NULL,ultimo_error_codigo=NULL,ultimo_error_resumen=NULL,updated_at=now() WHERE id=tarea.id;
END $$;

CREATE OR REPLACE FUNCTION public.fallar_tarea_comprobante(
  p_tarea uuid,p_token uuid,p_codigo text,p_revision boolean DEFAULT false,p_incierto boolean DEFAULT false
) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE tarea public.comprobante_tareas%ROWTYPE;
BEGIN
  SELECT * INTO tarea FROM public.comprobante_tareas WHERE id=p_tarea;
  IF NOT FOUND THEN RAISE EXCEPTION 'Tarea inexistente' USING ERRCODE='55000'; END IF;
  PERFORM 1 FROM public.comprobantes WHERE id=tarea.comprobante_id FOR UPDATE;
  SELECT * INTO tarea FROM public.comprobante_tareas WHERE id=p_tarea FOR UPDATE;
  -- Un worker viejo no puede liberar el lease de otro.
  IF NOT FOUND OR tarea.estado<>'procesando' OR tarea.token_bloqueo IS DISTINCT FROM p_token THEN RETURN; END IF;
  UPDATE public.comprobante_tareas SET estado=CASE WHEN p_revision OR intentos>=max_intentos THEN 'revision_manual' ELSE 'error' END,
    proximo_intento_at=now()+make_interval(secs=>least(3600,30*power(2,least(intentos,6)))::integer),
    token_bloqueo=NULL,bloqueado_hasta=NULL,ultimo_error_codigo=left(p_codigo,80),
    ultimo_error_resumen='La operación requiere reintento o revisión; no se almacenan respuestas sensibles.',updated_at=now()
    WHERE id=tarea.id;
  UPDATE public.comprobantes SET
    estado_pdf=CASE WHEN tarea.tipo='generar_pdf' THEN 'error' ELSE estado_pdf END,
    estado_correo=CASE WHEN tarea.tipo='enviar_correo' THEN CASE WHEN p_incierto THEN 'envio_incierto' ELSE 'error' END ELSE estado_correo END,
    updated_at=now() WHERE id=tarea.comprobante_id;
END $$;

REVOKE ALL ON FUNCTION public.crear_pedido_comprobante(uuid,jsonb,jsonb) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.registrar_pago_comprobante(jsonb) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.adquirir_tarea_comprobante() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.finalizar_tarea_comprobante(uuid,uuid,jsonb) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.fallar_tarea_comprobante(uuid,uuid,text,boolean,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.crear_pedido_comprobante(uuid,jsonb,jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.registrar_pago_comprobante(jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.adquirir_tarea_comprobante() TO service_role;
GRANT EXECUTE ON FUNCTION public.finalizar_tarea_comprobante(uuid,uuid,jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.fallar_tarea_comprobante(uuid,uuid,text,boolean,boolean) TO service_role;
COMMIT;
