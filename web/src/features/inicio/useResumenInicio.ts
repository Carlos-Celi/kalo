import { deClave, ultimosDias, type ClaveDia } from '../../domain/fechas'
import type { Perfil } from '../../domain/perfil'
import {
  siguienteComida,
  TIPOS_COMIDA,
  totalesDelDia,
  type Registros,
  type TipoComida,
} from '../../domain/registros'
import type { ResumenInicio } from '../../domain/tipos'
import { usePerfil } from '../perfil/contexto'
import { useRegistros, type AccionesRegistros } from '../registros/useRegistros'

type Estado =
  | { fase: 'cargando' }
  | { fase: 'listo'; resumen: ResumenInicio }
  | { fase: 'error' }

const ideas: Record<TipoComida, { comun: string; vegetariana: string }> = {
  desayuno: {
    comun: 'Un desayuno con huevo o yogur te acerca.',
    vegetariana: 'Un desayuno con huevo o yogur te acerca.',
  },
  almuerzo: {
    comun: 'Un almuerzo con pollo o legumbres te acerca.',
    vegetariana: 'Un almuerzo con legumbres o tofu te acerca.',
  },
  cena: {
    comun: 'Una cena con pollo o huevo te acerca.',
    vegetariana: 'Una cena con huevo o legumbres te acerca.',
  },
  snack: {
    comun: 'Un snack con yogur o frutos secos te acerca.',
    vegetariana: 'Un snack con yogur o frutos secos te acerca.',
  },
  licor: { comun: '', vegetariana: '' },
}

/** Lo que Inicio muestra, a partir del plan del usuario y sus registros de la semana. */
export function construirResumen(perfil: Perfil, registros: Registros, hoy: ClaveDia): ResumenInicio | null {
  const plan = perfil.plan
  if (!plan) return null
  const { metas } = plan
  const totales = totalesDelDia(registros, hoy)
  const siguiente = siguienteComida(registros, hoy)
  const idea = ideas[siguiente]
  return {
    nombre: perfil.nombre,
    fecha: deClave(hoy),
    calorias: { valor: totales.kcal, meta: metas.kcal },
    proteina: { valor: totales.proteinaG, meta: metas.proteinaG },
    agua: { valor: totales.aguaMl / 1000, meta: metas.aguaL },
    ejercicio: { valor: totales.ejercicioMin, meta: metas.ejercicioMin },
    sueno: { valor: totales.suenoMin, meta: metas.suenoMin },
    comidas: { valor: totales.tiposDeComida, meta: TIPOS_COMIDA.length },
    siguientePaso: {
      comida: siguiente,
      mensaje: plan.datos.restricciones.includes('vegetariano') ? idea.vegetariana : idea.comun,
    },
    semana: ultimosDias(hoy, 7).map((dia) => {
      const totalesDia = totalesDelDia(registros, dia)
      return {
        fecha: deClave(dia),
        kcal: totalesDia.kcal,
        proteinaG: totalesDia.proteinaG,
        aguaL: totalesDia.aguaMl / 1000,
      }
    }),
  }
}

/** El resumen más las acciones rápidas de hoy (el atajo de agua de Inicio). */
export type ResultadoInicio = Estado & { hoy: ClaveDia; acciones: AccionesRegistros }

export function useResumenInicio(): ResultadoInicio {
  const { perfil } = usePerfil()
  const { hoy, estado, acciones } = useRegistros(7)
  if (estado.fase !== 'listo') return { ...estado, hoy, acciones }
  const resumen = construirResumen(perfil, estado.registros, hoy)
  return resumen ? { fase: 'listo', resumen, hoy, acciones } : { fase: 'error', hoy, acciones }
}
