import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'
import { definicionRutas } from '../../app/router'

function abrir(ruta: string) {
  render(<RouterProvider router={createMemoryRouter(definicionRutas, { initialEntries: [ruta] })} />)
}

describe('Documentos legales', () => {
  it('la política de privacidad explica datos de salud, terceros y derechos', async () => {
    abrir('/privacidad')
    expect(await screen.findByRole('heading', { level: 1, name: 'Política de privacidad' })).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Con quién se comparten' })).toBeVisible()
    expect(screen.getByText(/datos de salud/)).toBeVisible()
    expect(screen.getByRole('link', { name: 'Configuración' })).toHaveAttribute('href', '/ajustes')
  })

  it('los términos avisan de que no es consejo médico', async () => {
    abrir('/terminos')
    expect(await screen.findByRole('heading', { name: 'Kalo no es consejo médico' })).toBeVisible()
  })

  it('la política de cookies deja claro que no se usan cookies', async () => {
    abrir('/cookies')
    expect(await screen.findByText('Kalo no usa cookies')).toBeVisible()
  })

  it('se puede ir de un documento a otro', async () => {
    abrir('/privacidad')
    await userEvent.click(await screen.findByRole('link', { name: 'Términos de uso' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Términos de uso' })).toBeVisible()
  })
})
