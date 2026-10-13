import type { Metas } from './perfil'
import type { TotalesDia } from './registros'

export const TIPOS_RECORDATORIO = ['agua', 'comidas', 'ejercicio', 'dormir', 'peso', 'propio'] as const
export type TipoRecordatorio = (typeof TIPOS_RECORDATORIO)[number]

export interface Recordatorio {
  id: string
  tipo: TipoRecordatorio
  nombre: string
  /** Horas del aviso, como "08:00", en orden. */
  horas: string[]
  /** Días de la semana en que avisa: 0 = domingo … 6 = sábado. */
  dias: number[]
  activo: boolean
}

const TODOS_LOS_DIAS = [0, 1, 2, 3, 4, 5, 6]

/** Los cinco recordatorios del diseño, con sus horarios y su estado inicial. */
export function recordatoriosPorDefecto(): Recordatorio[] {
  return [
    {
      id: 'agua',
      tipo: 'agua',
      nombre: 'Beber agua',
      horas: ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'],
      dias: TODOS_LOS_DIAS,
      activo: true,
    },
    {
      id: 'comidas',
      tipo: 'comidas',
      nombre: 'Registrar comidas',
      horas: ['08:00', '13:00', '20:00'],
      dias: TODOS_LOS_DIAS,
      activo: true,
    },
    { id: 'ejercicio', tipo: 'ejercicio', nombre: 'Ejercicio', horas: ['18:00'], dias: [1, 3, 5], activo: false },
    { id: 'dormir', tipo: 'dormir', nombre: 'Ir a dormir', horas: ['22:30'], dias: TODOS_LOS_DIAS, activo: true },
    { id: 'peso', tipo: 'peso', nombre: 'Pesarte', horas: ['07:00'], dias: [1], activo: true },
  ]
}

export const LIMITE_NOMBRE_RECORDATORIO = 40
export const MAXIMO_RECORDATORIOS = 20

const esHora = (valor: unknown): valor is string =>
  typeof valor === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(valor)

/** Lee lo guardado en el dispositivo sin fiarse de su forma; null si no sirve. */
export function leerRecordatorios(guardado: unknown): Recordatorio[] | null {
  if (!Array.isArray(guardado) || guardado.length > MAXIMO_RECORDATORIOS) return null
  const leidos: Recordatorio[] = []
  for (const elemento of guardado as unknown[]) {
    if (typeof elemento !== 'object' || elemento === null) return null
    const { id, tipo, nombre, horas, dias, activo } = elemento as Record<string, unknown>
    const tipoValido = TIPOS_RECORDATORIO.find((valido) => valido === tipo)
    if (
      typeof id !== 'string' || !tipoValido || typeof nombre !== 'string' ||
      nombre.length === 0 || nombre.length > LIMITE_NOMBRE_RECORDATORIO ||
      !Array.isArray(horas) || horas.length === 0 || horas.length > 24 || !horas.every(esHora) ||
      !Array.isArray(dias) || !dias.every((dia) => TODOS_LOS_DIAS.includes(dia as number)) ||
      typeof activo !== 'boolean'
    ) {
      return null
    }
    leidos.push({ id, tipo: tipoValido, nombre, horas: horas as string[], dias: dias as number[], activo })
  }
  return leidos
}

const NOMBRES_DIA = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']
const DIAS_LARGOS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
// Para listar los días empezando por el lunes.
const ORDEN_SEMANA = [1, 2, 3, 4, 5, 6, 0]

/** "08:00" → "8:00" */
const horaCorta = (hora: string) => hora.replace(/^0/, '')

function textoDias(dias: number[]): string {
  if (dias.length === 7) return 'Todos los días'
  if (dias.length === 1) return DIAS_LARGOS[dias[0]]
  const nombres = ORDEN_SEMANA.filter((dia) => dias.includes(dia)).map((dia) => NOMBRES_DIA[dia])
  const texto = nombres.join(', ')
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

/** "Cada 2 horas · 8:00 a 20:00" · "8:00 · 13:00 · 20:00" · "Lun, mié, vie · 18:00" */
export function descripcionDe({ horas, dias }: Recordatorio): string {
  const minutos = horas.map((hora) => Number(hora.slice(0, 2)) * 60 + Number(hora.slice(3)))
  const salto = minutos.length > 3 ? minutos[1] - minutos[0] : 0
  const regular = salto > 0 && salto % 60 === 0 && minutos.every((m, i) => i === 0 || m - minutos[i - 1] === salto)
  const cuando = regular
    ? `Cada ${salto / 60 === 1 ? 'hora' : `${salto / 60} horas`} · ${horaCorta(horas[0])} a ${horaCorta(horas.at(-1)!)}`
    : horas.map(horaCorta).join(' · ')
  return dias.length === 7 && horas.length > 1 ? cuando : `${textoDias(dias)} · ${cuando}`
}

export interface AvisoPendiente {
  recordatorio: Recordatorio
  hora: string
  /** Identifica este aviso concreto, para no repetirlo. */
  clave: string
}

/** Minutos tras la hora programada en los que el aviso todavía se entrega. */
export const VENTANA_MIN = 10

/** Avisos que tocan ahora y aún no se han entregado. */
export function avisosPendientes(
  recordatorios: Recordatorio[],
  ahora: Date,
  entregados: ReadonlySet<string>,
): AvisoPendiente[] {
  const minutoActual = ahora.getHours() * 60 + ahora.getMinutes()
  const fecha = `${ahora.getFullYear()}-${ahora.getMonth() + 1}-${ahora.getDate()}`
  return recordatorios
    .filter((recordatorio) => recordatorio.activo && recordatorio.dias.includes(ahora.getDay()))
    .flatMap((recordatorio) =>
      recordatorio.horas.flatMap((hora) => {
        const minuto = Number(hora.slice(0, 2)) * 60 + Number(hora.slice(3))
        const clave = `${fecha}|${recordatorio.id}|${hora}`
        const toca = minutoActual >= minuto && minutoActual < minuto + VENTANA_MIN
        return toca && !entregados.has(clave) ? [{ recordatorio, hora, clave }] : []
      }),
    )
}

/**
 * Avisos inteligentes: no se avisa si la meta de agua ya está cumplida, si
 * ya se hizo el ejercicio del día o si ya hay comidas registradas para la
 * hora del aviso (una por cada aviso de comida que ha pasado).
 */
export function convieneAvisar(
  { recordatorio, hora }: AvisoPendiente,
  totales: TotalesDia,
  comidasRegistradas: number,
  metas: Metas,
): boolean {
  switch (recordatorio.tipo) {
    case 'agua':
      return totales.aguaMl < metas.aguaL * 1000
    case 'ejercicio':
      return totales.ejercicioMin < metas.ejercicioMin
    case 'comidas':
      return comidasRegistradas < recordatorio.horas.indexOf(hora) + 1
    default:
      return true
  }
}

export function textoDelAviso({ tipo, nombre }: Recordatorio): { titulo: string; cuerpo: string } {
  switch (tipo) {
    case 'agua':
      return { titulo: 'Hora de beber agua', cuerpo: 'Un vaso ahora te acerca a tu meta de hoy.' }
    case 'comidas':
      return { titulo: 'Registra tu comida', cuerpo: 'Anótala ahora para no perder la cuenta del día.' }
    case 'ejercicio':
      return { titulo: 'Hora de moverte', cuerpo: 'Unos minutos de ejercicio suman a tu meta.' }
    case 'dormir':
      return { titulo: 'Hora de ir a dormir', cuerpo: 'Dormir bien ayuda a regular el hambre.' }
    case 'peso':
      return { titulo: 'Toca pesarte', cuerpo: 'Registra tu peso para mantener tu gráfica al día.' }
    case 'propio':
      return { titulo: nombre, cuerpo: 'Recordatorio de Kalo.' }
  }
}
