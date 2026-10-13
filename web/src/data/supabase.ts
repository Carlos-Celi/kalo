import type { SupabaseClient } from '@supabase/supabase-js'
import { resumenInicioDeEjemplo } from './mock'
import type { Repositorios } from './repositorios'

/**
 * Repositorios sobre Supabase. De momento solo el nombre sale de la base de
 * datos (tabla `perfiles`); los registros del día siguen siendo de ejemplo
 * hasta que exista su esquema.
 *
 * Las consultas no filtran por usuario: RLS devuelve únicamente la fila propia.
 */
export function crearRepositoriosSupabase(cliente: SupabaseClient): Repositorios {
  return {
    resumen: {
      async obtenerResumenInicio() {
        const { data, error } = await cliente.from('perfiles').select('nombre').maybeSingle()
        if (error) throw new Error('No se pudo leer el perfil.')
        const nombre = typeof data?.nombre === 'string' ? data.nombre : ''
        return { ...resumenInicioDeEjemplo(), nombre }
      },
    },
  }
}
