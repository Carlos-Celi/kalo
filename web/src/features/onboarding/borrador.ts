import { useOutletContext } from 'react-router'
import { numeroDeTexto } from '../../domain/formato'
import {
  validarEdad,
  validarNombre,
  validarPeso,
  type Actividad,
  type Alcohol,
  type DatosPerfil,
  type Objetivo,
  type Perfil,
  type Restriccion,
  type Sexo,
  type SuenoHabitual,
} from '../../domain/perfil'

/** Respuestas del onboarding mientras se rellenan; los campos de texto van tal cual se escriben. */
export interface Borrador {
  nombre: string
  edad: string
  sexo: Sexo | null
  estaturaCm: number
  pesoKg: number
  objetivo: Objetivo | null
  pesoMeta: string
  actividad: Actividad | null
  suenoHabitual: SuenoHabitual | null
  alcohol: Alcohol | null
  restricciones: Restriccion[]
}

export interface ContextoOnboarding {
  borrador: Borrador
  cambiar: (cambios: Partial<Borrador>) => void
  /** true si se está rehaciendo un plan que ya existía. */
  rehaciendo: boolean
}

export function useOnboarding(): ContextoOnboarding {
  return useOutletContext<ContextoOnboarding>()
}

export function borradorInicial(perfil: Perfil): Borrador {
  const datos = perfil.plan?.datos
  if (datos) {
    return {
      ...datos,
      edad: String(datos.edad),
      pesoMeta: textoDePeso(datos.pesoMetaKg),
      restricciones: [...datos.restricciones],
    }
  }
  return {
    nombre: perfil.nombre,
    edad: '',
    sexo: null,
    estaturaCm: 170,
    pesoKg: 70,
    objetivo: null,
    pesoMeta: '',
    actividad: null,
    suenoHabitual: null,
    alcohol: null,
    restricciones: [],
  }
}

/** El peso tal como se escribe en español: 64.5 → "64,5". */
export function textoDePeso(kg: number): string {
  return String(kg).replace('.', ',')
}

/** Acepta coma o punto decimal; NaN si no es un número. */
export const aNumero = numeroDeTexto

export function pasoPerfilCompleto(b: Borrador): boolean {
  return !validarNombre(b.nombre) && !validarEdad(aNumero(b.edad)) && b.sexo !== null
}

export function pasoObjetivosCompleto(b: Borrador): boolean {
  return b.objetivo !== null && !validarPeso(aNumero(b.pesoMeta))
}

export function pasoHabitosCompleto(b: Borrador): boolean {
  return b.actividad !== null && b.suenoHabitual !== null && b.alcohol !== null
}

/** Los datos listos para calcular y guardar el plan; null si falta algo. */
export function aDatos(b: Borrador): DatosPerfil | null {
  if (!pasoPerfilCompleto(b) || !pasoObjetivosCompleto(b) || !pasoHabitosCompleto(b)) return null
  return {
    nombre: b.nombre.trim(),
    edad: aNumero(b.edad),
    sexo: b.sexo!,
    estaturaCm: b.estaturaCm,
    pesoKg: b.pesoKg,
    objetivo: b.objetivo!,
    pesoMetaKg: Math.round(aNumero(b.pesoMeta) * 10) / 10,
    actividad: b.actividad!,
    suenoHabitual: b.suenoHabitual!,
    alcohol: b.alcohol!,
    restricciones: b.restricciones,
  }
}
