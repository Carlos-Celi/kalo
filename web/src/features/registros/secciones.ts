import { rutas } from '../../app/rutas'
import type { NombreIcono } from '../../components/ui/Icon'
import { formatoDecimal, formatoDuracion, formatoEntero } from '../../domain/formato'
import type { Metas } from '../../domain/perfil'
import type { Seccion } from '../../domain/registros'

interface EstiloSeccion {
  nombre: string
  ruta: string
  icono: NombreIcono
  /** Fondo de la pestaña activa y del botón "Registrar" (contraste con texto blanco). */
  claseActiva: string
  /** Color del anillo, como variable CSS para el degradado cónico. */
  colorAnillo: string
  claseAnillo: string
  tituloSemana: string
  tituloDetalle: (esHoy: boolean) => string
  notaMeta: (metas: Metas) => string
}

export const secciones: Record<Seccion, EstiloSeccion> = {
  comida: {
    nombre: 'Comida',
    ruta: rutas.registros,
    icono: 'cubiertos',
    claseActiva: 'border-kalo bg-kalo',
    colorAnillo: 'var(--color-kalo)',
    claseAnillo: 'bg-kalo',
    tituloSemana: 'Calorías de la semana',
    tituloDetalle: (esHoy) => (esHoy ? 'Comidas de hoy' : 'Comidas del día'),
    notaMeta: (metas) => `Cumplido = entre 90 % y 105 % de tus ${formatoEntero(metas.kcal)} kcal`,
  },
  agua: {
    nombre: 'Agua',
    ruta: rutas.registrosAgua,
    icono: 'gota',
    claseActiva: 'border-agua-fuerte bg-agua-fuerte',
    colorAnillo: 'var(--color-agua)',
    claseAnillo: 'bg-agua',
    tituloSemana: 'Agua de la semana',
    tituloDetalle: (esHoy) => (esHoy ? 'Agua de hoy' : 'Agua del día'),
    notaMeta: (metas) => `Cumplido = ${formatoDecimal(metas.aguaL, 2)} L o más`,
  },
  ejercicio: {
    nombre: 'Ejercicio',
    ruta: rutas.registrosEjercicio,
    icono: 'mancuerna',
    claseActiva: 'border-ejercicio-fuerte bg-ejercicio-fuerte',
    colorAnillo: 'var(--color-ejercicio)',
    claseAnillo: 'bg-ejercicio',
    tituloSemana: 'Ejercicio de la semana',
    tituloDetalle: (esHoy) => (esHoy ? 'Ejercicio de hoy' : 'Ejercicio del día'),
    notaMeta: (metas) => `Cumplido = ${formatoEntero(metas.ejercicioMin)} min o más`,
  },
  sueno: {
    nombre: 'Sueño',
    ruta: rutas.registrosSueno,
    icono: 'luna',
    claseActiva: 'border-sueno bg-sueno',
    colorAnillo: 'var(--color-sueno)',
    claseAnillo: 'bg-sueno',
    tituloSemana: 'Sueño de la semana',
    tituloDetalle: (esHoy) => (esHoy ? 'Sueño de anoche' : 'Sueño de esa noche'),
    notaMeta: (metas) => `Cumplido = ${formatoDuracion(metas.suenoMin)} o más`,
  },
}
