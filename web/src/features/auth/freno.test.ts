import { describe, expect, it } from 'vitest'
import { FRENO_INICIAL, INTENTOS_LIBRES, segundosDeEspera, trasFallo, type EstadoFreno } from './freno'

function fallar(veces: number, ahora: number): EstadoFreno {
  let estado = FRENO_INICIAL
  for (let i = 0; i < veces; i++) estado = trasFallo(estado, ahora)
  return estado
}

describe('freno de inicio de sesión', () => {
  it('no bloquea los primeros intentos', () => {
    expect(segundosDeEspera(fallar(INTENTOS_LIBRES - 1, 0), 0)).toBe(0)
  })

  it('bloquea 30 s al quinto fallo y duplica la espera en cada fallo siguiente', () => {
    expect(segundosDeEspera(fallar(5, 0), 0)).toBe(30)
    expect(segundosDeEspera(fallar(6, 0), 0)).toBe(60)
    expect(segundosDeEspera(fallar(7, 0), 0)).toBe(120)
  })

  it('nunca espera más de 15 minutos', () => {
    expect(segundosDeEspera(fallar(40, 0), 0)).toBe(15 * 60)
  })

  it('la espera se consume con el tiempo', () => {
    const estado = fallar(5, 1_000)
    expect(segundosDeEspera(estado, 21_000)).toBe(10)
    expect(segundosDeEspera(estado, 31_000)).toBe(0)
  })
})
