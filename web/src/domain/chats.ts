import { z } from 'zod'
import type { MensajeChat, SugerenciaComida } from './ia'

/** Preguntas del usuario que admite un chat; después hay que abrir uno nuevo. */
export const LIMITE_MENSAJES_POR_CHAT = 20
/** Cuántos chats se conservan: al crear otro se descarta el menos reciente. */
export const MAXIMO_CHATS = 3
/** Largo máximo de una pregunta. */
export const LIMITE_CONSULTA = 1000

/** Un turno de la conversación: lo que se envió al proveedor y lo que se ve. */
export interface TurnoChat extends MensajeChat {
  visible: string
  sugerencias: SugerenciaComida[]
}

export interface Chat {
  id: string
  titulo: string
  /** Milisegundos desde 1970. */
  creadoEn: number
  actualizadoEn: number
  turnos: TurnoChat[]
}

const esquemaTurno = z.object({
  rol: z.enum(['usuario', 'asistente']),
  texto: z.string().max(60_000),
  visible: z.string().max(60_000),
  sugerencias: z
    .array(
      z.object({
        nombre: z.string().max(80),
        kcal: z.number(),
        proteina_g: z.number(),
        carbohidratos_g: z.number(),
        azucar_g: z.number(),
        grasa_g: z.number(),
      }),
    )
    .max(6),
})

const esquemaChat = z.object({
  id: z.string().min(1).max(60),
  titulo: z.string().max(80),
  creadoEn: z.number(),
  actualizadoEn: z.number(),
  turnos: z.array(esquemaTurno).max(LIMITE_MENSAJES_POR_CHAT * 2 + 2),
})

/** Lo guardado en el dispositivo, sin fiarse de su forma: descarta lo que no cumple. */
export function leerChats(guardado: unknown): Chat[] {
  if (!Array.isArray(guardado)) return []
  const leidos = (guardado as unknown[]).flatMap((elemento) => {
    const resultado = esquemaChat.safeParse(elemento)
    return resultado.success ? [resultado.data] : []
  })
  return recientes(leidos)
}

/** Los más recientes primero, hasta el máximo. */
export function recientes(chats: Chat[]): Chat[] {
  return [...chats].sort((a, b) => b.actualizadoEn - a.actualizadoEn).slice(0, MAXIMO_CHATS)
}

/** Preguntas del usuario que ya lleva el chat. */
export function mensajesEnviados(chat: Pick<Chat, 'turnos'> | null): number {
  return chat ? chat.turnos.filter((turno) => turno.rol === 'usuario').length : 0
}

export function chatLleno(chat: Pick<Chat, 'turnos'> | null): boolean {
  return mensajesEnviados(chat) >= LIMITE_MENSAJES_POR_CHAT
}

/** Título del chat: el comienzo de la primera pregunta. */
export function tituloDeChat(pregunta: string): string {
  const limpio = pregunta.replace(/\s+/g, ' ').trim()
  return limpio.length > 42 ? `${limpio.slice(0, 41).trimEnd()}…` : limpio || 'Chat nuevo'
}

/** Añade o sustituye un chat y conserva solo los recientes. */
export function guardarChat(chats: Chat[], chat: Chat): Chat[] {
  return recientes([...chats.filter((otro) => otro.id !== chat.id), chat])
}

export function quitarChat(chats: Chat[], id: string): Chat[] {
  return chats.filter((chat) => chat.id !== id)
}
