import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'
import { definicionRutas } from '../../app/router'

function abrir(ruta = '/') {
  const router = createMemoryRouter(definicionRutas, { initialEntries: [ruta] })
  render(<RouterProvider router={router} />)
}

describe('Inicio', () => {
  it('muestra el saludo y las dos metas principales con los datos del día', async () => {
    abrir()

    expect(await screen.findByRole('heading', { level: 1, name: 'Hola, Carlos' })).toBeVisible()

    const calorias = screen.getByRole('link', { name: 'Calorías: 1.190 de 1.850' })
    expect(within(calorias).getByText('64%')).toBeVisible()
    expect(within(calorias).getByText('Te quedan 660')).toBeVisible()

    const proteina = screen.getByRole('link', { name: 'Proteína: 52 de 140 gramos' })
    expect(within(proteina).getByText('37%')).toBeVisible()
    expect(within(proteina).getByText('Faltan 88 g')).toBeVisible()
  })

  it('resume los cuatro hábitos', async () => {
    abrir()

    const habitos = await screen.findByRole('region', { name: 'Hábitos de hoy' })
    expect(within(habitos).getByText('1,6 / 2,5 L')).toBeVisible()
    expect(within(habitos).getByText('Faltan 25 min')).toBeVisible()
    expect(within(habitos).getByText('Casi: falta 1 h 15')).toBeVisible()
    expect(within(habitos).getByText('Faltan 2 por registrar')).toBeVisible()
  })

  it('navega a otra sección desde la navegación principal', async () => {
    abrir()
    await screen.findByRole('heading', { level: 1, name: 'Hola, Carlos' })

    const [navegacion] = screen.getAllByRole('navigation', { name: 'Navegación principal' })
    await userEvent.click(within(navegacion).getByRole('link', { name: 'Progreso' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Progreso' })).toBeVisible()
  })

  it('responde con una pantalla propia a rutas que no existen', async () => {
    abrir('/no-existe')

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Página no encontrada' }),
    ).toBeVisible()
  })
})
