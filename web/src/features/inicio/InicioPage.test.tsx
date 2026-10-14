import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { definicionRutas } from '../../app/router'
import { repositorios } from '../../data'
import { restablecerRegistrosMock } from '../../data/mock'
import { marcarUltimoRegistro } from '../../data/ultimoRegistro'
import { claveDia } from '../../domain/fechas'

afterEach(() => {
  restablecerRegistrosMock()
  marcarUltimoRegistro(null)
})

function abrir(ruta = '/') {
  const router = createMemoryRouter(definicionRutas, { initialEntries: [ruta] })
  render(<RouterProvider router={router} />)
}

describe('Inicio', () => {
  it('muestra el saludo y las dos metas principales con los datos del día', async () => {
    abrir()

    expect(await screen.findByRole('heading', { level: 1, name: 'Hola, Carlos' })).toBeVisible()

    const calorias = screen.getByRole('link', { name: /^Calorías: 1\.190 de 1\.850 kcal, 64 %/ })
    expect(within(calorias).getByText('64 %')).toBeVisible()
    expect(within(calorias).getByText('Te quedan 660')).toBeVisible()

    const proteina = screen.getByRole('link', { name: /^Proteína: 52 de 140 g, 37 %/ })
    expect(within(proteina).getByText('37 %')).toBeVisible()
    expect(within(proteina).getByText('Faltan 88 g')).toBeVisible()
  })

  it('resume los registros de hoy y no muestra la lista de comidas', async () => {
    abrir()

    const registros = await screen.findByRole('region', { name: 'Registros de hoy' })
    expect(within(registros).getByText('1,6 / 2,5 L')).toBeVisible()
    expect(within(registros).getByText('Faltan 25 min')).toBeVisible()
    expect(within(registros).getByText('Casi: falta 1 h 15')).toBeVisible()
    expect(within(registros).getByText('Faltan 2 por registrar')).toBeVisible()

    // Las comidas del día viven en Registros, no en Inicio.
    expect(screen.queryByText('Avena con plátano')).not.toBeInTheDocument()
  })

  it('dibuja la gráfica de 7 días con el estado de cada día como texto', async () => {
    abrir()

    const semana = await screen.findByRole('region', { name: 'Resumen de la semana' })
    expect(within(semana).getByText(/Hoy: 1\.190 kcal, parcial/)).toBeInTheDocument()
    expect(within(semana).getByText(/Meta 1\.850 kcal/)).toBeVisible()
  })

  it('el mosaico de agua solo enlaza a Registros: no hay atajo para añadir agua', async () => {
    abrir()
    const registros = await screen.findByRole('region', { name: 'Registros de hoy' })
    expect(within(registros).queryByRole('button', { name: '+250 ml' })).not.toBeInTheDocument()
    expect(within(registros).getByRole('link', { name: /Agua/ })).toHaveAttribute('href', '/registros/agua')
  })

  it('marca como «Nuevo» lo último que se registró hasta que se mira', async () => {
    await repositorios.registros.agregarAgua(claveDia(new Date()), 250)
    abrir()

    const registros = await screen.findByRole('region', { name: 'Registros de hoy' })
    expect(within(registros).getByText('Nuevo')).toBeVisible()

    await userEvent.hover(within(registros).getByText('Agua'))

    expect(within(registros).queryByText('Nuevo')).not.toBeInTheDocument()
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
