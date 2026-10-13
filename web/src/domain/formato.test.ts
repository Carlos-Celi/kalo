import { describe, expect, it } from 'vitest'
import {
  formatoDecimal,
  formatoDiaCorto,
  formatoDuracion,
  formatoEntero,
  formatoFechaLarga,
} from './formato'

describe('formato', () => {
  it('agrupa los miles desde cuatro cifras', () => {
    expect(formatoEntero(1190)).toBe('1.190')
    expect(formatoEntero(660)).toBe('660')
  })

  it('usa coma decimal y omite el decimal si es cero', () => {
    expect(formatoDecimal(1.6)).toBe('1,6')
    expect(formatoDecimal(0.9)).toBe('0,9')
    expect(formatoDecimal(2)).toBe('2')
  })

  it('expresa duraciones en horas y minutos', () => {
    expect(formatoDuracion(405)).toBe('6 h 45')
    expect(formatoDuracion(480)).toBe('8 h')
    expect(formatoDuracion(75)).toBe('1 h 15')
    expect(formatoDuracion(65)).toBe('1 h 05')
    expect(formatoDuracion(25)).toBe('25 min')
  })

  it('escribe la fecha como en el diseño', () => {
    expect(formatoFechaLarga(new Date(2026, 9, 12))).toBe('Lunes 12 de octubre')
  })

  it('abrevia el día a dos letras', () => {
    expect(formatoDiaCorto(new Date(2026, 9, 13))).toBe('Ma')
    expect(formatoDiaCorto(new Date(2026, 9, 17))).toBe('Sá')
  })
})
