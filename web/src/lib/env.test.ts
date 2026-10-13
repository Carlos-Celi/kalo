import { describe, expect, it } from 'vitest'
import { leerConfigSupabase } from './env'

function jwtConRol(rol: string): string {
  const parte = (objeto: object) => btoa(JSON.stringify(objeto)).replace(/=+$/, '')
  return `${parte({ alg: 'HS256' })}.${parte({ role: rol })}.firma`
}

// Valor de ejemplo con la forma de una clave pública; no pertenece a ningún proyecto.
const publica = ['sb', 'publishable', 'ejemplo'].join('_')

describe('leerConfigSupabase', () => {
  it('sin variables devuelve null (modo demostración)', () => {
    expect(leerConfigSupabase({})).toBeNull()
  })

  it('acepta una URL https con clave pública', () => {
    expect(
      leerConfigSupabase({
        VITE_SUPABASE_URL: 'https://abc.supabase.co/',
        VITE_SUPABASE_PUBLISHABLE_KEY: publica,
      }),
    ).toEqual({ url: 'https://abc.supabase.co', clave: publica })
  })

  it('acepta http solo en local', () => {
    const clave = jwtConRol('anon')
    expect(
      leerConfigSupabase({
        VITE_SUPABASE_URL: 'http://127.0.0.1:54321',
        VITE_SUPABASE_PUBLISHABLE_KEY: clave,
      }),
    ).toEqual({ url: 'http://127.0.0.1:54321', clave })
    expect(() =>
      leerConfigSupabase({
        VITE_SUPABASE_URL: 'http://abc.supabase.co',
        VITE_SUPABASE_PUBLISHABLE_KEY: clave,
      }),
    ).toThrow(/https/)
  })

  it('rechaza una configuración a medias', () => {
    expect(() => leerConfigSupabase({ VITE_SUPABASE_URL: 'https://abc.supabase.co' })).toThrow(
      /incompleta/,
    )
  })

  it('rechaza claves secretas', () => {
    const url = 'https://abc.supabase.co'
    expect(() =>
      leerConfigSupabase({ VITE_SUPABASE_URL: url, VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_secret_x' }),
    ).toThrow(/clave secreta/)
    expect(() =>
      leerConfigSupabase({
        VITE_SUPABASE_URL: url,
        VITE_SUPABASE_PUBLISHABLE_KEY: jwtConRol('service_role'),
      }),
    ).toThrow(/clave secreta/)
  })
})
