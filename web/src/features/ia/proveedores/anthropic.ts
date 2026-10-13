import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import {
  ErrorIA,
  esquemaAnalisis,
  normalizarAnalisis,
  PROMPT_ANALISIS,
  type MotivoFalloIA,
} from '../../../domain/ia'
import type { ClienteIA } from './tipos'

/**
 * Modelos en los que un rechazo por política puede resolverse en el servidor
 * con otro modelo (`fallbacks: "default"`), en lugar de devolver el rechazo.
 */
const CON_RESPALDO = new Set(['claude-fable-5-1', 'claude-opus-5-5', 'claude-opus-5', 'claude-sonnet-5-5'])
const BETA_RESPALDO = 'server-side-fallback-2026-07-01'

function motivoDe(error: unknown): MotivoFalloIA {
  if (error instanceof Anthropic.AuthenticationError || error instanceof Anthropic.PermissionDeniedError) {
    return 'clave'
  }
  if (error instanceof Anthropic.RateLimitError) return 'limite'
  if (error instanceof Anthropic.NotFoundError || error instanceof Anthropic.BadRequestError) {
    return 'modelo'
  }
  if (error instanceof Anthropic.APIConnectionError) return 'red'
  return 'desconocido'
}

/** Ejecuta una llamada al SDK y traduce sus errores; una cancelación se propaga tal cual. */
async function llamar<T>(operacion: () => Promise<T>): Promise<T> {
  try {
    return await operacion()
  } catch (error) {
    if (error instanceof ErrorIA) throw error
    if (error instanceof Anthropic.APIUserAbortError) throw new DOMException('Cancelado', 'AbortError')
    throw new ErrorIA(
      motivoDe(error),
      error instanceof Anthropic.APIError && error.status ? `HTTP ${error.status}` : null,
    )
  }
}

export function crearClienteAnthropic(apiKey: string): ClienteIA {
  // El SDK se usa desde el navegador a propósito: la clave es del usuario,
  // vive en su dispositivo y solo viaja a Anthropic.
  const cliente = new Anthropic({ apiKey, dangerouslyAllowBrowser: true, maxRetries: 1 })

  return {
    listarModelos: () =>
      llamar(async () => {
        const modelos = []
        for await (const modelo of cliente.models.list({ limit: 100 })) {
          modelos.push({ id: modelo.id, nombre: modelo.display_name })
        }
        return modelos
      }),

    analizarFoto: (modelo, foto, indicacion) =>
      llamar(async () => {
        const respuesta = await cliente.messages.parse({
          model: modelo,
          max_tokens: 16000,
          system: PROMPT_ANALISIS,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: { type: 'base64', media_type: foto.tipoMime, data: foto.base64 },
                },
                { type: 'text', text: indicacion },
              ],
            },
          ],
          output_config: { format: zodOutputFormat(esquemaAnalisis) },
        })
        if (respuesta.stop_reason === 'refusal') throw new ErrorIA('rechazo')
        if (!respuesta.parsed_output) throw new ErrorIA('respuesta')
        return normalizarAnalisis(respuesta.parsed_output)
      }),

    conversar: (modelo, sistema, mensajes, alRecibir, senal) =>
      llamar(async () => {
        const base = {
          model: modelo,
          max_tokens: 16000,
          system: sistema,
          messages: mensajes.map((mensaje) => ({
            role: mensaje.rol === 'usuario' ? ('user' as const) : ('assistant' as const),
            content: mensaje.texto,
          })),
        }
        const opciones = { signal: senal }
        let acumulado = ''
        const alTexto = (trozo: string) => {
          acumulado += trozo
          alRecibir(acumulado)
        }

        let motivoDeParada: string | null
        if (CON_RESPALDO.has(modelo)) {
          const flujo = cliente.beta.messages.stream(
            { ...base, betas: [BETA_RESPALDO], fallbacks: 'default' },
            opciones,
          )
          flujo.on('text', alTexto)
          motivoDeParada = (await flujo.finalMessage()).stop_reason
        } else {
          const flujo = cliente.messages.stream(base, opciones)
          flujo.on('text', alTexto)
          motivoDeParada = (await flujo.finalMessage()).stop_reason
        }

        if (motivoDeParada === 'refusal') throw new ErrorIA('rechazo')
        if (!acumulado.trim()) throw new ErrorIA('respuesta')
        return acumulado
      }),
  }
}
