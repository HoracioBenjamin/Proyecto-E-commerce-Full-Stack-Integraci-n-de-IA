import 'server-only';
import { PurchaseError } from '../comprobantes/errors.mjs';

export function requiredSetting(name) {
  const value = process.env[name];
  if (!value || value.startsWith('<')) throw new PurchaseError('CONFIGURATION_REQUIRED', `Falta configurar ${name} en el servidor.`, 503);
  return value;
}

export function applicationUrl() {
  const value = requiredSetting('APP_BASE_URL');
  let url;
  try { url = new URL(value); } catch { throw new PurchaseError('CONFIGURATION_REQUIRED', 'APP_BASE_URL debe ser una URL válida.', 503); }
  if (url.username || url.password || (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname)))) {
    throw new PurchaseError('CONFIGURATION_REQUIRED', 'APP_BASE_URL debe usar HTTPS (o localhost para desarrollo).', 503);
  }
  return url.origin;
}
