import { ErrorIA, esquemaAnalisisJson, leerAnalisis, PROMPT_ANALISIS } from '../../../domain/ia'
import { campo, eventosSse, leerJson, pedir, type ClienteIA } from './tipos'

const BASE = 'https://api.openai.com/v1'

/** Modelos de conversación; se descartan los de audio, imagen, voz e incrustaciones. */
const ES_DE_CHAT = /^(gpt-|o\d|chatgpt-)/
const NO_SIRVE = /(audio|realtime|transcribe|tts|image|embedding|moderation|instruct|search|codex)/

export function crearClienteOpenAI(apiKey: string): ClienteIA {
  const cabeceras = { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }

  return {
    async listarModelos() {
      const datos = campo(await leerJson(await pedir(`${BASE}/models`, { headers: cabeceras })), 'data')
      if (!Array.isArray(datos)) throw new ErrorIA('respuesta')
      return datos
        .map((modelo) => campo(modelo, 'id'))
        .filter((id): id is string => typeof id === 'string' && ES_DE_CHAT.test(id) && !NO_SIRVE.test(id))
        .sort()
        .map((id) => ({ id, nombre: id }))
    },

    async analizarFoto(modelo, foto, indicacion) {
      const respuesta = await pedir(`${BASE}/chat/completions`, {
        method: 'POST',
        headers: cabeceras,
        body: JSON.stringify({
          model: modelo,
          messages: [
            { role: 'system', content: PROMPT_ANALISIS },
            {
              role: 'user',
              content: [
                { type: 'text', text: indicacion },
                {
                  type: 'image_url',
                  image_url: { url: `data:${foto.tipoMime};base64,${foto.base64}` },
                },
              ],
            },
          ],
          response_format: {
            type: 'json_schema',
            json_schema: { name: 'analisis_comida', strict: true, schema: esquemaAnalisisJson },
          },
        }),
      })
      const mensaje = campo(await leerJson(respuesta), 'choices', 0, 'message')
      if (campo(mensaje, 'refusal')) throw new ErrorIA('rechazo')
      const contenido = campo(mensaje, 'content')
      if (typeof contenido !== 'string') throw new ErrorIA('respuesta')
      return leerAnalisis(contenido)
    },

    async conversar(modelo, sistema, mensajes, alRecibir, senal) {
      const respuesta = await pedir(`${BASE}/chat/completions`, {
        method: 'POST',
        headers: cabeceras,
        signal: senal,
        body: JSON.stringify({
          model: modelo,
          stream: true,
          messages: [
            { role: 'system', content: sistema },
            ...mensajes.map((mensaje) => ({
              role: mensaje.rol === 'usuario' ? 'user' : 'assistant',
              content: mensaje.texto,
            })),
          ],
        }),
      })
      let acumulado = ''
      for await (const evento of eventosSse(respuesta)) {
        const delta = campo(evento, 'choices', 0, 'delta')
        if (campo(delta, 'refusal')) throw new ErrorIA('rechazo')
        const trozo = campo(delta, 'content')
        if (typeof trozo === 'string' && trozo) {
          acumulado += trozo
          alRecibir(acumulado)
        }
      }
      if (!acumulado.trim()) throw new ErrorIA('respuesta')
      return acumulado
    },
  }
}
