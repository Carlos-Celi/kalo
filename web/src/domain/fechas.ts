/** Día del calendario local del usuario, como "2026-10-12". */
export type ClaveDia = string

const LOCALE = 'es-ES'
const diaMes = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'short' })
const hora = new Intl.DateTimeFormat(LOCALE, { hour: '2-digit', minute: '2-digit', hour12: false })

export function claveDia(fecha: Date): ClaveDia {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${fecha.getFullYear()}-${mes}-${dia}`
}

/** Medianoche local del día indicado. */
export function deClave(clave: ClaveDia): Date {
  const [anio, mes, dia] = clave.split('-').map(Number)
  return new Date(anio, mes - 1, dia)
}

export function esClaveDia(texto: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(texto) && claveDia(deClave(texto)) === texto
}

export function sumarDias(clave: ClaveDia, dias: number): ClaveDia {
  const fecha = deClave(clave)
  fecha.setDate(fecha.getDate() + dias)
  return claveDia(fecha)
}

/** Los `cantidad` días que terminan en `hasta`, en orden cronológico. */
export function ultimosDias(hasta: ClaveDia, cantidad: number): ClaveDia[] {
  return Array.from({ length: cantidad }, (_, i) => sumarDias(hasta, i - (cantidad - 1)))
}

/** "12 oct" */
export function formatoDiaMes(clave: ClaveDia): string {
  return diaMes.format(deClave(clave)).replace('.', '')
}

/** "Hoy, 12 oct" · "Ayer, 11 oct" · "10 oct" */
export function formatoDiaRelativo(clave: ClaveDia, hoy: ClaveDia): string {
  const texto = formatoDiaMes(clave)
  if (clave === hoy) return `Hoy, ${texto}`
  if (clave === sumarDias(hoy, -1)) return `Ayer, ${texto}`
  return texto
}

/** "16:05" a partir de un instante ISO. */
export function formatoHora(iso: string): string {
  return hora.format(new Date(iso))
}
