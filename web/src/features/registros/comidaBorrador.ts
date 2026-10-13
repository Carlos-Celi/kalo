import type { ClaveDia } from '../../domain/fechas'
import { numeroDeTexto } from '../../domain/formato'
import {
  LIMITES_REGISTRO,
  TIPOS_CON_ALCOHOL,
  type Comida,
  type NuevaComida,
  type TipoComida,
} from '../../domain/registros'

export const tiposDeComida: Record<TipoComida, { etiqueta: string; destino: string }> = {
  desayuno: { etiqueta: 'Desayuno', destino: 'Desayuno' },
  almuerzo: { etiqueta: 'Almuerzo', destino: 'Almuerzo' },
  cena: { etiqueta: 'Cena', destino: 'Cena' },
  snack: { etiqueta: 'Snack', destino: 'Snacks y licor' },
  licor: { etiqueta: 'Licor', destino: 'Snacks y licor' },
}

/** Los campos del formulario, tal como se escriben. */
export interface BorradorComida {
  tipo: TipoComida
  nombre: string
  porcion: string
  kcal: string
  proteinaG: string
  carbohidratosG: string
  azucarG: string
  grasaG: string
  esAlcohol: boolean
  gradosAlcohol: string
}

const numero = (valor: number) => String(valor).replace('.', ',')

export function borradorDeComida(comida: Omit<NuevaComida, 'fecha' | 'origen'>): BorradorComida {
  return {
    tipo: comida.tipo,
    nombre: comida.nombre,
    porcion: comida.porcion,
    kcal: numero(comida.kcal),
    proteinaG: numero(comida.proteinaG),
    carbohidratosG: numero(comida.carbohidratosG),
    azucarG: numero(comida.azucarG),
    grasaG: numero(comida.grasaG),
    esAlcohol: comida.esAlcohol,
    gradosAlcohol: comida.gradosAlcohol === null ? '' : numero(comida.gradosAlcohol),
  }
}

export function borradorVacio(tipo: TipoComida): BorradorComida {
  return {
    tipo,
    nombre: '',
    porcion: '',
    kcal: '',
    proteinaG: '',
    carbohidratosG: '',
    azucarG: '',
    grasaG: '',
    esAlcohol: tipo === 'licor',
    gradosAlcohol: '',
  }
}

export type ErroresComida = Partial<Record<keyof BorradorComida, string>>

/** Vacío cuenta como 0; devuelve null si no es un número dentro del límite. */
function gramos(texto: string, maximo: number): number | null {
  if (texto.trim() === '') return 0
  const valor = numeroDeTexto(texto)
  return Number.isFinite(valor) && valor <= maximo ? Math.round(valor * 10) / 10 : null
}

/** Valida el formulario: devuelve la comida lista para guardar o los errores por campo. */
export function validarComida(
  b: BorradorComida,
  fecha: ClaveDia,
  origen: Comida['origen'],
): { comida: NuevaComida } | { errores: ErroresComida } {
  const errores: ErroresComida = {}
  const nombre = b.nombre.trim()
  if (!nombre) errores.nombre = 'Escribe el nombre.'
  const kcal = numeroDeTexto(b.kcal)
  if (!Number.isFinite(kcal) || kcal > LIMITES_REGISTRO.kcal) {
    errores.kcal = `Entre 0 y ${LIMITES_REGISTRO.kcal}.`
  }
  const macros = {
    proteinaG: gramos(b.proteinaG, LIMITES_REGISTRO.gramos),
    carbohidratosG: gramos(b.carbohidratosG, LIMITES_REGISTRO.gramos),
    azucarG: gramos(b.azucarG, LIMITES_REGISTRO.gramos),
    grasaG: gramos(b.grasaG, LIMITES_REGISTRO.gramos),
  }
  for (const [campo, valor] of Object.entries(macros)) {
    if (valor === null) errores[campo as keyof typeof macros] = 'Revisa el número.'
  }
  // La marca de alcohol solo existe en snacks y licores: en el resto se descarta.
  const esAlcohol = b.esAlcohol && TIPOS_CON_ALCOHOL.includes(b.tipo)
  const grados = esAlcohol ? gramos(b.gradosAlcohol, LIMITES_REGISTRO.gradosAlcohol) : 0
  if (grados === null) errores.gradosAlcohol = 'Entre 0 y 100.'
  if (Object.keys(errores).length > 0) return { errores }
  return {
    comida: {
      fecha,
      tipo: b.tipo,
      nombre,
      porcion: b.porcion.trim(),
      kcal: Math.round(kcal),
      proteinaG: macros.proteinaG ?? 0,
      carbohidratosG: macros.carbohidratosG ?? 0,
      azucarG: macros.azucarG ?? 0,
      grasaG: macros.grasaG ?? 0,
      esAlcohol,
      gradosAlcohol: esAlcohol && b.gradosAlcohol.trim() !== '' ? grados : null,
      origen,
    },
  }
}
