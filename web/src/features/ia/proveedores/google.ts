import { ErrorIA, leerAnalisis, PROMPT_ANALISIS, type MotivoFalloIA } from '../../../domain/ia'
import { campo, eventosSse, leerJson, pedir, type ClienteIA } from './tipos'

const BASE = 'https://generativelanguage.googleapis.com/v1beta'

// Gemini no recibe aquí un esquema: se le pide JSON y se le describen las claves.
const FORMATO_JSON = `

Responde únicamente con un objeto JSON con estas claves exactas: nombre (texto), porcion (texto), cantidad (entero), unidad (texto), kcal, kcal_minimo, kcal_maximo, proteina_g, carbohidratos_g, azucar_g, grasa_g, confianza (números), ingredientes (lista de textos), es_alcohol (booleano) y grados_alcohol (número o null).`

const ruta = (modelo: string, metodo: string) =>
  `${BASE}/models/${encodeURIComponent(modelo)}:${metodo}`

/**
 * Google responde 400 (no 401) a una clave inválida, así que el código HTTP
 * no basta: el motivo sale de `error.status` y de `details[].reason`.
 */
export function motivoDeGoogle(
  _estado: number,
  cuerpo: unknown,
): { motivo: MotivoFalloIA | null; codigo?: string } {
  const detalles = campo(cuerpo, 'error', 'details')
  const razon = (Array.isArray(detalles) ? detalles : [])
    .map((detalle) => campo(detalle, 'reason'))
    .find((valor): valor is string => typeof valor === 'string' && /^[A-Z_]{3,60}$/.test(valor))
  const estado = campo(cuerpo, 'error', 'status')
  const codigo = razon ?? (typeof estado === 'string' && /^[A-Z_]{3,60}$/.test(estado) ? estado : undefined)
  if (razon === 'API_KEY_INVALID' || razon === 'API_KEY_SERVICE_BLOCKED') return { motivo: 'clave', codigo }
  switch (estado) {
    case 'PERMISSION_DENIED':
    case 'UNAUTHENTICATED':
      return { motivo: 'clave', codigo }
    case 'RESOURCE_EXHAUSTED':
      return { motivo: 'limite', codigo }
    case 'NOT_FOUND':
      return { motivo: 'modelo', codigo }
    default:
      return { motivo: null, codigo }
  }
}

/** Texto de un candidato; lanza si la respuesta fue bloqueada. */
function textoDe(respuesta: unknown): string {
  if (campo(respuesta, 'promptFeedback', 'blockReason')) throw new ErrorIA('rechazo')
  const candidato = campo(respuesta, 'candidates', 0)
  const motivo = campo(candidato, 'finishReason')
  if (motivo === 'SAFETY' || motivo === 'PROHIBITED_CONTENT' || motivo === 'BLOCKLIST') {
    throw new ErrorIA('rechazo')
  }
  const partes = campo(candidato, 'content', 'parts')
  if (!Array.isArray(partes)) return ''
  return partes
    // Las partes de razonamiento no forman parte de la respuesta.
    .filter((parte) => campo(parte, 'thought') !== true)
    .map((parte) => campo(parte, 'text'))
    .filter((texto): texto is string => typeof texto === 'string')
    .join('')
}

export function crearClienteGoogle(apiKey: string): ClienteIA {
  // La clave va en una cabecera, nunca en la URL.
  const cabeceras = { 'x-goog-api-key': apiKey, 'Content-Type': 'application/json' }

  return {
    async listarModelos() {
      const modelos = campo(
        await leerJson(await pedir(`${BASE}/models?pageSize=200`, { headers: cabeceras }, motivoDeGoogle)),
        'models',
      )
      if (!Array.isArray(modelos)) throw new ErrorIA('respuesta')
      return modelos.flatMap((modelo) => {
        const nombre = campo(modelo, 'name')
        const metodos = campo(modelo, 'supportedGenerationMethods')
        if (
          typeof nombre !== 'string' || !nombre.startsWith('models/gemini') ||
          !Array.isArray(metodos) || !metodos.includes('generateContent')
        ) {
          return []
        }
        const id = nombre.slice('models/'.length)
        const visible = campo(modelo, 'displayName')
        return [{ id, nombre: typeof visible === 'string' && visible ? visible : id }]
      })
    },

    async analizarFoto(modelo, foto, indicacion) {
      const respuesta = await pedir(ruta(modelo, 'generateContent'), {
        method: 'POST',
        headers: cabeceras,
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: PROMPT_ANALISIS + FORMATO_JSON }] },
          contents: [
            {
              role: 'user',
              parts: [
                { inlineData: { mimeType: foto.tipoMime, data: foto.base64 } },
                { text: indicacion },
              ],
            },
          ],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      }, motivoDeGoogle)
      const texto = textoDe(await leerJson(respuesta))
      if (!texto) throw new ErrorIA('respuesta')
      return leerAnalisis(texto)
    },

    async conversar(modelo, sistema, mensajes, alRecibir, senal) {
      const respuesta = await pedir(`${ruta(modelo, 'streamGenerateContent')}?alt=sse`, {
        method: 'POST',
        headers: cabeceras,
        signal: senal,
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: sistema }] },
          contents: mensajes.map((mensaje) => ({
            role: mensaje.rol === 'usuario' ? 'user' : 'model',
            parts: [{ text: mensaje.texto }],
          })),
        }),
      }, motivoDeGoogle)
      let acumulado = ''
      for await (const evento of eventosSse(respuesta)) {
        const trozo = textoDe(evento)
        if (trozo) {
          acumulado += trozo
          alRecibir(acumulado)
        }
      }
      if (!acumulado.trim()) throw new ErrorIA('respuesta')
      return acumulado
    },
  }
}
