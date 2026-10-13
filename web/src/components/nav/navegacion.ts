import { rutas } from '../../app/rutas'
import type { NombreIcono } from '../ui/Icon'

export interface EntradaNav {
  ruta: string
  etiqueta: string
  icono: NombreIcono
  /** Coincidencia exacta (solo Inicio, para no quedar activo en todas). */
  exacta?: boolean
}

/** Las cuatro secciones del tab bar; el acceso rápido (+) va aparte. */
export const entradasNav: EntradaNav[] = [
  { ruta: rutas.inicio, etiqueta: 'Inicio', icono: 'casa', exacta: true },
  { ruta: rutas.registros, etiqueta: 'Registros', icono: 'portapapeles' },
  { ruta: rutas.asistente, etiqueta: 'Asistente', icono: 'chat' },
  { ruta: rutas.progreso, etiqueta: 'Progreso', icono: 'barras' },
]
