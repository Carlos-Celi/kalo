const LOCALE = 'es-ES'

// `useGrouping: 'always'` porque en español los miles no se agrupan por
// defecto hasta las cinco cifras y el diseño muestra "1.190".
const entero = new Intl.NumberFormat(LOCALE, {
  maximumFractionDigits: 0,
  useGrouping: 'always',
})

const unDecimal = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
  useGrouping: 'always',
})

const fechaLarga = new Intl.DateTimeFormat(LOCALE, {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})

const diaCorto = new Intl.DateTimeFormat(LOCALE, { weekday: 'short' })

/** 1190 → "1.190" */
export function formatoEntero(valor: number): string {
  return entero.format(valor)
}

const dosDecimales = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
  useGrouping: 'always',
})

/** 1.6 → "1,6" · 2 → "2". Con `decimales = 2`: 2.25 → "2,25" */
export function formatoDecimal(valor: number, decimales: 1 | 2 = 1): string {
  return (decimales === 2 ? dosDecimales : unDecimal).format(valor)
}

/** 405 → "6 h 45" · 480 → "8 h" · 25 → "25 min" */
export function formatoDuracion(minutos: number): string {
  const total = Math.max(Math.round(minutos), 0)
  const horas = Math.floor(total / 60)
  const resto = total % 60
  if (horas === 0) return `${resto} min`
  return resto === 0 ? `${horas} h` : `${horas} h ${String(resto).padStart(2, '0')}`
}

/** "Lunes 12 de octubre" */
export function formatoFechaLarga(fecha: Date): string {
  const texto = fechaLarga.format(fecha).replace(',', '')
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

/** Etiqueta de dos letras para los ejes semanales: "Ma", "Mi", "Sá"… */
export function formatoDiaCorto(fecha: Date): string {
  const texto = diaCorto.format(fecha).slice(0, 2)
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

const unDecimalFijo = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
  useGrouping: 'always',
})

/** 78 → "78,0" */
export function formatoPeso(kg: number): string {
  return unDecimalFijo.format(kg)
}

/** Número escrito por el usuario, con coma o punto decimal; NaN si no lo es. */
export function numeroDeTexto(texto: string): number {
  const limpio = texto.trim().replace(',', '.')
  return limpio === '' || !/^\d+(\.\d+)?$/.test(limpio) ? Number.NaN : Number(limpio)
}
