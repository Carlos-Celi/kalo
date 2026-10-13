import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { definicionRutas } from '../../app/router'
import { repositorios } from '../../data'
import { restablecerPerfilMock, restablecerRegistrosMock } from '../../data/mock'
import { claveDia, sumarDias } from '../../domain/fechas'

const hoy = claveDia(new Date())

function abrir(ruta: string) {
  const router = createMemoryRouter(definicionRutas, { initialEntries: [ruta] })
  render(<RouterProvider router={router} />)
  return router
}

const pulsar = (nombre: string | RegExp) =>
  userEvent.click(screen.getByRole('button', { name: nombre }))

afterEach(() => {
  restablecerPerfilMock()
  restablecerRegistrosMock()
})

describe('Registros · Comida', () => {
  it('muestra la semana, las metas y las comidas del día con sus insignias', async () => {
    abrir('/registros')

    const semana = await screen.findByRole('region', { name: 'Progreso de la semana' })
    expect(within(semana).getByText('2 de 7 días cumplidos')).toBeVisible()
    // 1.960 kcal sobre 1.850 es más del 105 %: se marca como exceso.
    expect(within(semana).getByRole('button', { name: /106 %, te pasaste de la meta/ })).toBeVisible()
    expect(within(semana).getByRole('button', { name: 'Hoy: 64 %, parcial' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    const metas = screen.getByRole('region', { name: 'Metas principales' })
    expect(within(metas).getByText('1.190 / 1.850 kcal')).toBeVisible()
    expect(within(metas).getByText('Quedan 660')).toBeVisible()
    expect(within(metas).getByText('Faltan 88 g')).toBeVisible()

    const arroz = screen.getByRole('link', { name: /Arroz con pollo/ })
    expect(within(arroz).getByText('IA')).toBeVisible()
    expect(within(screen.getByRole('link', { name: /Cerveza artesanal/ })).getByText('Licor')).toBeVisible()
    expect(screen.getByText('Sin registrar')).toBeVisible()
  })

  it('al tocar un día muestra su detalle', async () => {
    const router = abrir('/registros')
    const semana = await screen.findByRole('region', { name: 'Progreso de la semana' })

    await userEvent.click(within(semana).getAllByRole('button')[5])

    expect(router.state.location.search).toBe(`?fecha=${sumarDias(hoy, -1)}`)
    expect(screen.getByRole('heading', { name: 'Comidas del día' })).toBeVisible()
    expect(screen.getByText('1.490 / 1.850 kcal')).toBeVisible()
  })

  it('añade una comida a mano y la suma al día', async () => {
    const router = abrir('/registros')
    await userEvent.click(await screen.findByRole('link', { name: 'Añadir a Snacks y licor' }))

    await screen.findByRole('heading', { name: 'Agregar manualmente' })
    await pulsar('Guardar en Snacks y licor')
    expect(screen.getByText('Escribe el nombre.')).toBeVisible()

    await userEvent.type(screen.getByLabelText('Nombre del alimento o bebida'), 'Yogur griego')
    await userEvent.type(screen.getByLabelText(/Calorías/), '120')
    await userEvent.type(screen.getByLabelText(/Proteína/), '10,5')
    await pulsar('Guardar en Snacks y licor')

    expect(await screen.findByRole('link', { name: /Yogur griego/ })).toBeVisible()
    expect(router.state.location.pathname).toBe('/registros')
    expect(screen.getByText('1.310 / 1.850 kcal')).toBeVisible()
    // 52 + 10,5 g se muestran redondeados.
    expect(screen.getByText('63 / 140 g')).toBeVisible()
  })

  it('edita y elimina una comida registrada', async () => {
    abrir('/registros')
    await userEvent.click(await screen.findByRole('link', { name: /Café con leche/ }))

    const calorias = await screen.findByLabelText(/Calorías/)
    expect(calorias).toHaveValue('100')
    await userEvent.clear(calorias)
    await userEvent.type(calorias, '60')
    await pulsar('Guardar en Desayuno')
    expect(await screen.findByText('1.150 / 1.850 kcal')).toBeVisible()

    await userEvent.click(screen.getByRole('link', { name: /Café con leche/ }))
    await userEvent.click(await screen.findByRole('button', { name: 'Eliminar' }))
    expect(await screen.findByText('1.090 / 1.850 kcal')).toBeVisible()
    expect(screen.queryByRole('link', { name: /Café con leche/ })).not.toBeInTheDocument()
  })
})

describe('Registros · hábitos', () => {
  it('suma agua con los atajos y deshace el último', async () => {
    abrir('/registros/agua')
    const resumen = await screen.findByRole('region', { name: 'Agua del día' })
    expect(within(resumen).getByText('1,6 L')).toBeVisible()
    expect(within(resumen).getByText('Te faltan 900 ml.')).toBeVisible()

    await pulsar('+500 ml')
    expect(await within(resumen).findByText('2,1 L')).toBeVisible()
    await pulsar('+500 ml')
    expect(await within(resumen).findByText('¡Meta cumplida por hoy!')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Hoy: 104 %, cumplido' })).toBeVisible()

    await pulsar('Deshacer último')
    expect(await within(resumen).findByText('2,1 L')).toBeVisible()
    expect(within(screen.getByRole('list', { name: 'Agua registrada' })).getAllByRole('listitem')).toHaveLength(5)
  })

  it('suma minutos de ejercicio y estima las calorías', async () => {
    abrir('/registros/ejercicio')
    const resumen = await screen.findByRole('region', { name: 'Ejercicio del día' })
    expect(within(resumen).getByText('130 kcal quemadas')).toBeVisible()
    expect(within(resumen).getByText('300 min esta semana · meta cumplida 3 de 7 días')).toBeVisible()

    await pulsar('+30 min')

    expect(await within(resumen).findByText('65')).toBeVisible()
    expect(within(resumen).getByText('241 kcal quemadas')).toBeVisible()
    expect(screen.getByText('¡Meta de ejercicio cumplida hoy!')).toBeVisible()
  })

  it('registra ejercicio por horas y minutos con las calorías de un reloj', async () => {
    abrir('/registros/ejercicio')
    const resumen = await screen.findByRole('region', { name: 'Ejercicio del día' })

    await userEvent.type(screen.getByRole('textbox', { name: /Actividad/ }), 'Bicicleta')
    await userEvent.type(screen.getByLabelText('Horas'), '1')
    await userEvent.type(screen.getByLabelText('Minutos'), '15')
    await userEvent.type(screen.getByLabelText('Calorías quemadas'), '520')
    await pulsar('Añadir ejercicio')

    expect(await screen.findByText('Bicicleta: 1 h 15 min guardados.')).toBeVisible()
    expect(within(resumen).getByText('110')).toBeVisible()
    expect(within(resumen).getByText('650 kcal quemadas')).toBeVisible()
    const fila = screen.getByText('Bicicleta', { selector: 'span' }).closest('li')!
    expect(within(fila).getByText('Tu medición')).toBeVisible()
    const { ejercicios } = await repositorios.registros.obtenerRango(hoy, hoy)
    expect(ejercicios.at(-1)).toMatchObject({ minutos: 75, kcal: 520, origenKcal: 'manual' })
  })

  it('estima las calorías cuando no se escriben y pide la duración', async () => {
    abrir('/registros/ejercicio')
    await screen.findByRole('region', { name: 'Ejercicio del día' })

    await pulsar('Añadir ejercicio')
    expect(screen.getByRole('alert')).toHaveTextContent('Escribe cuánto duró')

    await userEvent.type(screen.getByLabelText('Minutos'), '40')
    await pulsar('Añadir ejercicio')
    expect(await screen.findByText('Ejercicio: 40 min guardados.')).toBeVisible()
    const { ejercicios } = await repositorios.registros.obtenerRango(hoy, hoy)
    expect(ejercicios.at(-1)).toMatchObject({ minutos: 40, kcal: 148, origenKcal: 'estimado' })
  })

  it('guarda la noche por horario, también cruzando la medianoche', async () => {
    abrir('/registros/sueno')
    const resumen = await screen.findByRole('region', { name: 'Horas dormidas' })
    expect(within(resumen).getByText('6 h 45 min')).toBeVisible()
    expect(screen.getByText('−1 h 15')).toBeVisible()

    // Por defecto: 23:00 → 07:00.
    expect(screen.getByText('Dormiste 8 h 00 min')).toBeVisible()
    fireEvent.change(screen.getByLabelText('Me dormí a las'), { target: { value: '23:30' } })
    expect(screen.getByText('Dormiste 7 h 30 min')).toBeVisible()
    await pulsar('Actualizar la noche')

    expect(await screen.findByText('Noche guardada.')).toBeVisible()
    expect(within(resumen).getByText('7 h 30 min')).toBeVisible()
    const { suenos } = await repositorios.registros.obtenerRango(hoy, hoy)
    expect(suenos).toEqual([{ fecha: hoy, minutos: 450 }])
  })

  it('permite registrar la noche de antenoche por duración', async () => {
    const router = abrir('/registros/sueno')
    await screen.findByRole('region', { name: 'Horas dormidas' })

    await pulsar('Antenoche')
    expect(router.state.location.search).toBe(`?fecha=${sumarDias(hoy, -1)}`)
    await pulsar('Por duración')
    // Parte de lo ya guardado para esa noche (8 h 18 min en los datos de ejemplo).
    expect(screen.getByLabelText('Horas')).toHaveValue('8')
    await userEvent.clear(screen.getByLabelText('Horas'))
    await userEvent.type(screen.getByLabelText('Horas'), '6')
    await userEvent.clear(screen.getByLabelText('Minutos'))
    await userEvent.type(screen.getByLabelText('Minutos'), '30')
    await pulsar('Actualizar la noche')

    expect(await screen.findByText('Noche guardada.')).toBeVisible()
    const { suenos } = await repositorios.registros.obtenerRango(sumarDias(hoy, -1), sumarDias(hoy, -1))
    expect(suenos).toEqual([{ fecha: sumarDias(hoy, -1), minutos: 390 }])
  })

  it('suma las siestas al total del día y permite quitarlas', async () => {
    abrir('/registros/sueno')
    const resumen = await screen.findByRole('region', { name: 'Horas dormidas' })

    await pulsar('+30 min')
    expect(await within(resumen).findByText('7 h 15 min')).toBeVisible()
    expect(within(resumen).getByText(/siestas 30 min/)).toBeVisible()

    await userEvent.type(screen.getByLabelText('Otra duración'), '20')
    await pulsar('Añadir')
    expect(await within(resumen).findByText('7 h 35 min')).toBeVisible()
    expect(within(screen.getByRole('list', { name: 'Siestas registradas' })).getAllByRole('listitem')).toHaveLength(2)

    await pulsar('Eliminar la siesta de 20 min')
    expect(await within(resumen).findByText('7 h 15 min')).toBeVisible()
  })
})

describe('Comida: alcohol y foto', () => {
  it('la marca de alcohol solo aparece en snacks y licores', async () => {
    abrir('/registros/comida/manual?tipo=desayuno')
    await screen.findByRole('heading', { name: 'Agregar manualmente' })
    const marca = () => screen.queryByRole('switch', { name: 'Es una bebida con alcohol' })
    expect(marca()).not.toBeInTheDocument()

    await pulsar('Snack')
    expect(marca()).toBeVisible()
    await userEvent.click(marca()!)
    expect(marca()).toBeChecked()

    // Al pasar a una comida principal la marca desaparece y se descarta.
    await pulsar('Cena')
    expect(marca()).not.toBeInTheDocument()
    await pulsar('Licor')
    expect(marca()).toBeChecked()
  })

  it('guarda la foto ultracomprimida con la comida, la muestra en la lista y se puede quitar', async () => {
    const foto = 'data:image/webp;base64,UklGRg=='
    const comida = await repositorios.registros.agregarComida(
      {
        fecha: hoy,
        tipo: 'cena',
        nombre: 'Pan con huevo',
        porcion: '2 panes',
        kcal: 300,
        proteinaG: 14,
        carbohidratosG: 36,
        azucarG: 3,
        grasaG: 10,
        esAlcohol: false,
        gradosAlcohol: null,
        origen: 'ia',
      },
      foto,
    )
    expect(comida.tieneFoto).toBe(true)
    expect(await repositorios.registros.obtenerFoto(comida.id)).toBe(foto)

    abrir('/registros')
    const fila = await screen.findByRole('link', { name: /Pan con huevo/ })
    expect(within(fila).getByText('Con foto')).toBeInTheDocument()

    await repositorios.registros.quitarFoto(comida.id)
    expect(await repositorios.registros.obtenerFoto(comida.id)).toBeNull()
    expect((await repositorios.registros.obtenerComida(comida.id))?.tieneFoto).toBe(false)
  })
})

describe('Registro rápido y peso', () => {
  it('la hoja resume el día y lleva a cada registro', async () => {
    abrir('/registro-rapido')

    const hoja = await screen.findByRole('dialog', { name: 'Registro rápido' })
    expect(await within(hoja).findByText('1,6 / 2,5 L hoy')).toBeVisible()
    expect(within(hoja).getByText('35 / 60 min')).toBeVisible()
    expect(within(hoja).getByText('6 h 45 anoche')).toBeVisible()
    expect(await within(hoja).findByText('78,0 kg · para tus métricas')).toBeVisible()
    expect(within(hoja).getByRole('link', { name: /Peso/ })).toHaveAttribute('href', '/peso')
  })

  it('registra el peso del día con su nota', async () => {
    abrir('/peso')
    await screen.findByRole('heading', { name: 'Registrar peso' })
    expect(await screen.findByText('Igual que tu último registro')).toBeVisible()
    expect(screen.getByText('26,4')).toBeVisible()

    await pulsar('Restar 0,1 kg')
    await pulsar('Restar 0,1 kg')
    expect(screen.getByText('Bajas 0,2 kg vs. último registro')).toBeVisible()
    expect(screen.getByText('5,8 kg')).toBeVisible()

    await userEvent.type(screen.getByLabelText('Nota (opcional)'), 'En ayunas')
    await pulsar('Guardar peso')

    expect(await screen.findByText('¡Peso guardado! Tu gráfica ya está al día.')).toBeVisible()
    expect(screen.getByRole('link', { name: 'Ver mi progreso' })).toBeVisible()
    const pesos = await repositorios.registros.obtenerPesos(hoy)
    expect(pesos).toEqual([{ fecha: hoy, kg: 77.8, nota: 'En ayunas' }])
  })

  it('permite escribir el peso en vez de ajustarlo de 0,1 en 0,1', async () => {
    abrir('/peso')
    await screen.findByRole('heading', { name: 'Registrar peso' })
    const campo = screen.getByLabelText('Peso en kilogramos')

    await userEvent.clear(campo)
    await userEvent.type(campo, '76,4')
    await userEvent.tab()

    expect(campo).toHaveValue('76,4')
    expect(await screen.findByText('Bajas 1,6 kg vs. último registro')).toBeVisible()
  })

  it('la hoja de registro rápido se ancla a la ventana y mantiene el foco dentro', async () => {
    abrir('/registro-rapido')
    const hoja = await screen.findByRole('dialog', { name: 'Registro rápido' })

    // Por encima del tab bar (z-20); si no, tapa la parte baja de la hoja.
    expect(hoja.parentElement).toHaveClass('fixed', 'inset-0', 'z-40')

    const enlaces = within(hoja).getAllByRole('link')
    enlaces[enlaces.length - 1].focus()
    await userEvent.tab()
    expect(hoja).toContainElement(document.activeElement as HTMLElement)
  })
})

describe('Registros · semana', () => {
  it('pliega la leyenda y la nota de la meta tras "¿Cómo se cuenta?"', async () => {
    abrir('/registros')
    const semana = await screen.findByRole('region', { name: 'Progreso de la semana' })
    const boton = within(semana).getByRole('button', { name: '¿Cómo se cuenta?' })

    expect(boton).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(boton)

    expect(
      within(semana).getByRole('button', { name: 'Ocultar cómo se cuenta' }),
    ).toHaveAttribute('aria-expanded', 'true')
  })
})
