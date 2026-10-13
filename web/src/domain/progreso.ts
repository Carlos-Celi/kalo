import { deClave, sumarDias, ultimosDias, type ClaveDia } from './fechas'
import { formatoDiaCorto } from './formato'
import { promedio, type Peso } from './registros'

/** Totales de un día; es lo que devuelve el servidor para las gráficas. */
export interface ResumenDia {
  fecha: ClaveDia
  kcal: number
  proteinaG: number
  azucarG: number
  grasaG: number
  aguaMl: number
  ejercicioMin: number
  ejercicioKcal: number
  suenoMin: number
  bebidasAlcohol: number
  kcalAlcohol: number
}

export const PERIODOS = ['semana', 'mes', 'ano'] as const
export type Periodo = (typeof PERIODOS)[number]

interface ConfigPeriodo {
  etiqueta: string
  /** Días de registros que abarca. */
  dias: number
  /** Días de historial de peso que se muestran. */
  diasDePeso: number
  /** "esta semana", para acompañar los totales. */
  esteTramo: string
  /** "6 semanas", para el cambio de peso. */
  tramoDePeso: string
}

export const periodos: Record<Periodo, ConfigPeriodo> = {
  semana: { etiqueta: 'Semana', dias: 7, diasDePeso: 42, esteTramo: 'esta semana', tramoDePeso: '6 semanas' },
  mes: { etiqueta: 'Mes', dias: 28, diasDePeso: 91, esteTramo: 'este mes', tramoDePeso: '3 meses' },
  ano: { etiqueta: 'Año', dias: 364, diasDePeso: 364, esteTramo: 'este año', tramoDePeso: '12 meses' },
}

/** Referencias diarias generales para un adulto (las del diseño). */
export const REFERENCIA_AZUCAR_G = 50
export const REFERENCIA_GRASA_G = 65

/** Una barra de la gráfica: un día, una semana o cuatro semanas, según el periodo. */
export interface Tramo {
  etiqueta: string
  /** Texto completo para lectores de pantalla. */
  nombre: string
  /** El tramo en curso (hoy, esta semana…). */
  actual: boolean
  /** Promedios diarios del tramo, contando solo los días con registro. */
  kcal: number
  proteinaG: number
  aguaMl: number
  suenoMin: number
}

const mesCorto = new Intl.DateTimeFormat('es-ES', { month: 'short' })
const diaMes = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' })

function tramoDe(dias: ResumenDia[], etiqueta: string, nombre: string, actual: boolean): Tramo {
  return {
    etiqueta,
    nombre,
    actual,
    kcal: Math.round(promedio(dias.map((dia) => dia.kcal))),
    proteinaG: Math.round(promedio(dias.map((dia) => dia.proteinaG))),
    aguaMl: Math.round(promedio(dias.map((dia) => dia.aguaMl))),
    suenoMin: Math.round(promedio(dias.map((dia) => dia.suenoMin))),
  }
}

/**
 * Parte los días del periodo en las barras de la gráfica: 7 días, 4 semanas
 * o 13 tramos de cuatro semanas. `resumenes` puede traer huecos.
 */
export function tramosDe(periodo: Periodo, resumenes: ResumenDia[], hoy: ClaveDia): Tramo[] {
  const porFecha = new Map(resumenes.map((resumen) => [resumen.fecha, resumen]))
  const dias = ultimosDias(hoy, periodos[periodo].dias)
  const de = (fechas: ClaveDia[]) =>
    fechas.flatMap((fecha) => {
      const resumen = porFecha.get(fecha)
      return resumen ? [resumen] : []
    })

  if (periodo === 'semana') {
    return dias.map((fecha) => {
      const esHoy = fecha === hoy
      const corto = formatoDiaCorto(deClave(fecha))
      return tramoDe(de([fecha]), esHoy ? 'Hoy' : corto, esHoy ? 'Hoy' : diaMes.format(deClave(fecha)), esHoy)
    })
  }

  const porTramo = periodo === 'mes' ? 7 : 28
  const tramos: Tramo[] = []
  for (let inicio = 0; inicio < dias.length; inicio += porTramo) {
    const fechas = dias.slice(inicio, inicio + porTramo)
    const primera = deClave(fechas[0])
    const actual = inicio + porTramo >= dias.length
    const desde = diaMes.format(primera).replace('.', '')
    tramos.push(
      tramoDe(
        de(fechas),
        periodo === 'mes' ? desde : mesCorto.format(primera).replace('.', ''),
        periodo === 'mes' ? `Semana del ${desde}` : `Cuatro semanas desde el ${desde}`,
        actual,
      ),
    )
  }
  return tramos
}

export interface ResumenPeriodo {
  kcalPromedio: number
  proteinaPromedio: number
  aguaMlPromedio: number
  suenoMinPromedio: number
  azucarPromedio: number
  grasaPromedio: number
  ejercicioMin: number
  ejercicioKcal: number
  bebidasAlcohol: number
  kcalAlcohol: number
  /** Días anteriores a hoy con algo de comida registrado, y cuántos llegaron a la meta de proteína. */
  diasConComida: number
  diasConProteina: number
}

const total = (valores: number[]) => valores.reduce((suma, valor) => suma + valor, 0)
const media = (valores: number[]) => (valores.length === 0 ? 0 : total(valores) / valores.length)

export function resumirPeriodo(
  periodo: Periodo,
  resumenes: ResumenDia[],
  hoy: ClaveDia,
  metaProteinaG: number,
): ResumenPeriodo {
  const desde = sumarDias(hoy, -(periodos[periodo].dias - 1))
  const dias = resumenes.filter((dia) => dia.fecha >= desde && dia.fecha <= hoy)
  const conComida = dias.filter((dia) => dia.kcal > 0)
  const previosConComida = conComida.filter((dia) => dia.fecha < hoy)
  return {
    kcalPromedio: Math.round(promedio(dias.map((dia) => dia.kcal))),
    proteinaPromedio: Math.round(promedio(dias.map((dia) => dia.proteinaG))),
    aguaMlPromedio: Math.round(promedio(dias.map((dia) => dia.aguaMl))),
    suenoMinPromedio: Math.round(promedio(dias.map((dia) => dia.suenoMin))),
    // Azúcar y grasa se promedian sobre los días con comida, aunque sumen 0.
    azucarPromedio: Math.round(media(conComida.map((dia) => dia.azucarG))),
    grasaPromedio: Math.round(media(conComida.map((dia) => dia.grasaG))),
    ejercicioMin: total(dias.map((dia) => dia.ejercicioMin)),
    ejercicioKcal: total(dias.map((dia) => dia.ejercicioKcal)),
    bebidasAlcohol: total(dias.map((dia) => dia.bebidasAlcohol)),
    kcalAlcohol: total(dias.map((dia) => dia.kcalAlcohol)),
    diasConComida: previosConComida.length,
    diasConProteina: previosConComida.filter((dia) => dia.proteinaG >= metaProteinaG).length,
  }
}

/** Cambio entre el primer y el último peso del tramo; null con menos de dos registros. */
export function cambioDePeso(pesos: Peso[]): number | null {
  if (pesos.length < 2) return null
  return Math.round((pesos[pesos.length - 1].kg - pesos[0].kg) * 10) / 10
}
