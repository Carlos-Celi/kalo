import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { definicionRutas } from '../../app/router'
import { repositorios } from '../../data'
import { restablecerPerfilMock } from '../../data/mock'

function abrir(ruta = '/') {
  const router = createMemoryRouter(definicionRutas, { initialEntries: [ruta] })
  render(<RouterProvider router={router} />)
  return router
}

const pulsar = (nombre: string | RegExp) =>
  userEvent.click(screen.getByRole('button', { name: nombre }))

/** Rellena los cuatro pasos con el perfil de ejemplo del diseño y llega a "Tu plan". */
async function recorrerHastaElPlan() {
  await screen.findByRole('heading', { name: '¿Cómo te llamas?' })
  await userEvent.type(screen.getByLabelText('Nombre'), 'Lucía')
  await userEvent.type(screen.getByLabelText('Edad'), '30')
  await pulsar('Masculino')
  await pulsar('Continuar')

  await screen.findByRole('heading', { name: '¿Cuánto mides y pesas?' })
  fireEvent.change(screen.getByLabelText('Estatura'), { target: { value: '172' } })
  fireEvent.change(screen.getByLabelText('Peso actual'), { target: { value: '78' } })
  expect(screen.getByText('Tu IMC estimado es 26,4. Lo usamos solo como referencia.')).toBeVisible()
  await pulsar('Continuar')

  await screen.findByRole('heading', { name: '¿Cuál es tu objetivo?' })
  await userEvent.click(screen.getByRole('radio', { name: /Bajar de peso/ }))
  expect(screen.getByLabelText('Peso meta')).toHaveValue('72')
  await pulsar('Continuar')

  await screen.findByRole('heading', { name: 'Cuéntanos tus hábitos' })
  await pulsar('Ligero 1–2 días')
  await pulsar('5–7 h')
  await pulsar('Fines de semana')
  await pulsar('Sin lactosa')
  await pulsar('Generar mi plan')

  await screen.findByRole('heading', { name: 'Tu plan' })
}

afterEach(() => restablecerPerfilMock())

describe('Onboarding', () => {
  it('sin plan, la app lleva al primer paso', async () => {
    restablecerPerfilMock({ nombre: '', plan: null })
    const router = abrir('/progreso')

    expect(await screen.findByRole('heading', { name: '¿Cómo te llamas?' })).toBeVisible()
    expect(router.state.location.pathname).toBe('/bienvenida')
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuetext', 'Paso 1 de 4')
  })

  it('no deja avanzar con el primer paso incompleto', async () => {
    restablecerPerfilMock({ nombre: '', plan: null })
    const router = abrir('/bienvenida')
    await screen.findByRole('heading', { name: '¿Cómo te llamas?' })

    await userEvent.type(screen.getByLabelText('Edad'), '12')
    await pulsar('Continuar')

    expect(screen.getByText('Escribe tu nombre.')).toBeVisible()
    expect(screen.getByText('Kalo es para mayores de 16 años.')).toBeVisible()
    expect(screen.getByText('Elige una opción.')).toBeVisible()
    expect(router.state.location.pathname).toBe('/bienvenida')
  })

  it('no se puede saltar a un paso posterior por la URL', async () => {
    restablecerPerfilMock({ nombre: '', plan: null })
    const router = abrir('/bienvenida/plan')

    expect(await screen.findByRole('heading', { name: '¿Cómo te llamas?' })).toBeVisible()
    expect(router.state.location.pathname).toBe('/bienvenida')
  })

  it('genera el plan con las respuestas, deja ajustarlo y lo guarda', async () => {
    restablecerPerfilMock({ nombre: '', plan: null })
    const router = abrir()
    await recorrerHastaElPlan()

    expect(screen.getByText('Bajar de 78 a 72 kg')).toBeVisible()
    expect(screen.getByText('0,5 kg por semana · ≈ 12 semanas')).toBeVisible()
    const principales = screen.getByRole('region', { name: /Metas principales/ })
    expect(within(principales).getByText('1.850')).toBeVisible()
    expect(within(principales).getByText('140')).toBeVisible()
    expect(
      within(principales).getByText('≈ 1,8 g por kg para conservar tu masa muscular'),
    ).toBeVisible()

    await pulsar('Aumentar Calorías')
    await pulsar('Disminuir Agua')
    expect(within(principales).getByText('1.900')).toBeVisible()
    expect(screen.getByText('2,25 L')).toBeVisible()

    await pulsar('Guardar y continuar')

    // Tras el plan se ofrece conectar la IA, y se puede dejar para después.
    expect(await screen.findByRole('heading', { name: 'Conecta tu IA' })).toBeVisible()
    expect(router.state.location.pathname).toBe('/bienvenida/ia')
    await pulsar('Configurarla más tarde')

    expect(await screen.findByRole('heading', { level: 1, name: 'Hola, Lucía' })).toBeVisible()
    expect(router.state.location.pathname).toBe('/')
    expect(screen.getByRole('link', { name: 'Calorías: 1.190 de 1.900' })).toBeVisible()

    const { plan } = await repositorios.perfil.obtener()
    expect(plan?.datos).toMatchObject({
      nombre: 'Lucía',
      edad: 30,
      sexo: 'masculino',
      estaturaCm: 172,
      pesoKg: 78,
      objetivo: 'bajar',
      pesoMetaKg: 72,
      actividad: 'ligero',
      restricciones: ['sin-lactosa'],
    })
    expect(plan?.metas).toEqual({
      kcal: 1900,
      proteinaG: 140,
      aguaL: 2.25,
      ejercicioMin: 60,
      suenoMin: 480,
    })
  })

  it('con plan, editar el perfil desde Configuración abre su propia pantalla con los datos actuales', async () => {
    const router = abrir('/ajustes')

    await userEvent.click(await screen.findByRole('link', { name: 'Editar perfil' }))

    expect(router.state.location.pathname).toBe('/ajustes/perfil')
    expect(await screen.findByLabelText('Nombre')).toHaveValue('Carlos')
    expect(screen.getByLabelText('Edad')).toHaveValue('30')
    expect(screen.getByRole('button', { name: /Masculino/ })).toHaveAttribute('aria-pressed', 'true')
  })
})
