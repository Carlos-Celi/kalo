import { rutas } from '../../app/rutas'
import type { NombreIcono } from '../../components/ui/Icon'
import type { TonoLinea } from '../../components/ui/LineaAvance'
import { formatoDecimal, formatoDuracion, formatoEntero } from '../../domain/formato'
import type { Metas } from '../../domain/perfil'
import type { Seccion } from '../../domain/registros'

interface EstiloSeccion {
  nombre: string
  ruta: string
  icono: NombreIcono
  /** Tono de la línea de avance de la semana. */
  tono: TonoLinea
  /** Borde en el color de este hábito (leyenda de la semana). */
  claseBorde: string
  tituloSemana: string
  tituloDetalle: (esHoy: boolean) => string
  notaMeta: (metas: Metas) => string
}

export const secciones: Record<Seccion, EstiloSeccion> = {
  comida: {
    nombre: 'Comida',
    ruta: rutas.registros,
    icono: 'cubiertos',
    tono: 'llama',
    claseBorde: 'border-llama',
    tituloSemana: 'Calorías de la semana',
    tituloDetalle: (esHoy) => (esHoy ? 'Comidas de hoy' : 'Comidas del día'),
    notaMeta: (metas) => `Cumplido = entre 90 % y 105 % de tus ${formatoEntero(metas.kcal)} kcal`,
  },
  agua: {
    nombre: 'Agua',
    ruta: rutas.registrosAgua,
    icono: 'gota',
    tono: 'agua',
    claseBorde: 'border-agua-luz',
    tituloSemana: 'Agua de la semana',
    tituloDetalle: (esHoy) => (esHoy ? 'Agua de hoy' : 'Agua del día'),
    notaMeta: (metas) => `Cumplido = ${formatoDecimal(metas.aguaL, 2)} L o más`,
  },
  ejercicio: {
    nombre: 'Ejercicio',
    ruta: rutas.registrosEjercicio,
    icono: 'mancuerna',
    tono: 'ejercicio',
    claseBorde: 'border-ejercicio-luz',
    tituloSemana: 'Ejercicio de la semana',
    tituloDetalle: (esHoy) => (esHoy ? 'Ejercicio de hoy' : 'Ejercicio del día'),
    notaMeta: (metas) => `Cumplido = ${formatoEntero(metas.ejercicioMin)} min o más`,
  },
  sueno: {
    nombre: 'Sueño',
    ruta: rutas.registrosSueno,
    icono: 'luna',
    tono: 'sueno',
    claseBorde: 'border-sueno-luz',
    tituloSemana: 'Sueño de la semana',
    tituloDetalle: (esHoy) => (esHoy ? 'Sueño de anoche' : 'Sueño de esa noche'),
    notaMeta: (metas) => `Cumplido = ${formatoDuracion(metas.suenoMin)} o más`,
  },
}
