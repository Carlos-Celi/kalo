import { describe, expect, it } from 'vitest'
import {
  normalizarCorreo,
  validarContrasenaExistente,
  validarContrasenaNueva,
  validarCorreo,
} from './validacion'

describe('validación de acceso', () => {
  it('normaliza el correo', () => {
    expect(normalizarCorreo('  Ana@Ejemplo.COM ')).toBe('ana@ejemplo.com')
  })

  it('acepta correos con forma válida y rechaza el resto', () => {
    expect(validarCorreo('ana@ejemplo.com')).toBeNull()
    expect(validarCorreo('')).toMatch(/Escribe tu correo/)
    expect(validarCorreo('ana@ejemplo')).toMatch(/válido/)
    expect(validarCorreo('ana ejemplo@x.com')).toMatch(/válido/)
    expect(validarCorreo(`${'a'.repeat(250)}@x.com`)).toMatch(/válido/)
  })

  it('exige al menos 8 caracteres en contraseñas nuevas', () => {
    expect(validarContrasenaNueva('1234567')).toMatch(/al menos 8/)
    expect(validarContrasenaNueva('12345678')).toBeNull()
  })

  it('rechaza contraseñas de más de 72 bytes', () => {
    expect(validarContrasenaNueva('a'.repeat(73))).toMatch(/larga/)
    expect(validarContrasenaNueva('ñ'.repeat(37))).toMatch(/larga/)
    expect(validarContrasenaExistente('a'.repeat(73))).toMatch(/larga/)
  })

  it('al iniciar sesión solo pide que haya contraseña', () => {
    expect(validarContrasenaExistente('')).toMatch(/Escribe tu contraseña/)
    expect(validarContrasenaExistente('abc')).toBeNull()
  })
})
