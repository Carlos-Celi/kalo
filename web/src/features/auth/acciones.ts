import { isAuthError } from '@supabase/supabase-js'
import { rutas } from '../../app/rutas'
import { supabase } from '../../lib/supabase'
import { VERSION_POLITICAS } from '../legal/PaginaLegal'
import { normalizarCorreo } from './validacion'

export type MotivoFallo =
  | 'credenciales'
  | 'sin-confirmar'
  | 'limite'
  | 'captcha'
  | 'contrasena-debil'
  | 'sin-servicio'
  | 'desconocido'

export type Resultado = { ok: true } | { ok: false; motivo: MotivoFallo }

const EXITO: Resultado = { ok: true }

/**
 * Traduce el error de Supabase a un motivo propio. Lo que no se reconoce
 * cae en "desconocido": nunca se muestra al usuario el mensaje del servidor.
 */
function motivoDe(error: unknown): MotivoFallo {
  if (!isAuthError(error)) return 'desconocido'
  if (error.status === 429) return 'limite'
  switch (error.code) {
    case 'invalid_credentials':
      return 'credenciales'
    case 'email_not_confirmed':
      return 'sin-confirmar'
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit':
      return 'limite'
    case 'captcha_failed':
      return 'captcha'
    case 'weak_password':
      return 'contrasena-debil'
    default:
      return 'desconocido'
  }
}

function fallo(error: unknown): Resultado {
  return { ok: false, motivo: motivoDe(error) }
}

const SIN_SERVICIO: Resultado = { ok: false, motivo: 'sin-servicio' }

export async function iniciarSesion(
  correo: string,
  contrasena: string,
  captchaToken?: string,
): Promise<Resultado> {
  if (!supabase) return SIN_SERVICIO
  const { error } = await supabase.auth.signInWithPassword({
    email: normalizarCorreo(correo),
    password: contrasena,
    options: { captchaToken },
  })
  return error ? fallo(error) : EXITO
}

/**
 * Con la confirmación de correo activada, Supabase responde igual exista o
 * no la cuenta, así que el registro no sirve para averiguar quién tiene una.
 */
export async function crearCuenta(
  correo: string,
  contrasena: string,
  captchaToken?: string,
): Promise<Resultado> {
  if (!supabase) return SIN_SERVICIO
  const { error } = await supabase.auth.signUp({
    email: normalizarCorreo(correo),
    password: contrasena,
    options: {
      captchaToken,
      emailRedirectTo: window.location.origin + rutas.inicio,
      // Constancia del consentimiento (términos, privacidad y datos de salud) y de su versión.
      data: { politicas_version: VERSION_POLITICAS, politicas_aceptadas_en: new Date().toISOString() },
    },
  })
  return error ? fallo(error) : EXITO
}

export async function pedirRecuperacion(correo: string, captchaToken?: string): Promise<Resultado> {
  if (!supabase) return SIN_SERVICIO
  const { error } = await supabase.auth.resetPasswordForEmail(normalizarCorreo(correo), {
    captchaToken,
    redirectTo: window.location.origin + rutas.restablecer,
  })
  return error ? fallo(error) : EXITO
}

export async function cambiarContrasena(contrasena: string): Promise<Resultado> {
  if (!supabase) return SIN_SERVICIO
  const { error } = await supabase.auth.updateUser({ password: contrasena })
  return error ? fallo(error) : EXITO
}

export async function cerrarSesion(): Promise<void> {
  // "local": cierra esta sesión aunque no haya red para avisar al servidor.
  await supabase?.auth.signOut({ scope: 'local' })
}
