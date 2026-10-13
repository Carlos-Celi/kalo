import type { MotivoFallo } from './acciones'

/**
 * Textos de error para el usuario. Son deliberadamente genéricos: no dicen
 * si un correo tiene cuenta ni repiten lo que responde el servidor.
 */
export const mensajeDeFallo: Record<MotivoFallo, string> = {
  credenciales: 'Correo o contraseña incorrectos.',
  'sin-confirmar': 'Confirma tu correo con el enlace que te enviamos antes de iniciar sesión.',
  limite: 'Demasiados intentos. Espera unos minutos y vuelve a intentarlo.',
  captcha: 'No pudimos verificar que eres una persona. Inténtalo de nuevo.',
  'contrasena-debil':
    'Esa contraseña es demasiado débil o aparece en filtraciones conocidas. Elige otra.',
  'sin-servicio': 'El inicio de sesión no está disponible en este momento.',
  desconocido: 'No pudimos completar la operación. Inténtalo de nuevo.',
}

export const CUENTA_CREADA =
  'Si el correo es válido, te enviamos un enlace para confirmar tu cuenta. Ábrelo en este mismo navegador.'

export const RECUPERACION_ENVIADA =
  'Si existe una cuenta con ese correo, recibirás un enlace para cambiar la contraseña. Ábrelo en este mismo navegador.'
