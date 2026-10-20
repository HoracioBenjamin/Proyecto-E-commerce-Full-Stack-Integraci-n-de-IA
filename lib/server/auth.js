import 'server-only';
import { createAuthVerifier } from './supabase.js';
import { PurchaseError } from '../comprobantes/errors.mjs';

export async function requireUser(request, { optional = false, verifier = createAuthVerifier } = {}) {
  const header = request.headers.get('authorization');
  if (!header && optional) return null;
  if (!header?.match(/^Bearer \S+$/i)) throw new PurchaseError('AUTH_REQUIRED', 'Inicia sesión para consultar tus compras.', 401);
  const token = header.slice(7);
  const { data, error } = await verifier().auth.getUser(token);
  if (error || !data?.user || data.user.is_anonymous) throw new PurchaseError('AUTH_REQUIRED', 'La sesión no es válida. Vuelve a iniciar sesión.', 401);
  return { id: data.user.id, email: data.user.email };
}
