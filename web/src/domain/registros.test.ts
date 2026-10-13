import { describe, expect, it } from 'vitest'
import { claveDia, deClave, esClaveDia, formatoDiaRelativo, sumarDias, ultimosDias } from './fechas'
import {
  avanceDe,
  duracionDeSueno,
  estadoDe,
  kcalDeEjercicio,
  promedio,
  racha,
  siguienteComida,
  totalesDelDia,
  type Comida,
  type Registros,
} from './registros'

const metas = { kcal: 1850, proteinaG: 140, aguaL: 2.5, ejercicioMin: 60, suenoMin: 480 }

function comida(fecha: string, tipo: Comida['tipo'], kcal: number, proteinaG = 0): Comida {
  return {
    id: `${fecha}-${tipo}-${kcal}`,
    fecha,
    tipo,
    nombre: 'Algo',
    porcion: '',
    kcal,
    proteinaG,
    carbohidratosG: 0,
    azucarG: 0,
    grasaG: 0,
    esAlcohol: false,
    gradosAlcohol: null,
    origen: 'manual',
    tieneFoto: false,
    creadoEn: `${fecha}T12:00:00.000Z`,
  }
}

const registros: Registros = {
  comidas: [
    comida('2026-10-12', 'desayuno', 400, 20.4),
    comida('2026-10-12', 'desayuno', 100, 5.2),
    comida('2026-10-12', 'almuerzo', 700, 40),
    comida('2026-10-11', 'cena', 2000),
  ],
  aguas: [
    { id: 'a1', fecha: '2026-10-12', ml: 500, creadoEn: '' },
    { id: 'a2', fecha: '2026-10-12', ml: 750, creadoEn: '' },
  ],
  ejercicios: [
    {
      id: 'e1',
      fecha: '2026-10-12',
      minutos: 60,
      nombre: 'Correr',
      kcal: 400,
      origenKcal: 'manual',
      creadoEn: '',
    },
  ],
  suenos: [{ fecha: '2026-10-12', minutos: 450 }],
  siestas: [],
}

describe('fechas', () => {
  it('usa el día local y no cambia de día al cruzar meses', () => {
    expect(claveDia(new Date(2026, 9, 1, 23, 59))).toBe('2026-10-01')
    expect(sumarDias('2026-10-01', -1)).toBe('2026-09-30')
    expect(ultimosDias('2026-03-02', 3)).toEqual(['2026-02-28', '2026-03-01', '2026-03-02'])
    expect(claveDia(deClave('2026-12-31'))).toBe('2026-12-31')
  })

  it('reconoce solo fechas reales', () => {
    expect(esClaveDia('2026-10-12')).toBe(true)
    expect(esClaveDia('2026-02-30')).toBe(false)
    expect(esClaveDia('12/10/2026')).toBe(false)
  })

  it('nombra hoy y ayer', () => {
    expect(formatoDiaRelativo('2026-10-12', '2026-10-12')).toBe('Hoy, 12 oct')
    expect(formatoDiaRelativo('2026-10-11', '2026-10-12')).toBe('Ayer, 11 oct')
    expect(formatoDiaRelativo('2026-10-08', '2026-10-12')).toBe('8 oct')
  })
})

describe('totales del día', () => {
  it('suma solo lo de ese día', () => {
    expect(totalesDelDia(registros, '2026-10-12')).toEqual({
      kcal: 1200,
      proteinaG: 66,
      aguaMl: 1250,
      ejercicioMin: 60,
      ejercicioKcal: 400,
      suenoMin: 450,
      suenoNocheMin: 450,
      siestaMin: 0,
      tiposDeComida: 2,
    })
    expect(totalesDelDia(registros, '2026-10-10').kcal).toBe(0)
  })

  it('suma las siestas al sueño de la noche', () => {
    const conSiestas: Registros = {
      ...registros,
      siestas: [
        { id: 's1', fecha: '2026-10-12', minutos: 20, creadoEn: '' },
        { id: 's2', fecha: '2026-10-12', minutos: 30, creadoEn: '' },
        { id: 's3', fecha: '2026-10-11', minutos: 60, creadoEn: '' },
      ],
    }
    const totales = totalesDelDia(conSiestas, '2026-10-12')
    expect(totales.suenoNocheMin).toBe(450)
    expect(totales.siestaMin).toBe(50)
    expect(totales.suenoMin).toBe(500)
    expect(avanceDe('sueno', totales, metas)).toEqual({ valor: 500, meta: 480 })
    // Sin noche registrada, una siesta cuenta igualmente.
    expect(totalesDelDia(conSiestas, '2026-10-11').suenoMin).toBe(60)
  })

  it('expresa el avance en la unidad de cada sección', () => {
    const totales = totalesDelDia(registros, '2026-10-12')
    expect(avanceDe('agua', totales, metas)).toEqual({ valor: 1.25, meta: 2.5 })
    expect(avanceDe('sueno', totales, metas)).toEqual({ valor: 450, meta: 480 })
  })

  it('solo las calorías pueden quedar excedidas', () => {
    const ayer = totalesDelDia(registros, '2026-10-11')
    expect(estadoDe('comida', avanceDe('comida', ayer, metas))).toBe('excedido')
    expect(estadoDe('ejercicio', { valor: 200, meta: 60 })).toBe('cumplido')
    expect(estadoDe('agua', { valor: 0, meta: 2.5 })).toBe('vacio')
  })
})

describe('racha', () => {
  it('cuenta los días seguidos cumplidos hasta hoy', () => {
    expect(racha(['parcial', 'cumplido', 'cumplido', 'cumplido'])).toBe(3)
  })

  it('un hoy sin cumplir no la rompe, pero un día anterior sí', () => {
    expect(racha(['cumplido', 'cumplido', 'parcial'])).toBe(2)
    expect(racha(['cumplido', 'excedido', 'cumplido', 'vacio'])).toBe(1)
    expect(racha(['parcial', 'vacio'])).toBe(0)
  })
})

describe('ayudas', () => {
  it('propone la primera comida principal que falta', () => {
    expect(siguienteComida(registros, '2026-10-12')).toBe('cena')
    expect(siguienteComida(registros, '2026-10-10')).toBe('desayuno')
    expect(
      siguienteComida({ ...registros, comidas: [...registros.comidas, comida('2026-10-12', 'cena', 1)] }, '2026-10-12'),
    ).toBe('snack')
  })

  it('calcula la duración del sueño aunque cruce la medianoche', () => {
    expect(duracionDeSueno('23:30', '07:00')).toBe(450)
    expect(duracionDeSueno('00:15', '06:45')).toBe(390)
    expect(duracionDeSueno('14:00', '14:30')).toBe(30)
    expect(duracionDeSueno('07:00', '07:00')).toBeNull()
    expect(duracionDeSueno('', '07:00')).toBeNull()
    expect(duracionDeSueno('25:00', '07:00')).toBeNull()
  })

  it('estima calorías de ejercicio y promedia solo días con dato', () => {
    expect(kcalDeEjercicio(35)).toBe(130)
    expect(promedio([420, 0, 480])).toBe(450)
    expect(promedio([])).toBe(0)
  })
})
