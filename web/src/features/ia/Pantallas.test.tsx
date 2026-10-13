import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { definicionRutas } from '../../app/router'
import { repositorios } from '../../data'
import { restablecerPerfilMock, restablecerRegistrosMock } from '../../data/mock'
import { claveDia } from '../../domain/fechas'
import { ErrorIA, type AnalisisComida } from '../../domain/ia'
import { borrarSecreto, guardarSecreto, leerSecreto } from './boveda'
import { dejarFoto } from './foto'
import type { ClienteIA } from './proveedores/tipos'

// Proveedor de IA falso: las pruebas no llaman a ningún servicio externo.
const ia = vi.hoisted(() => ({
  listarModelos: vi.fn(),
  analizarFoto: vi.fn(),
  conversar: vi.fn(),
}))

vi.mock('./proveedores/anthropic', () => ({
  crearClienteAnthropic: (): ClienteIA => ia,
}))

const hoy = claveDia(new Date())
const CLAVE_IA = 'kalo:ia:demo'

const analisis: AnalisisComida = {
  nombre: 'Arroz con pollo y ensalada',
  porcion: '1 plato',
  cantidad: 1,
  unidad: 'plato',
  kcal: 620,
  kcal_minimo: 560,
  kcal_maximo: 680,
  proteina_g: 38,
  carbohidratos_g: 72,
  azucar_g: 6,
  grasa_g: 24,
  confianza: 86,
  ingredientes: ['Arroz', 'Pollo', 'Lechuga'],
  es_alcohol: false,
  grados_alcohol: null,
}

async function conectarIA() {
  await guardarSecreto('demo', 'clave-de-prueba')
  localStorage.setItem(
    CLAVE_IA,
    JSON.stringify({
      proveedor: 'anthropic',
      modelo: 'claude-opus-5-5',
      nombreModelo: 'Claude Opus 5.5',
      verificada: true,
    }),
  )
}

function abrir(ruta: string) {
  const router = createMemoryRouter(definicionRutas, { initialEntries: [ruta] })
  render(<RouterProvider router={router} />)
  return router
}

const pulsar = (nombre: string | RegExp) =>
  userEvent.click(screen.getByRole('button', { name: nombre }))

beforeEach(() => {
  localStorage.clear()
  ia.listarModelos.mockReset()
  ia.analizarFoto.mockReset()
  ia.conversar.mockReset()
})

afterEach(async () => {
  await borrarSecreto('demo')
  restablecerPerfilMock()
  restablecerRegistrosMock()
  dejarFoto(null)
})

describe('Progreso', () => {
  it('resume la semana y cambia de periodo', async () => {
    abrir('/progreso')

    const calorias = await screen.findByRole('region', { name: 'Calorías por día' })
    expect(within(calorias).getByText('Promedio 1.611 kcal')).toBeVisible()
    expect(within(calorias).getByText('Hoy: 1.190 kcal')).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: 'Proteína por día' })).getByText(
      'Llegaste a tu meta 1 de los últimos 6 días con registro.',
    )).toBeVisible()

    const peso = screen.getByRole('region', { name: 'Peso' })
    expect(within(peso).getByText('78,0 kg')).toBeVisible()
    expect(within(peso).getByText('−2,2 kg en 6 semanas')).toBeVisible()
    expect(within(peso).getByRole('link', { name: 'Registrar peso' })).toHaveAttribute('href', '/peso')

    const habitos = screen.getByRole('region', { name: 'Promedios de hábitos' })
    expect(within(habitos).getByText('300 min')).toBeVisible()
    expect(within(habitos).getByText('1 bebida')).toBeVisible()
    expect(within(habitos).getByText('≈ 150 kcal esta semana')).toBeVisible()

    await pulsar('Mes')
    expect(await screen.findByRole('region', { name: 'Calorías, promedio diario' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Mes' })).toHaveAttribute('aria-pressed', 'true')
  })
})

describe('Recordatorios y Configuración', () => {
  it('activa, desactiva y crea recordatorios, y los recuerda', async () => {
    abrir('/recordatorios')
    expect(await screen.findByRole('heading', { name: '4 de 5 activos' })).toBeVisible()
    expect(screen.getByText('Cada 2 horas · 8:00 a 20:00')).toBeVisible()

    await userEvent.click(screen.getByRole('switch', { name: 'Ejercicio' }))
    expect(screen.getByRole('heading', { name: '5 de 5 activos' })).toBeVisible()

    await pulsar('Nuevo recordatorio')
    await userEvent.type(screen.getByLabelText('Nombre'), 'Tomar vitaminas')
    await pulsar('Guardar recordatorio')

    const lista = screen.getByRole('list', { name: 'Recordatorios' })
    expect(within(lista).getByText('Tomar vitaminas')).toBeVisible()
    expect(within(lista).getByText('Todos los días · 9:00')).toBeVisible()
    expect(screen.getByRole('heading', { name: '6 de 6 activos' })).toBeVisible()

    await pulsar('Eliminar Tomar vitaminas')
    expect(within(lista).queryByText('Tomar vitaminas')).not.toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('kalo:recordatorios:demo') ?? '[]')).toHaveLength(5)
  })

  it('Configuración muestra el perfil, las metas, la IA y los recordatorios', async () => {
    abrir('/ajustes')

    expect(await screen.findByText('30 años · 172 cm · 78 kg')).toBeVisible()
    const metas = screen.getByRole('list', { name: 'Metas diarias' })
    expect(within(metas).getByRole('link', { name: /Calorías · principal.*1\.850 kcal/ })).toHaveAttribute(
      'href',
      '/ajustes/metas',
    )
    expect(screen.getByRole('link', { name: /Estatura y peso/ })).toHaveAttribute('href', '/ajustes/medidas')
    expect(screen.getByRole('link', { name: /Objetivo y hábitos/ })).toHaveAttribute('href', '/ajustes/objetivo')
    expect(within(metas).getByRole('link', { name: /Agua.*2,5 L/ })).toBeVisible()
    expect(screen.getByRole('link', { name: /Proveedor, API key y modelo.*Sin configurar/ })).toHaveAttribute(
      'href',
      '/ajustes/ia',
    )
    expect(screen.getByRole('switch', { name: 'Beber agua' })).toBeChecked()
    expect(screen.getByRole('switch', { name: 'Ejercicio' })).not.toBeChecked()
  })

  it('editar las metas desde Configuración abre su pantalla y parte de las guardadas', async () => {
    const router = abrir('/ajustes/metas')

    expect(await screen.findByRole('heading', { name: 'Metas diarias' })).toBeVisible()
    expect(screen.getByLabelText('Proteína')).toHaveValue('140')
    await pulsar('Aumentar proteína')
    await userEvent.clear(screen.getByLabelText('Calorías'))
    await userEvent.type(screen.getByLabelText('Calorías'), '1900')
    await pulsar('Guardar cambios')

    expect(await screen.findByText('Metas actualizadas.')).toBeVisible()
    expect(router.state.location.pathname).toBe('/ajustes/metas')
    const { plan } = await repositorios.perfil.obtener()
    expect(plan?.metas).toMatchObject({ proteinaG: 145, kcal: 1900 })
  })

  it('las medidas se editan en su pantalla y el peso queda también en el historial', async () => {
    abrir('/ajustes/medidas')

    expect(await screen.findByRole('heading', { name: 'Medidas y peso' })).toBeVisible()
    expect(screen.getByLabelText('Estatura')).toHaveValue('172')
    await userEvent.clear(screen.getByLabelText('Peso actual'))
    await userEvent.type(screen.getByLabelText('Peso actual'), '77,5')
    await userEvent.clear(screen.getByLabelText('Estatura'))
    await userEvent.type(screen.getByLabelText('Estatura'), '174')
    await pulsar('Guardar cambios')

    expect(await screen.findByText('Medidas actualizadas.')).toBeVisible()
    const { plan } = await repositorios.perfil.obtener()
    expect(plan?.datos).toMatchObject({ estaturaCm: 174, pesoKg: 77.5 })
    expect(await repositorios.registros.obtenerPesos(hoy)).toEqual([{ fecha: hoy, kg: 77.5, nota: '' }])
  })

  it('el objetivo y los hábitos se editan sin pasar por el onboarding', async () => {
    abrir('/ajustes/objetivo')

    expect(await screen.findByRole('heading', { name: 'Objetivo y hábitos' })).toBeVisible()
    await userEvent.click(screen.getByRole('radio', { name: /Ganar masa muscular/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Moderado 3–4 días' }))
    await userEvent.click(screen.getByRole('button', { name: 'Sin gluten' }))
    await pulsar('Guardar cambios')

    expect(await screen.findByText('Objetivo y hábitos actualizados.')).toBeVisible()
    const { plan } = await repositorios.perfil.obtener()
    expect(plan?.datos).toMatchObject({
      objetivo: 'musculo',
      actividad: 'moderado',
      restricciones: ['sin-lactosa', 'sin-gluten'],
    })
  })
})

describe('Proveedor de IA', () => {
  it('prueba la clave, carga los modelos y guarda la configuración en el dispositivo', async () => {
    ia.listarModelos.mockResolvedValue([
      { id: 'claude-haiku-5-5', nombre: 'Claude Haiku 5.5' },
      { id: 'claude-opus-5-5', nombre: 'Claude Opus 5.5' },
    ])
    const router = abrir('/ajustes/ia')

    expect(await screen.findByText('Falta verificar la conexión')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeDisabled()
    const clave = screen.getByLabelText('2. Pega tu API key')
    expect(clave).toHaveAttribute('type', 'text')
    expect(clave).toHaveClass('texto-oculto')
    await userEvent.type(clave, 'clave-de-prueba')
    await pulsar('Probar conexión')

    expect(await screen.findByText('IA conectada')).toBeVisible()
    expect(screen.getByRole('radio', { name: /Claude Opus 5\.5/ })).toBeChecked()
    await userEvent.click(screen.getByRole('radio', { name: /Claude Haiku 5\.5/ }))
    await pulsar('Guardar')

    expect(await screen.findByRole('heading', { name: 'Configuración' })).toBeVisible()
    expect(router.state.location.pathname).toBe('/ajustes')
    // La clave no se escribe en claro: en localStorage solo quedan el proveedor y el modelo.
    expect(JSON.parse(localStorage.getItem(CLAVE_IA) ?? '{}')).toEqual({
      proveedor: 'anthropic',
      modelo: 'claude-haiku-5-5',
      nombreModelo: 'Claude Haiku 5.5',
      verificada: true,
    })
    expect(await leerSecreto('demo')).toBe('clave-de-prueba')
    expect(await screen.findByText('Conectado')).toBeVisible()
  })

  it('explica el fallo sin mostrar el mensaje del proveedor', async () => {
    ia.listarModelos.mockRejectedValue(new ErrorIA('clave'))
    abrir('/ajustes/ia')

    await userEvent.type(await screen.findByLabelText('2. Pega tu API key'), 'mala')
    await pulsar('Probar conexión')

    expect(await screen.findByRole('alert')).toHaveTextContent('Tu proveedor rechazó la API key.')
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeDisabled()
  })
})

describe('Foto con IA', () => {
  it('sin IA configurada, la cámara ofrece configurarla o registrar a mano', async () => {
    abrir('/registros/comida/foto?tipo=cena')

    expect(await screen.findByRole('link', { name: 'Configurar la IA' })).toHaveAttribute('href', '/ajustes/ia')
    expect(screen.getByRole('button', { name: 'Tomar foto y analizar' })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Cena/ })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('link', { name: 'Manual' })).toHaveAttribute(
      'href',
      `/registros/comida/manual?tipo=cena&fecha=${hoy}`,
    )
    // Sin clave, registrar a mano es la salida principal del visor.
    expect(screen.getByRole('link', { name: 'Registrar a mano' })).toHaveAttribute(
      'href',
      `/registros/comida/manual?tipo=cena&fecha=${hoy}`,
    )
  })

  it('muestra la estimación, deja corregirla y la guarda marcada como IA', async () => {
    await conectarIA()
    ia.analizarFoto.mockResolvedValue(analisis)
    dejarFoto({
      foto: { base64: 'AAAA', tipoMime: 'image/jpeg' },
      lienzo: document.createElement('canvas'),
      tipo: 'cena',
      fecha: hoy,
    })
    const router = abrir('/registros/comida/analisis')

    expect(await screen.findByRole('heading', { name: 'Arroz con pollo y ensalada' })).toBeVisible()
    expect(ia.analizarFoto).toHaveBeenCalledWith(
      'claude-opus-5-5',
      { base64: 'AAAA', tipoMime: 'image/jpeg' },
      'Tipo de comida: Cena. Analiza la foto.',
    )
    expect(screen.getByText('Confianza de la IA: 86 %')).toBeVisible()
    expect(screen.getByText('560 – 680 kcal')).toBeVisible()
    expect(screen.getByText('27 % de tu meta diaria de 140 g')).toBeVisible()
    expect(screen.getByText('Lechuga')).toBeVisible()

    await pulsar('Editar')
    const calorias = screen.getByLabelText(/Calorías/)
    await userEvent.clear(calorias)
    await userEvent.type(calorias, '580')
    await pulsar('Guardar en Cena')

    expect(await screen.findByRole('link', { name: /Arroz con pollo y ensalada/ })).toBeVisible()
    expect(router.state.location.pathname).toBe('/registros')
    const { comidas } = await repositorios.registros.obtenerRango(hoy, hoy)
    expect(comidas.at(-1)).toMatchObject({ tipo: 'cena', kcal: 580, proteinaG: 38, origen: 'ia' })
  })

  it('detecta varias unidades y deja corregir la cantidad', async () => {
    await conectarIA()
    ia.analizarFoto.mockResolvedValue({
      ...analisis,
      nombre: 'Pan con huevo',
      porcion: '2 panes',
      cantidad: 2,
      unidad: 'pan con huevo',
      kcal: 300,
      kcal_minimo: 260,
      kcal_maximo: 340,
      proteina_g: 14,
      carbohidratos_g: 36,
      azucar_g: 3,
      grasa_g: 10,
    })
    dejarFoto({
      foto: { base64: 'AAAA', tipoMime: 'image/jpeg' },
      lienzo: document.createElement('canvas'),
      tipo: 'desayuno',
      fecha: hoy,
    })
    // jsdom no dibuja: se anota qué lienzos recibieron la foto.
    const pintados = new WeakSet<HTMLCanvasElement>()
    const contexto = vi
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockImplementation(function (this: HTMLCanvasElement) {
        return { drawImage: () => pintados.add(this) } as unknown as CanvasRenderingContext2D
      })
    abrir('/registros/comida/analisis')

    expect(await screen.findByRole('heading', { name: 'Pan con huevo' })).toBeVisible()
    // El lienzo se vuelve a montar al pasar de «analizando» al resultado y debe repintarse.
    expect(pintados.has(screen.getByRole('img', { name: 'Foto del plato analizado' }))).toBe(true)
    contexto.mockRestore()
    expect(screen.getByText(/pan con huevo · ≈ 150 kcal c\/u/)).toBeVisible()
    expect(screen.getByLabelText('Cantidad')).toHaveValue('2')
    expect(screen.getByText('260 – 340 kcal')).toBeVisible()

    // Era un solo pan: la cantidad se corrige y los totales se ajustan.
    await pulsar('Disminuir cantidad')
    expect(screen.getByText('195 – 255 kcal')).toBeVisible()
    await pulsar('Disminuir cantidad')
    expect(screen.getByText('130 – 170 kcal')).toBeVisible()
    expect(screen.getByLabelText('Cantidad')).toHaveValue('1')

    // También se puede escribir, con medias porciones.
    await userEvent.clear(screen.getByLabelText('Cantidad'))
    await userEvent.type(screen.getByLabelText('Cantidad'), '1,5')
    expect(screen.getByText('195 – 255 kcal')).toBeVisible()
    await userEvent.clear(screen.getByLabelText('Cantidad'))
    await userEvent.type(screen.getByLabelText('Cantidad'), '1')
    expect(screen.getByText('130 – 170 kcal')).toBeVisible()

    await pulsar('Guardar en Desayuno')
    await screen.findByRole('heading', { name: 'Registros' })
    const { comidas } = await repositorios.registros.obtenerRango(hoy, hoy)
    expect(comidas.at(-1)).toMatchObject({ nombre: 'Pan con huevo', kcal: 150, proteinaG: 7, porcion: '1 × pan con huevo', origen: 'ia' })
  })

  it('si la IA falla, permite reintentar o registrar a mano', async () => {
    await conectarIA()
    ia.analizarFoto.mockRejectedValue(new ErrorIA('limite'))
    dejarFoto({
      foto: { base64: 'AAAA', tipoMime: 'image/jpeg' },
      lienzo: document.createElement('canvas'),
      tipo: 'almuerzo',
      fecha: hoy,
    })
    abrir('/registros/comida/analisis')

    expect(await screen.findByRole('alert')).toHaveTextContent('limitó las peticiones')
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'Ingresar a mano' })).toBeVisible()
  })
})

describe('Asistente', () => {
  it('sin IA configurada invita a conectarla', async () => {
    abrir('/asistente')

    expect(await screen.findByText(/Hola Carlos, soy tu asistente nutricional\. Vas en 1\.190 kcal/)).toBeVisible()
    expect(screen.getByText(/No reemplaza a un profesional de la salud/)).toBeVisible()
    expect(screen.getByRole('link', { name: 'Configurar la IA' })).toBeVisible()
    expect(screen.getByLabelText('Escribe tu consulta')).toBeDisabled()
  })

  it('envía la consulta con el contexto del día y ofrece registrar lo sugerido', async () => {
    await conectarIA()
    ia.conversar.mockImplementation(async (_modelo, _sistema, _mensajes, alRecibir: (t: string) => void) => {
      const respuesta =
        'Estas opciones te acercan a tu proteína:\n```kalo-comidas\n[{"nombre":"Salmón con quinua","kcal":520,"proteina_g":38,"carbohidratos_g":40,"azucar_g":3,"grasa_g":22}]\n```'
      alRecibir(respuesta)
      return respuesta
    })
    const router = abrir('/asistente')

    expect(await screen.findByText('Nutriólogo IA · Claude Opus 5.5')).toBeVisible()
    await userEvent.type(screen.getByLabelText('Escribe tu consulta'), '¿Qué ceno?')
    await pulsar('Enviar')

    expect(await screen.findByText('Estas opciones te acercan a tu proteína:')).toBeVisible()
    expect(screen.getByText('520 kcal · 38 g de proteína')).toBeVisible()
    expect(screen.queryByText(/kalo-comidas/)).not.toBeInTheDocument()

    const [modelo, sistema, mensajes] = ia.conversar.mock.calls[0] as [string, string, { rol: string; texto: string }[]]
    expect(modelo).toBe('claude-opus-5-5')
    expect(sistema).toContain('nutriólogo')
    // Las instrucciones llevan todo lo que hay en la app: perfil, hoy al detalle, historial y peso.
    expect(sistema).toContain('Calorías: 1.190 de 1.850 kcal')
    expect(sistema).toContain('Arroz con pollo')
    expect(sistema).toContain('ÚLTIMOS 14 DÍAS')
    expect(sistema).toContain('PESO:')
    expect(sistema).toContain('RECORDATORIOS ACTIVOS')
    // El mensaje del usuario va tal cual: los datos no se repiten en cada turno.
    expect(mensajes).toEqual([{ rol: 'usuario', texto: '¿Qué ceno?' }])

    await userEvent.click(screen.getByRole('link', { name: 'Registrar Salmón con quinua' }))
    expect(router.state.location.pathname).toBe('/registros/comida/manual')
    expect(await screen.findByLabelText('Nombre del alimento o bebida')).toHaveValue('Salmón con quinua')
    expect(screen.getByLabelText(/Calorías/)).toHaveValue('520')
    expect(screen.getByRole('button', { name: 'Guardar en Cena' })).toBeVisible()
  })

  it('da formato a la respuesta: listas y negritas', async () => {
    await conectarIA()
    ia.conversar.mockImplementation(async (_modelo, _sistema, _mensajes, alRecibir: (t: string) => void) => {
      const respuesta = '## Menú de mañana\n\n- **Desayuno:** avena con fruta\n- **Cena:** salmón'
      alRecibir(respuesta)
      return respuesta
    })
    abrir('/asistente')

    await userEvent.type(await screen.findByLabelText('Escribe tu consulta'), 'Menú')
    await pulsar('Enviar')

    expect(await screen.findByText('Menú de mañana')).toBeVisible()
    const lista = screen.getByText('Desayuno:').closest('ul')!
    expect(within(lista).getAllByRole('listitem')).toHaveLength(2)
    expect(screen.getByText('Desayuno:').tagName).toBe('STRONG')
  })

  it('guarda los chats, abre uno nuevo y conserva solo los tres últimos', async () => {
    await conectarIA()
    ia.conversar.mockImplementation(async (_modelo, _sistema, _mensajes, alRecibir: (t: string) => void) => {
      alRecibir('Listo.')
      return 'Listo.'
    })
    abrir('/asistente')
    await screen.findByText('Nutriólogo IA · Claude Opus 5.5')

    for (const pregunta of ['Primera consulta', 'Segunda consulta', 'Tercera consulta', 'Cuarta consulta']) {
      const [nuevo] = screen.getAllByRole('button', { name: 'Chat nuevo' })
      if (!(nuevo as HTMLButtonElement).disabled) await userEvent.click(nuevo)
      await userEvent.type(screen.getByLabelText('Escribe tu consulta'), pregunta)
      await pulsar('Enviar')
      await waitFor(() => expect(screen.getByText('1/20 mensajes')).toBeVisible())
      await screen.findByText('Listo.')
      // Un milisegundo de margen para que el orden por fecha no empate.
      await new Promise((resolver) => setTimeout(resolver, 5))
    }

    const historial = screen.getAllByRole('list', { name: 'Chats recientes' })[0]
    const titulos = within(historial).getAllByRole('listitem').map((fila) => fila.textContent)
    expect(titulos).toHaveLength(3)
    expect(titulos.join('|')).not.toContain('Primera consulta')
    expect(titulos[0]).toContain('Cuarta consulta')
    // Se guardan solo en el dispositivo, con el título de la primera pregunta.
    const guardados = JSON.parse(localStorage.getItem('kalo:chats:demo') ?? '[]') as { titulo: string }[]
    expect(guardados.map((chat) => chat.titulo)).toEqual(['Cuarta consulta', 'Tercera consulta', 'Segunda consulta'])

    // Abrir uno anterior recupera su conversación.
    await userEvent.click(within(historial).getByRole('button', { name: /^Segunda consulta/ }))
    expect(await screen.findByText('Segunda consulta', { selector: 'span.whitespace-pre-wrap' })).toBeVisible()
  })

  it('al llegar al límite de mensajes pide abrir un chat nuevo', async () => {
    await conectarIA()
    const turnos = Array.from({ length: 20 }, (_, i) => [
      { rol: 'usuario', texto: `Pregunta ${i + 1}`, visible: `Pregunta ${i + 1}`, sugerencias: [] },
      { rol: 'asistente', texto: 'Respuesta', visible: 'Respuesta', sugerencias: [] },
    ]).flat()
    localStorage.setItem(
      'kalo:chats:demo',
      JSON.stringify([{ id: 'lleno', titulo: 'Chat largo', creadoEn: 1, actualizadoEn: 2, turnos }]),
    )
    abrir('/asistente')

    expect(await screen.findByText(/llegó al límite de 20 mensajes/)).toBeVisible()
    expect(screen.getByLabelText('Escribe tu consulta')).toBeDisabled()
    expect(screen.getByText('20/20 mensajes')).toBeVisible()

    await pulsar('Abrir un chat nuevo')

    expect(screen.getByLabelText('Escribe tu consulta')).toBeEnabled()
    expect(screen.getByText('0/20 mensajes')).toBeVisible()
    expect(screen.queryByText(/llegó al límite/)).not.toBeInTheDocument()
  })

  it('si la IA falla, lo explica y conserva la consulta', async () => {
    await conectarIA()
    ia.conversar.mockRejectedValue(new ErrorIA('red'))
    abrir('/asistente')

    await userEvent.click(await screen.findByRole('button', { name: 'Snack antes de dormir' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos conectar con tu proveedor de IA.')
    expect(screen.getByLabelText('Escribe tu consulta')).toHaveValue('Snack antes de dormir')
  })
})
