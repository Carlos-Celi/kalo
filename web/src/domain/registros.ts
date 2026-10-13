import type { ClaveDia } from './fechas'
import type { Metas } from './perfil'
import { estadoAnillo } from './reglas'
import type { Avance, EstadoAnillo } from './tipos'

export const TIPOS_COMIDA = ['desayuno', 'almuerzo', 'cena', 'snack', 'licor'] as const
export type TipoComida = (typeof TIPOS_COMIDA)[number]

/** Solo estos tipos admiten marcar una bebida con alcohol. */
export const TIPOS_CON_ALCOHOL: readonly TipoComida[] = ['snack', 'licor']

export const SECCIONES = ['comida', 'agua', 'ejercicio', 'sueno'] as const
export type Seccion = (typeof SECCIONES)[number]

export interface Comida {
  id: string
  fecha: ClaveDia
  tipo: TipoComida
  nombre: string
  porcion: string
  kcal: number
  proteinaG: number
  carbohidratosG: number
  azucarG: number
  grasaG: number
  esAlcohol: boolean
  /** % vol; solo si es una bebida con alcohol. */
  gradosAlcohol: number | null
  /** "ia" si los valores los estimó la IA a partir de una foto. */
  origen: 'manual' | 'ia'
  /** Si se guardó la foto (ultracomprimida) con la comida; la imagen se pide aparte. */
  tieneFoto: boolean
  creadoEn: string
}

export type NuevaComida = Omit<Comida, 'id' | 'creadoEn' | 'tieneFoto'>

export interface Agua {
  id: string
  fecha: ClaveDia
  ml: number
  creadoEn: string
}

export interface Ejercicio {
  id: string
  fecha: ClaveDia
  minutos: number
  nombre: string
  kcal: number
  /** "manual" si las calorías las puso la persona (reloj, pulsera…); "estimado" si salen de los minutos. */
  origenKcal: 'estimado' | 'manual'
  creadoEn: string
}

/** Lo que se envía al registrar ejercicio; con `kcal` nulo se estiman a partir de los minutos. */
export interface NuevoEjercicio {
  fecha: ClaveDia
  minutos: number
  nombre: string
  kcal: number | null
}

/** Sueño de la noche que termina en `fecha`. */
export interface Sueno {
  fecha: ClaveDia
  minutos: number
}

/** Una siesta durante el día `fecha`. Se suma al sueño de la noche. */
export interface Siesta {
  id: string
  fecha: ClaveDia
  minutos: number
  creadoEn: string
}

export interface Peso {
  fecha: ClaveDia
  kg: number
  nota: string
}

export interface Registros {
  comidas: Comida[]
  aguas: Agua[]
  ejercicios: Ejercicio[]
  suenos: Sueno[]
  siestas: Siesta[]
}

export const LIMITES_REGISTRO = {
  nombre: 80,
  porcion: 40,
  kcal: 5000,
  gramos: 999,
  gradosAlcohol: 100,
  aguaMl: 3000,
  ejercicioMin: 600,
  ejercicioKcal: 5000,
  ejercicioNombre: 80,
  suenoMin: 840,
  siestaMin: 240,
  /** Largo máximo del texto de la foto (data URL en WebP o JPEG). */
  fotoCaracteres: 100_000,
  nota: 120,
} as const

export const PASO_SUENO_MIN = 15
export const PASO_PESO_KG = 0.1

/** Estimación para el registro rápido de ejercicio, sin tipo de actividad. */
export const KCAL_POR_MINUTO = 3.7

export function kcalDeEjercicio(minutos: number): number {
  return Math.round(minutos * KCAL_POR_MINUTO)
}

const HORA = /^([01]\d|2[0-3]):([0-5]\d)$/

/**
 * Minutos entre la hora de dormir y la de despertar ("23:30" → "07:00" = 450).
 * Si la de despertar es anterior, se entiende que cruza la medianoche. Null
 * si alguna hora no es válida o coinciden.
 */
export function duracionDeSueno(dormir: string, despertar: string): number | null {
  const a = HORA.exec(dormir)
  const b = HORA.exec(despertar)
  if (!a || !b) return null
  const inicio = Number(a[1]) * 60 + Number(a[2])
  const fin = Number(b[1]) * 60 + Number(b[2])
  if (inicio === fin) return null
  return (fin - inicio + 24 * 60) % (24 * 60)
}

export interface TotalesDia {
  kcal: number
  proteinaG: number
  aguaMl: number
  ejercicioMin: number
  ejercicioKcal: number
  /** Sueño total del día: la noche que termina hoy más las siestas. */
  suenoMin: number
  suenoNocheMin: number
  siestaMin: number
  /** Cuántos tipos de comida distintos tienen algo registrado. */
  tiposDeComida: number
}

const sumar = (valores: number[]) => valores.reduce((total, valor) => total + valor, 0)

export function totalesDelDia(registros: Registros, fecha: ClaveDia): TotalesDia {
  const comidas = registros.comidas.filter((comida) => comida.fecha === fecha)
  const ejercicios = registros.ejercicios.filter((ejercicio) => ejercicio.fecha === fecha)
  const noche = registros.suenos.find((sueno) => sueno.fecha === fecha)?.minutos ?? 0
  const siestas = sumar(
    registros.siestas.filter((siesta) => siesta.fecha === fecha).map((siesta) => siesta.minutos),
  )
  return {
    kcal: sumar(comidas.map((comida) => comida.kcal)),
    proteinaG: Math.round(sumar(comidas.map((comida) => comida.proteinaG))),
    aguaMl: sumar(registros.aguas.filter((agua) => agua.fecha === fecha).map((agua) => agua.ml)),
    ejercicioMin: sumar(ejercicios.map((ejercicio) => ejercicio.minutos)),
    ejercicioKcal: sumar(ejercicios.map((ejercicio) => ejercicio.kcal)),
    suenoMin: noche + siestas,
    suenoNocheMin: noche,
    siestaMin: siestas,
    tiposDeComida: new Set(comidas.map((comida) => comida.tipo)).size,
  }
}

/** Avance del día en la unidad de cada sección: kcal, litros, minutos y minutos. */
export function avanceDe(seccion: Seccion, totales: TotalesDia, metas: Metas): Avance {
  switch (seccion) {
    case 'comida':
      return { valor: totales.kcal, meta: metas.kcal }
    case 'agua':
      return { valor: totales.aguaMl / 1000, meta: metas.aguaL }
    case 'ejercicio':
      return { valor: totales.ejercicioMin, meta: metas.ejercicioMin }
    case 'sueno':
      return { valor: totales.suenoMin, meta: metas.suenoMin }
  }
}

export function estadoDe(seccion: Seccion, avance: Avance): EstadoAnillo {
  return estadoAnillo(avance, seccion === 'comida' ? 'calorias' : 'habito')
}

/**
 * Días seguidos cumpliendo la meta. `estados` va en orden cronológico y
 * termina en hoy: un hoy aún sin cumplir no rompe la racha, solo no suma.
 */
export function racha(estados: EstadoAnillo[]): number {
  let dias = 0
  for (let i = estados.length - 1; i >= 0; i--) {
    if (estados[i] === 'cumplido') dias += 1
    else if (i !== estados.length - 1) break
  }
  return dias
}

const COMIDAS_PRINCIPALES: TipoComida[] = ['desayuno', 'almuerzo', 'cena']

/** La primera comida principal del día que falta por registrar; "snack" si están todas. */
export function siguienteComida(registros: Registros, fecha: ClaveDia): TipoComida {
  const hechas = new Set(
    registros.comidas.filter((comida) => comida.fecha === fecha).map((comida) => comida.tipo),
  )
  return COMIDAS_PRINCIPALES.find((tipo) => !hechas.has(tipo)) ?? 'snack'
}

/** Media de los días con dato; 0 si no hay ninguno. */
export function promedio(valores: number[]): number {
  const conDato = valores.filter((valor) => valor > 0)
  return conDato.length === 0 ? 0 : sumar(conDato) / conDato.length
}
