import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { leerConfigSupabase } from './env'

const config = leerConfigSupabase()

/**
 * Cliente de Supabase, o null si la app corre sin cuentas (modo demostración).
 * Usa el flujo PKCE: el enlace del correo trae un código de un solo uso que
 * solo puede canjear el navegador que inició la petición.
 */
export const supabase: SupabaseClient | null = config
  ? createClient(config.url, config.clave, {
      auth: {
        flowType: 'pkce',
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null
