// Ejecutar con Node --env-file=.env.local. Nunca muestra valores de configuración.
const names = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'MERCADOPAGO_ACCESS_TOKEN', 'MERCADOPAGO_WEBHOOK_SECRET', 'MERCADOPAGO_ENVIRONMENT', 'MERCADOPAGO_COLLECTOR_ID', 'APP_BASE_URL', 'RESEND_API_KEY', 'EMAIL_FROM', 'COMPROBANTES_JOB_SECRET'];
let missing = false;
for (const name of names) {
  const value = process.env[name];
  const configured = !!value && !value.includes('<') && !value.includes('>');
  console.log(`${name}: ${configured ? 'configurada' : 'pendiente'}`);
  if (!configured) missing = true;
}
if (!['test', 'production'].includes(process.env.MERCADOPAGO_ENVIRONMENT)) missing = true;
if (!/^\d+$/.test(process.env.MERCADOPAGO_COLLECTOR_ID ?? '')) missing = true;
if ((process.env.COMPROBANTES_JOB_SECRET ?? '').length < 32) {
  console.log('COMPROBANTES_JOB_SECRET: utilizar al menos 32 caracteres aleatorios.'); missing = true;
}
console.log('Esta revisión no conecta a Supabase ni valida pagos, permisos o entrega de correos.');
process.exitCode = missing ? 1 : 0;
