import { describe, expect, it } from 'vitest'
import { estadoAnillo, fraccion, imc, porcentaje, restante } from './reglas'

describe('estadoAnillo', () => {
  it('marca vacío sin registro o sin meta', () => {
    expect(estadoAnillo({ valor: 0, meta: 1850 }, 'calorias')).toBe('vacio')
    expect(estadoAnillo({ valor: 500, meta: 0 })).toBe('vacio')
  })

  it('cumple calorías entre el 90 % y el 105 % de la meta', () => {
    expect(estadoAnillo({ valor: 1664, meta: 1850 }, 'calorias')).toBe('parcial')
    expect(estadoAnillo({ valor: 1665, meta: 1850 }, 'calorias')).toBe('cumplido')
    expect(estadoAnillo({ valor: 1850, meta: 1850 }, 'calorias')).toBe('cumplido')
    expect(estadoAnillo({ valor: 1942, meta: 1850 }, 'calorias')).toBe('cumplido')
  })

  it('solo las calorías pueden quedar excedidas', () => {
    expect(estadoAnillo({ valor: 1960, meta: 1850 }, 'calorias')).toBe('excedido')
    expect(estadoAnillo({ valor: 200, meta: 140 })).toBe('cumplido')
  })

  it('el resto de hábitos cumple al llegar a la meta', () => {
    expect(estadoAnillo({ valor: 2.4, meta: 2.5 })).toBe('parcial')
    expect(estadoAnillo({ valor: 2.5, meta: 2.5 })).toBe('cumplido')
  })
})

describe('avance', () => {
  it('calcula los porcentajes del diseño', () => {
    expect(porcentaje({ valor: 1190, meta: 1850 })).toBe(64)
    expect(porcentaje({ valor: 52, meta: 140 })).toBe(37)
  })

  it('no pasa de 1 ni baja de 0', () => {
    expect(fraccion({ valor: 3000, meta: 1850 })).toBe(1)
    expect(fraccion({ valor: -5, meta: 1850 })).toBe(0)
    expect(restante({ valor: 3000, meta: 1850 })).toBe(0)
  })
})

describe('imc', () => {
  it('es kg / m²', () => {
    expect(imc(72, 172)).toBeCloseTo(24.34, 2)
  })

  it('devuelve null con datos no válidos', () => {
    expect(imc(72, 0)).toBeNull()
  })
})
