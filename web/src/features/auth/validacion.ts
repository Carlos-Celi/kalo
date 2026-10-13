export const CONTRASENA_MINIMO = 8
/** bcrypt ignora lo que pasa de 72 bytes: no se aceptan contraseñas más largas. */
export const CONTRASENA_MAXIMO = 72
const CORREO_MAXIMO = 254

const FORMA_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function normalizarCorreo(correo: string): string {
  return correo.trim().toLowerCase()
}

/** Mensaje de error, o null si el correo tiene forma válida. */
export function validarCorreo(correo: string): string | null {
  const limpio = normalizarCorreo(correo)
  if (!limpio) return 'Escribe tu correo electrónico.'
  if (limpio.length > CORREO_MAXIMO || !FORMA_CORREO.test(limpio)) {
    return 'Escribe un correo electrónico válido.'
  }
  return null
}

/** Al iniciar sesión solo se exige que haya algo: no se dan pistas sobre la política. */
export function validarContrasenaExistente(contrasena: string): string | null {
  if (!contrasena) return 'Escribe tu contraseña.'
  if (new TextEncoder().encode(contrasena).length > CONTRASENA_MAXIMO) {
    return 'La contraseña es demasiado larga.'
  }
  return null
}

export function validarContrasenaNueva(contrasena: string): string | null {
  if (contrasena.length < CONTRASENA_MINIMO) {
    return `Usa al menos ${CONTRASENA_MINIMO} caracteres.`
  }
  if (new TextEncoder().encode(contrasena).length > CONTRASENA_MAXIMO) {
    return 'La contraseña es demasiado larga.'
  }
  return null
}
