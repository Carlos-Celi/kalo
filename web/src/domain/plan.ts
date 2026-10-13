import { formatoDecimal } from './formato'
import {
  LIMITES,
  type Actividad,
  type DatosPerfil,
  type Metas,
  type Objetivo,
  type Rango,
  type Sexo,
} from './perfil'

// Constante final de la ecuación de Mifflin-St Jeor; sin sexo declarado se
// usa el punto medio entre las dos.
const AJUSTE_SEXO: Record<Sexo, number> = {
  masculino: 5,
  femenino: -161,
  'sin-especificar': -78,
}

const FACTOR_ACTIVIDAD: Record<Actividad, number> = {
  sedentario: 1.2,
  ligero: 1.375,
  moderado: 1.55,
  intenso: 1.725,
}

/** kcal al día respecto al gasto: −500 equivale a perder unos 0,5 kg por semana. */
const AJUSTE_KCAL: Record<Objetivo, number> = {
  bajar: -500,
  mantener: 0,
  musculo: 300,
  sano: 0,
}

const PROTEINA_POR_KG: Record<Objetivo, number> = {
  bajar: 1.8,
  mantener: 1.4,
  musculo: 2,
  sano: 1.4,
}

const AGUA_ML_POR_KG = 33
export const KG_POR_SEMANA = 0.5

export const PASOS = {
  kcal: 50,
  proteinaG: 5,
  aguaL: 0.25,
  ejercicioMin: 5,
  suenoMin: 30,
  pesoKg: 0.5,
} as const

function redondear(valor: number, paso: number): number {
  return Math.round(Math.round(valor / paso) * paso * 100) / 100
}

function acotar(valor: number, { min, max }: Rango): number {
  return Math.min(Math.max(valor, min), max)
}

/** Suma `delta` sin salirse del rango ni acumular errores de coma flotante. */
export function ajustar(valor: number, delta: number, rango: Rango): number {
  return acotar(Math.round((valor + delta) * 100) / 100, rango)
}

/** Gasto en reposo (Mifflin-St Jeor), en kcal al día. */
export function tasaMetabolicaBasal(datos: Pick<DatosPerfil, 'pesoKg' | 'estaturaCm' | 'edad' | 'sexo'>): number {
  return 10 * datos.pesoKg + 6.25 * datos.estaturaCm - 5 * datos.edad + AJUSTE_SEXO[datos.sexo]
}

/** Metas sugeridas a partir del perfil; el usuario puede ajustarlas después. */
export function calcularMetas(datos: DatosPerfil): Metas {
  const gasto = tasaMetabolicaBasal(datos) * FACTOR_ACTIVIDAD[datos.actividad]
  return {
    kcal: acotar(redondear(gasto + AJUSTE_KCAL[datos.objetivo], PASOS.kcal), LIMITES.kcal),
    proteinaG: acotar(
      redondear(datos.pesoKg * PROTEINA_POR_KG[datos.objetivo], PASOS.proteinaG),
      LIMITES.proteinaG,
    ),
    aguaL: acotar(redondear((datos.pesoKg * AGUA_ML_POR_KG) / 1000, PASOS.aguaL), {
      min: 1.5,
      max: 4,
    }),
    ejercicioMin: datos.actividad === 'sedentario' ? 30 : 60,
    suenoMin: 480,
  }
}

/** Peso meta propuesto al elegir objetivo; solo "bajar" propone uno distinto del actual. */
export function pesoMetaSugerido(objetivo: Objetivo, pesoKg: number): number {
  const sugerido = objetivo === 'bajar' ? pesoKg * 0.92 : pesoKg
  return acotar(redondear(sugerido, PASOS.pesoKg), LIMITES.pesoKg)
}

export interface ResumenPlan {
  titulo: string
  detalle: string
}

/** Titular de la tarjeta "Tu plan". */
export function resumenDelPlan(datos: Pick<DatosPerfil, 'objetivo' | 'pesoKg' | 'pesoMetaKg'>): ResumenPlan {
  const actual = formatoDecimal(datos.pesoKg)
  const meta = formatoDecimal(datos.pesoMetaKg)
  switch (datos.objetivo) {
    case 'bajar': {
      const diferencia = datos.pesoKg - datos.pesoMetaKg
      if (diferencia <= 0) {
        return { titulo: 'Bajar de peso', detalle: 'Déficit calórico moderado' }
      }
      const semanas = Math.ceil(diferencia / KG_POR_SEMANA)
      return {
        titulo: `Bajar de ${actual} a ${meta} kg`,
        detalle: `${formatoDecimal(KG_POR_SEMANA)} kg por semana · ≈ ${semanas} ${semanas === 1 ? 'semana' : 'semanas'}`,
      }
    }
    case 'mantener':
      return { titulo: `Mantener ${actual} kg`, detalle: 'Equilibrio entre lo que comes y gastas' }
    case 'musculo':
      return {
        titulo: 'Ganar masa muscular',
        detalle:
          datos.pesoMetaKg > datos.pesoKg
            ? `De ${actual} a ${meta} kg · más proteína y entrenamiento`
            : 'Más proteína y entrenamiento',
      }
    case 'sano':
      return { titulo: 'Comer más sano', detalle: 'Mejor calidad, menos azúcar y grasa' }
  }
}

export const NOTA_CALORIAS: Record<Objetivo, string> = {
  bajar: 'Déficit moderado calculado con tu perfil',
  mantener: 'Lo que gastas en un día, según tu perfil',
  musculo: 'Superávit ligero calculado con tu perfil',
  sano: 'Lo que gastas en un día, según tu perfil',
}

const FIN_PROTEINA: Record<Objetivo, string> = {
  bajar: 'para conservar tu masa muscular',
  mantener: 'para mantener tu masa muscular',
  musculo: 'para ganar masa muscular',
  sano: 'para mantener tu masa muscular',
}

/** "≈ 1,8 g por kg para conservar tu masa muscular" */
export function notaProteina(proteinaG: number, datos: Pick<DatosPerfil, 'objetivo' | 'pesoKg'>): string {
  return `≈ ${formatoDecimal(proteinaG / datos.pesoKg)} g por kg ${FIN_PROTEINA[datos.objetivo]}`
}
