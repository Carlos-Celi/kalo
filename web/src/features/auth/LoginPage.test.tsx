import { AuthApiError } from '@supabase/supabase-js'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Cliente de Supabase falso: sin sesión y con respuestas programables.
const auth = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  onAuthStateChange: vi.fn((aviso: (evento: string, sesion: null) => void) => {
    aviso('INITIAL_SESSION', null)
    return { data: { subscription: { unsubscribe: () => undefined } } }
  }),
}))

vi.mock('../../lib/supabase', () => ({ supabase: { auth } }))

const { definicionRutas } = await import('../../app/router')

function abrir(ruta = '/login') {
  const router = createMemoryRouter(definicionRutas, { initialEntries: [ruta] })
  render(<RouterProvider router={router} />)
  return router
}

const credencialesInvalidas = {
  data: { user: null, session: null },
  error: new AuthApiError('Invalid login credentials', 400, 'invalid_credentials'),
}

async function rellenar(correo: string, contrasena: string) {
  await userEvent.type(screen.getByLabelText('Correo electrónico'), correo)
  await userEvent.type(screen.getByLabelText('Contraseña'), contrasena)
}

beforeEach(() => {
  sessionStorage.clear()
  auth.signInWithPassword.mockReset()
  auth.signUp.mockReset()
  auth.resetPasswordForEmail.mockReset()
})

describe('Login', () => {
  it('sin sesión, las pantallas de la app llevan al login', async () => {
    const router = abrir('/progreso')

    expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
  })

  it('valida el formulario antes de llamar al servidor', async () => {
    abrir()
    await rellenar('no-es-un-correo', 'x')
    await userEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }))

    expect(screen.getByText('Escribe un correo electrónico válido.')).toBeVisible()
    expect(auth.signInWithPassword).not.toHaveBeenCalled()
  })

  it('envía el correo normalizado y responde con un error genérico', async () => {
    auth.signInWithPassword.mockResolvedValue(credencialesInvalidas)
    abrir()
    await rellenar(' Ana@Ejemplo.com', 'incorrecta')
    await userEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('El correo o la contraseña no coinciden.')
    expect(auth.signInWithPassword).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'ana@ejemplo.com', password: 'incorrecta' }),
    )
  })

  it('frena los reintentos tras cinco fallos seguidos', async () => {
    auth.signInWithPassword.mockResolvedValue(credencialesInvalidas)
    abrir()
    await rellenar('ana@ejemplo.com', 'incorrecta')
    const enviar = screen.getByRole('button', { name: 'Iniciar sesión' })
    for (let intento = 0; intento < 5; intento++) {
      await userEvent.click(enviar)
      await screen.findByRole('alert')
    }

    expect(await screen.findByText(/Podrás reintentar en \d+ s/)).toBeVisible()
    expect(enviar).toBeDisabled()
    expect(auth.signInWithPassword).toHaveBeenCalledTimes(5)
  })

  it('al crear cuenta responde igual exista o no el correo', async () => {
    auth.signUp.mockResolvedValue({ data: { user: null, session: null }, error: null })
    abrir()
    await userEvent.click(screen.getByRole('button', { name: 'Crear cuenta nueva' }))
    await rellenar('ana@ejemplo.com', 'una-clave-larga-2026')
    await userEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    // Sin aceptar términos, privacidad y datos de salud no se crea la cuenta.
    expect(await screen.findByText('Para crear la cuenta tienes que aceptarlo.')).toBeVisible()
    expect(auth.signUp).not.toHaveBeenCalled()

    await userEvent.click(screen.getByRole('checkbox', { name: /Acepto los términos de uso/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    expect(await screen.findByRole('status')).toHaveTextContent(/Si el correo es válido/)
    // Queda constancia de la versión aceptada en los metadatos de la cuenta.
    expect(auth.signUp).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({
          data: expect.objectContaining({ politicas_version: expect.any(String) }),
        }),
      }),
    )
  })

  it('exige letras y números en la contraseña de una cuenta nueva', async () => {
    abrir()
    await userEvent.click(screen.getByRole('button', { name: 'Crear cuenta nueva' }))
    await rellenar('ana@ejemplo.com', 'solo-letras-largas')
    await userEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    expect(await screen.findByText('Combina letras y números.')).toBeVisible()
    expect(auth.signUp).not.toHaveBeenCalled()
  })

  it('no muestra al usuario el mensaje interno del servidor', async () => {
    auth.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: new AuthApiError('relation "auth.users" does not exist', 500, 'unexpected_failure'),
    })
    abrir()
    await rellenar('ana@ejemplo.com', 'cualquiera')
    await userEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }))

    const alerta = await screen.findByRole('alert')
    expect(alerta).toHaveTextContent('No pudimos completar la operación.')
    expect(alerta).not.toHaveTextContent('auth.users')
  })
})
