import { beforeEach, describe, expect, it } from 'vitest'
import { borrarDatosLocales } from './datosLocales'

beforeEach(() => localStorage.clear())

describe('borrarDatosLocales', () => {
  it('borra lo que Kalo guardó y deja lo ajeno', async () => {
    localStorage.setItem('kalo:chats:u1', '[]')
    localStorage.setItem('kalo:ia:u1', '{}')
    sessionStorage.setItem('kalo.freno-login', '{}')
    localStorage.setItem('otra-app', 'x')

    await borrarDatosLocales()

    expect(localStorage.getItem('kalo:chats:u1')).toBeNull()
    expect(localStorage.getItem('kalo:ia:u1')).toBeNull()
    expect(sessionStorage.getItem('kalo.freno-login')).toBeNull()
    expect(localStorage.getItem('otra-app')).toBe('x')
  })
})
