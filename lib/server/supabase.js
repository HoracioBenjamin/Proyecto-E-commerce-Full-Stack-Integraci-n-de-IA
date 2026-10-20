import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { requiredSetting } from './config.js';

// Creación diferida: compilar no requiere claves privadas ni consultas de red.
export function createServerAdmin() {
  return createClient(requiredSetting('NEXT_PUBLIC_SUPABASE_URL'), requiredSetting('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => fetch(input, { ...init, signal: init?.signal ?? AbortSignal.timeout(20_000) }) }
  });
}

export function createAuthVerifier() {
  return createClient(requiredSetting('NEXT_PUBLIC_SUPABASE_URL'), requiredSetting('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });
}
