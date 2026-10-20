// Invocación explícita: procesa tareas reales si se apunta a un servidor configurado.
// No se ejecuta en postinstall, en build ni en las pruebas locales.
try {
  const base = new URL(process.env.APP_BASE_URL ?? '');
  if (base.username || base.password || (base.protocol !== 'https:' && !(base.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(base.hostname)))) throw new Error('INVALID_CONFIGURATION');
  const secret = process.env.COMPROBANTES_JOB_SECRET;
  if (!secret || secret.startsWith('<')) throw new Error('INVALID_CONFIGURATION');
  const response = await fetch(new URL('/api/internal/comprobantes/procesar', base), {
    method: 'POST', headers: { Authorization: `Bearer ${secret}` }, signal: AbortSignal.timeout(55_000)
  });
  const result = await response.json();
  if (!response.ok) {
    console.error('El procesador devolvió:', result.error?.code ?? response.status); process.exitCode = 1;
  } else console.log('Resultado del procesador:', result.data);
} catch {
  console.error('No se pudo invocar el procesador. Revisa configuración y conectividad; no se imprimen credenciales.');
  process.exitCode = 1;
}
