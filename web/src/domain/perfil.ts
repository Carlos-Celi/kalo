export const SEXOS = ['femenino', 'masculino', 'sin-especificar'] as const
export type Sexo = (typeof SEXOS)[number]

export const OBJETIVOS = ['bajar', 'mantener', 'musculo', 'sano'] as const
export type Objetivo = (typeof OBJETIVOS)[number]

export const ACTIVIDADES = ['sedentario', 'ligero', 'moderado', 'intenso'] as const
export type Actividad = (typeof ACTIVIDADES)[number]

export const SUENOS_HABITUALES = ['menos-5', '5-7', '7-9', 'mas-9'] as const
export type SuenoHabitual = (typeof SUENOS_HABITUALES)[number]

export const ALCOHOLES = ['nunca', 'fines-de-semana', 'frecuente'] as const
export type Alcohol = (typeof ALCOHOLES)[number]

export const RESTRICCIONES = [
  'vegetariano',
  'sin-lactosa',
  'sin-gluten',
  'diabetes',
  'hipertension',
] as const
export type Restriccion = (typeof RESTRICCIONES)[number]

/** Lo que el usuario cuenta de sí mismo en el onboarding. */
export interface DatosPerfil {
  nombre: string
  edad: number
  sexo: Sexo
  estaturaCm: number
  pesoKg: number
  objetivo: Objetivo
  pesoMetaKg: number
  actividad: Actividad
  suenoHabitual: SuenoHabitual
  alcohol: Alcohol
  restricciones: Restriccion[]
}

/** Metas diarias. Las dos principales son calorías y proteína. */
export interface Metas {
  kcal: number
  proteinaG: number
  aguaL: number
  ejercicioMin: number
  suenoMin: number
}

export interface Plan {
  datos: DatosPerfil
  metas: Metas
}

export interface Perfil {
  nombre: string
  /** null hasta que se completa el onboarding. */
  plan: Plan | null
}

export interface Rango {
  min: number
  max: number
}

/** Límites admitidos; la base de datos repite los mismos con `check`. */
export const LIMITES = {
  nombre: { min: 1, max: 60 },
  edad: { min: 16, max: 100 },
  estaturaCm: { min: 120, max: 220 },
  pesoKg: { min: 30, max: 200 },
  kcal: { min: 1000, max: 5000 },
  proteinaG: { min: 30, max: 300 },
  aguaL: { min: 0.5, max: 6 },
  ejercicioMin: { min: 0, max: 240 },
  suenoMin: { min: 240, max: 720 },
} as const satisfies Record<string, Rango>

export function dentro(valor: number, { min, max }: Rango): boolean {
  return Number.isFinite(valor) && valor >= min && valor <= max
}

/** Mensaje de error, o null si el nombre es válido. */
export function validarNombre(nombre: string): string | null {
  const limpio = nombre.trim()
  if (!limpio) return 'Escribe tu nombre.'
  if (limpio.length > LIMITES.nombre.max) {
    return `Usa como máximo ${LIMITES.nombre.max} caracteres.`
  }
  return null
}

export function validarEdad(edad: number): string | null {
  if (!Number.isInteger(edad)) return 'Escribe tu edad en años.'
  if (edad < LIMITES.edad.min) return `Kalo es para mayores de ${LIMITES.edad.min} años.`
  if (edad > LIMITES.edad.max) return 'Revisa la edad.'
  return null
}

export function validarPeso(pesoKg: number): string | null {
  if (!dentro(pesoKg, LIMITES.pesoKg)) {
    return `Escribe un peso entre ${LIMITES.pesoKg.min} y ${LIMITES.pesoKg.max} kg.`
  }
  return null
}
