import type { Perfil, Plan } from '../domain/perfil'
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

/** El perfil de ejemplo del diseño del onboarding, ya completado. */
export function perfilDeEjemplo(): Perfil {
  return {
    nombre: 'Carlos',
    plan: {
      datos: {
        nombre: 'Carlos',
        edad: 30,
        sexo: 'masculino',
        estaturaCm: 172,
        pesoKg: 78,
        objetivo: 'bajar',
        pesoMetaKg: 72,
        actividad: 'ligero',
        suenoHabitual: '5-7',
        alcohol: 'fines-de-semana',
        restricciones: ['sin-lactosa'],
      },
      metas: { kcal: 1850, proteinaG: 140, aguaL: 2.5, ejercicioMin: 60, suenoMin: 480 },
    },
  }
}

/**
 * Registros del día de ejemplo con el nombre y las metas del perfil: hasta
 * que existan los registros reales, lo único propio del usuario es su plan.
 */
export function resumenInicioDeEjemplo(perfil: Perfil, hoy: Date = new Date()): ResumenInicio {
  const metas = perfil.plan?.metas ?? perfilDeEjemplo().plan!.metas
  return {
    nombre: perfil.nombre,
    fecha: hoy,
    calorias: { valor: 1190, meta: metas.kcal },
    proteina: { valor: 52, meta: metas.proteinaG },
    agua: { valor: 1.6, meta: metas.aguaL },
    ejercicio: { valor: 35, meta: metas.ejercicioMin },
    sueno: { valor: 405, meta: metas.suenoMin },
    comidas: { valor: 3, meta: 5 },
    siguientePaso: {
      comida: 'cena',
      mensaje: 'Una cena con pollo o huevo te acerca.',
    },
    caloriasSemana: ultimosSieteDias(hoy),
  }
}

// En modo demostración el perfil vive en memoria: se pierde al recargar.
let perfilActual = perfilDeEjemplo()

/** Para las pruebas: fija el perfil en memoria (por defecto, el de ejemplo). */
export function restablecerPerfilMock(perfil: Perfil = perfilDeEjemplo()): void {
  perfilActual = perfil
}

export const repositoriosMock: Repositorios = {
  resumen: {
    obtenerResumenInicio: async () => resumenInicioDeEjemplo(perfilActual),
  },
  perfil: {
    obtener: async () => perfilActual,
    guardarPlan: async (plan: Plan) => {
      perfilActual = { nombre: plan.datos.nombre, plan }
    },
  },
}
