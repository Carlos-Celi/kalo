import type { CaloriasDia, ResumenInicio } from '../domain/tipos'
import type { Repositorios } from './repositorios'

// Datos de ejemplo tomados de design/Inicio.dc.html.
const KCAL_ULTIMOS_7_DIAS = [1620, 1780, 1540, 1960, 1700, 1490, 1190]

function ultimosSieteDias(hoy: Date): CaloriasDia[] {
  return KCAL_ULTIMOS_7_DIAS.map((kcal, i) => {
    const fecha = new Date(hoy)
    fecha.setDate(hoy.getDate() - (KCAL_ULTIMOS_7_DIAS.length - 1 - i))
    return { fecha, kcal }
  })
}

export function resumenInicioDeEjemplo(hoy: Date = new Date()): ResumenInicio {
  return {
    nombre: 'Carlos',
    fecha: hoy,
    calorias: { valor: 1190, meta: 1850 },
    proteina: { valor: 52, meta: 140 },
    agua: { valor: 1.6, meta: 2.5 },
    ejercicio: { valor: 35, meta: 60 },
    sueno: { valor: 405, meta: 480 },
    comidas: { valor: 3, meta: 5 },
    siguientePaso: {
      comida: 'cena',
      mensaje: 'Una cena con pollo o huevo te acerca.',
    },
    caloriasSemana: ultimosSieteDias(hoy),
  }
}

export const repositoriosMock: Repositorios = {
  resumen: {
    obtenerResumenInicio: async () => resumenInicioDeEjemplo(),
  },
}
