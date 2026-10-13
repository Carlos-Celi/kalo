import { describe, expect, it } from 'vitest'
import { LIMITES, validarEdad, validarNombre, type DatosPerfil } from './perfil'
import {
  ajustar,
  calcularMetas,
  notaProteina,
  pesoMetaSugerido,
  resumenDelPlan,
  tasaMetabolicaBasal,
} from './plan'

// El perfil de ejemplo del diseño (Medidas, Objetivos, Habitos, Metas).
const ejemplo: DatosPerfil = {
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
}

describe('calcularMetas', () => {
  it('con el perfil de ejemplo da las metas del diseño', () => {
    expect(calcularMetas(ejemplo)).toEqual({
      kcal: 1850,
      proteinaG: 140,
      aguaL: 2.5,
      ejercicioMin: 60,
      suenoMin: 480,
    })
  })

  it('aplica la ecuación de Mifflin-St Jeor según el sexo', () => {
    expect(tasaMetabolicaBasal(ejemplo)).toBe(1710)
    expect(tasaMetabolicaBasal({ ...ejemplo, sexo: 'femenino' })).toBe(1544)
    expect(tasaMetabolicaBasal({ ...ejemplo, sexo: 'sin-especificar' })).toBe(1627)
  })

  it('sube calorías y proteína para ganar músculo y no añade déficit al mantener', () => {
    expect(calcularMetas({ ...ejemplo, objetivo: 'mantener' }).kcal).toBe(2350)
    const musculo = calcularMetas({ ...ejemplo, objetivo: 'musculo' })
    expect(musculo.kcal).toBe(2650)
    expect(musculo.proteinaG).toBe(155)
  })

  it('nunca propone menos del mínimo de calorías', () => {
    const metas = calcularMetas({
      ...ejemplo,
      sexo: 'femenino',
      edad: 80,
      estaturaCm: 150,
      pesoKg: 40,
      actividad: 'sedentario',
    })
    expect(metas.kcal).toBe(LIMITES.kcal.min)
  })

  it('propone menos ejercicio a quien parte del sedentarismo', () => {
    expect(calcularMetas({ ...ejemplo, actividad: 'sedentario' }).ejercicioMin).toBe(30)
  })
})

describe('peso meta y resumen', () => {
  it('sugiere un peso meta solo al bajar de peso', () => {
    expect(pesoMetaSugerido('bajar', 78)).toBe(72)
    expect(pesoMetaSugerido('mantener', 78)).toBe(78)
  })

  it('resume el plan como en el diseño', () => {
    expect(resumenDelPlan(ejemplo)).toEqual({
      titulo: 'Bajar de 78 a 72 kg',
      detalle: '0,5 kg por semana · ≈ 12 semanas',
    })
    expect(resumenDelPlan({ ...ejemplo, objetivo: 'mantener' }).titulo).toBe('Mantener 78 kg')
  })

  it('no promete semanas si el peso meta no es menor que el actual', () => {
    expect(resumenDelPlan({ ...ejemplo, pesoMetaKg: 80 }).titulo).toBe('Bajar de peso')
  })

  it('expresa la proteína por kilo de peso', () => {
    expect(notaProteina(140, ejemplo)).toBe('≈ 1,8 g por kg para conservar tu masa muscular')
  })
})

describe('ajustar', () => {
  it('respeta los límites y no acumula decimales', () => {
    expect(ajustar(2.5, 0.25, LIMITES.aguaL)).toBe(2.75)
    expect(ajustar(0.1 + 0.2, 0.25, LIMITES.aguaL)).toBe(0.55)
    expect(ajustar(1000, -50, LIMITES.kcal)).toBe(1000)
    expect(ajustar(5000, 50, LIMITES.kcal)).toBe(5000)
  })
})

describe('validación del perfil', () => {
  it('exige nombre y limita su longitud', () => {
    expect(validarNombre('   ')).toBe('Escribe tu nombre.')
    expect(validarNombre('a'.repeat(61))).not.toBeNull()
    expect(validarNombre(' Ana ')).toBeNull()
  })

  it('acota la edad', () => {
    expect(validarEdad(Number.NaN)).toBe('Escribe tu edad en años.')
    expect(validarEdad(12)).not.toBeNull()
    expect(validarEdad(130)).not.toBeNull()
    expect(validarEdad(30)).toBeNull()
  })
})
