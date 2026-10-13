import type { SupabaseClient } from '@supabase/supabase-js'
import {
  ACTIVIDADES,
  ALCOHOLES,
  OBJETIVOS,
  RESTRICCIONES,
  SEXOS,
  SUENOS_HABITUALES,
  type Perfil,
  type Plan,
} from '../domain/perfil'
import { resumenInicioDeEjemplo } from './mock'
import type { Repositorios } from './repositorios'

const COLUMNAS_PERFIL =
  'nombre, edad, sexo, estatura_cm, peso_kg, objetivo, peso_meta_kg, actividad, sueno_habitual, alcohol, restricciones, meta_kcal, meta_proteina_g, meta_agua_ml, meta_ejercicio_min, meta_sueno_min, onboarding_completado_en'

type Fila = Record<string, unknown>

function numero(valor: unknown): number | null {
  // Postgres devuelve `numeric` como texto.
  const n = typeof valor === 'string' ? Number(valor) : valor
  return typeof n === 'number' && Number.isFinite(n) ? n : null
}

function unoDe<T extends string>(valor: unknown, opciones: readonly T[]): T | null {
  return opciones.find((opcion) => opcion === valor) ?? null
}

/** Convierte la fila en un plan; null si el onboarding no está completo o algo no cuadra. */
function planDe(fila: Fila): Plan | null {
  if (!fila.onboarding_completado_en) return null
  const nombre = typeof fila.nombre === 'string' ? fila.nombre : null
  const edad = numero(fila.edad)
  const sexo = unoDe(fila.sexo, SEXOS)
  const estaturaCm = numero(fila.estatura_cm)
  const pesoKg = numero(fila.peso_kg)
  const objetivo = unoDe(fila.objetivo, OBJETIVOS)
  const pesoMetaKg = numero(fila.peso_meta_kg)
  const actividad = unoDe(fila.actividad, ACTIVIDADES)
  const suenoHabitual = unoDe(fila.sueno_habitual, SUENOS_HABITUALES)
  const alcohol = unoDe(fila.alcohol, ALCOHOLES)
  const kcal = numero(fila.meta_kcal)
  const proteinaG = numero(fila.meta_proteina_g)
  const aguaMl = numero(fila.meta_agua_ml)
  const ejercicioMin = numero(fila.meta_ejercicio_min)
  const suenoMin = numero(fila.meta_sueno_min)
  if (
    nombre === null || edad === null || sexo === null || estaturaCm === null ||
    pesoKg === null || objetivo === null || pesoMetaKg === null || actividad === null ||
    suenoHabitual === null || alcohol === null || kcal === null || proteinaG === null ||
    aguaMl === null || ejercicioMin === null || suenoMin === null
  ) {
    return null
  }
  const declaradas: unknown[] = Array.isArray(fila.restricciones) ? fila.restricciones : []
  return {
    datos: {
      nombre,
      edad,
      sexo,
      estaturaCm,
      pesoKg,
      objetivo,
      pesoMetaKg,
      actividad,
      suenoHabitual,
      alcohol,
      restricciones: RESTRICCIONES.filter((restriccion) => declaradas.includes(restriccion)),
    },
    metas: { kcal, proteinaG, aguaL: aguaMl / 1000, ejercicioMin, suenoMin },
  }
}

/**
 * Repositorios sobre Supabase. El perfil y las metas salen de la tabla
 * `perfiles`; los registros del día siguen siendo de ejemplo hasta que
 * exista su esquema.
 *
 * Las lecturas no filtran por usuario: RLS devuelve únicamente la fila propia.
 */
export function crearRepositoriosSupabase(cliente: SupabaseClient): Repositorios {
  async function obtenerPerfil(): Promise<Perfil> {
    const { data, error } = await cliente.from('perfiles').select(COLUMNAS_PERFIL).maybeSingle()
    if (error) throw new Error('No se pudo leer el perfil.')
    const fila: Fila = data ?? {}
    return {
      nombre: typeof fila.nombre === 'string' ? fila.nombre : '',
      plan: planDe(fila),
    }
  }

  return {
    resumen: {
      async obtenerResumenInicio() {
        return resumenInicioDeEjemplo(await obtenerPerfil())
      },
    },
    perfil: {
      obtener: obtenerPerfil,
      async guardarPlan({ datos, metas }) {
        // La API no admite un UPDATE sin filtro; RLS limita igualmente a la fila propia.
        const { data: sesion } = await cliente.auth.getSession()
        const id = sesion.session?.user.id
        if (!id) throw new Error('No hay sesión.')
        const { data, error } = await cliente
          .from('perfiles')
          .update({
            nombre: datos.nombre,
            edad: datos.edad,
            sexo: datos.sexo,
            estatura_cm: datos.estaturaCm,
            peso_kg: datos.pesoKg,
            objetivo: datos.objetivo,
            peso_meta_kg: datos.pesoMetaKg,
            actividad: datos.actividad,
            sueno_habitual: datos.suenoHabitual,
            alcohol: datos.alcohol,
            restricciones: datos.restricciones,
            meta_kcal: metas.kcal,
            meta_proteina_g: metas.proteinaG,
            meta_agua_ml: Math.round(metas.aguaL * 1000),
            meta_ejercicio_min: metas.ejercicioMin,
            meta_sueno_min: metas.suenoMin,
            onboarding_completado_en: new Date().toISOString(),
          })
          .eq('id', id)
          .select('id')
        if (error || !data || data.length !== 1) throw new Error('No se pudo guardar el plan.')
      },
    },
  }
}
