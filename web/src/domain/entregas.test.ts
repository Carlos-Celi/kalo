import { describe, expect, it } from 'vitest'
import {
  leerAnalisis,
  leerConfigIA,
  motivoDeEstado,
  nivelDe,
  partirRespuesta,
  promptDelAsistente,
  saludoDelAsistente,
} from './ia'
import type { Plan } from './perfil'
import { cambioDePeso, resumirPeriodo, tramosDe, type ResumenDia } from './progreso'
import {
  avisosPendientes,
  convieneAvisar,
  descripcionDe,
  leerRecordatorios,
  recordatoriosPorDefecto,
} from './recordatorios'
import type { TotalesDia } from './registros'

const plan: Plan = {
  datos: {
    nombre: 'Carlos',
    edad: 30,
    sexo: 'masculino',
    estaturaCm: 172,
    pesoKg: 78,
    objetivo: 'bajar',
    pesoMetaKg: 72,
    actividad: 'ligero',
    suenoHabitual: '5-7',
    alcohol: 'fines-de-semana',
    restricciones: ['sin-lactosa'],
  },
  metas: { kcal: 1850, proteinaG: 140, aguaL: 2.5, ejercicioMin: 60, suenoMin: 480 },
}

const totales: TotalesDia = {
  kcal: 1190,
  proteinaG: 52,
  aguaMl: 1600,
  ejercicioMin: 35,
  ejercicioKcal: 130,
  suenoMin: 405,
  suenoNocheMin: 405,
  siestaMin: 0,
  tiposDeComida: 3,
}

function dia(fecha: string, cambios: Partial<ResumenDia> = {}): ResumenDia {
  return {
    fecha,
    kcal: 0,
    proteinaG: 0,
    azucarG: 0,
    grasaG: 0,
    aguaMl: 0,
    ejercicioMin: 0,
    ejercicioKcal: 0,
    suenoMin: 0,
    bebidasAlcohol: 0,
    kcalAlcohol: 0,
    ...cambios,
  }
}

describe('progreso', () => {
  const semana = [
    dia('2026-10-06', { kcal: 1800, proteinaG: 150, azucarG: 40, grasaG: 60, aguaMl: 2000, suenoMin: 420 }),
    dia('2026-10-07'),
    dia('2026-10-08', { kcal: 2000, proteinaG: 100, azucarG: 20, grasaG: 80, ejercicioMin: 45, ejercicioKcal: 170 }),
    dia('2026-10-12', { kcal: 900, proteinaG: 40, bebidasAlcohol: 2, kcalAlcohol: 300 }),
  ]

  it('una barra por día en la semana, con hoy destacado', () => {
    const tramos = tramosDe('semana', semana, '2026-10-12')
    expect(tramos).toHaveLength(7)
    expect(tramos.map((tramo) => tramo.etiqueta)).toEqual(['Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do', 'Hoy'])
    expect(tramos[0].kcal).toBe(1800)
    expect(tramos[1].kcal).toBe(0)
    expect(tramos.at(-1)).toMatchObject({ actual: true, kcal: 900 })
  })

  it('agrupa el mes en cuatro semanas y el año en trece tramos', () => {
    const mes = tramosDe('mes', semana, '2026-10-12')
    expect(mes).toHaveLength(4)
    // La última semana promedia solo los días con registro.
    expect(mes[3]).toMatchObject({ actual: true, kcal: Math.round((1800 + 2000 + 900) / 3) })
    expect(tramosDe('ano', semana, '2026-10-12')).toHaveLength(13)
  })

  it('promedia sobre los días con registro y suma ejercicio y licor', () => {
    const resumen = resumirPeriodo('semana', semana, '2026-10-12', 140)
    expect(resumen).toMatchObject({
      kcalPromedio: 1567,
      proteinaPromedio: 97,
      azucarPromedio: 20,
      grasaPromedio: 47,
      ejercicioMin: 45,
      ejercicioKcal: 170,
      bebidasAlcohol: 2,
      kcalAlcohol: 300,
      diasConComida: 2,
      diasConProteina: 1,
    })
  })

  it('calcula el cambio de peso del tramo', () => {
    expect(cambioDePeso([{ fecha: 'a', kg: 79.6, nota: '' }, { fecha: 'b', kg: 78, nota: '' }])).toBe(-1.6)
    expect(cambioDePeso([{ fecha: 'a', kg: 78, nota: '' }])).toBeNull()
  })
})

describe('recordatorios', () => {
  const porDefecto = recordatoriosPorDefecto()

  it('describe los horarios como en el diseño', () => {
    expect(porDefecto.map(descripcionDe)).toEqual([
      'Cada 2 horas · 8:00 a 20:00',
      '8:00 · 13:00 · 20:00',
      'Lun, mié, vie · 18:00',
      'Todos los días · 22:30',
      'Lunes · 7:00',
    ])
  })

  it('avisa a su hora, una sola vez y solo los activos del día', () => {
    // Lunes 12 de octubre de 2026, 13:04.
    const ahora = new Date(2026, 9, 12, 13, 4)
    const pendientes = avisosPendientes(porDefecto, ahora, new Set())
    expect(pendientes.map((aviso) => `${aviso.recordatorio.id} ${aviso.hora}`)).toEqual(['comidas 13:00'])
    expect(avisosPendientes(porDefecto, ahora, new Set([pendientes[0].clave]))).toEqual([])
    expect(avisosPendientes(porDefecto, new Date(2026, 9, 12, 13, 11), new Set())).toEqual([])
    // El ejercicio está desactivado por defecto aunque sea lunes a las 18:00.
    expect(avisosPendientes(porDefecto, new Date(2026, 9, 12, 18, 0), new Set()).map((a) => a.recordatorio.id)).toEqual(['agua'])
  })

  it('no avisa si ya se cumplió lo que recuerda', () => {
    const [agua, comidas] = porDefecto
    const aviso = (recordatorio: typeof agua, hora: string) => ({ recordatorio, hora, clave: '' })
    expect(convieneAvisar(aviso(agua, '16:00'), totales, 3, plan.metas)).toBe(true)
    expect(convieneAvisar(aviso(agua, '16:00'), { ...totales, aguaMl: 2500 }, 3, plan.metas)).toBe(false)
    // A las 13:00 se esperan dos comidas registradas.
    expect(convieneAvisar(aviso(comidas, '13:00'), totales, 1, plan.metas)).toBe(true)
    expect(convieneAvisar(aviso(comidas, '13:00'), totales, 2, plan.metas)).toBe(false)
  })

  it('descarta lo guardado si no tiene la forma esperada', () => {
    expect(leerRecordatorios(JSON.parse(JSON.stringify(porDefecto)))).toEqual(porDefecto)
    expect(leerRecordatorios([{ ...porDefecto[0], horas: ['25:00'] }])).toBeNull()
    expect(leerRecordatorios('nada')).toBeNull()
  })
})

describe('IA', () => {
  it('separa el texto de las comidas sugeridas y oculta el bloque a medias', () => {
    const completo =
      'Estas opciones te acercan:\n```kalo-comidas\n[{"nombre":"Salmón con quinua","kcal":520,"proteina_g":38}]\n```'
    expect(partirRespuesta(completo)).toEqual({
      visible: 'Estas opciones te acercan:',
      sugerencias: [
        { nombre: 'Salmón con quinua', kcal: 520, proteina_g: 38, carbohidratos_g: 0, azucar_g: 0, grasa_g: 0 },
      ],
    })
    expect(partirRespuesta('Estas opciones te acercan:\n```kalo-com').visible).toBe('Estas opciones te acercan:')
    expect(partirRespuesta('Estas opciones:\n```kalo-comidas\n[{"nombre":"Sal').sugerencias).toEqual([])
    expect(partirRespuesta('Texto\n```kalo-comidas\nno es json\n```')).toEqual({ visible: 'Texto', sugerencias: [] })
  })

  it('acota la estimación de la foto y rechaza lo que no cumple el esquema', () => {
    const analisis = leerAnalisis(
      JSON.stringify({
        nombre: '  Arroz con pollo  ',
        porcion: '1 plato',
        cantidad: 1.2,
        unidad: '  plato ',
        kcal: 620.4,
        kcal_minimo: 700,
        kcal_maximo: 600,
        proteina_g: 38.26,
        carbohidratos_g: -5,
        azucar_g: 6,
        grasa_g: 24,
        confianza: 140,
        ingredientes: ['Arroz', ' ', 'Pollo'],
        es_alcohol: false,
        grados_alcohol: 5,
      }),
    )
    expect(analisis).toMatchObject({
      nombre: 'Arroz con pollo',
      cantidad: 1,
      unidad: 'plato',
      kcal: 620,
      kcal_minimo: 620,
      kcal_maximo: 620,
      proteina_g: 38.3,
      carbohidratos_g: 0,
      confianza: 100,
      ingredientes: ['Arroz', 'Pollo'],
      grados_alcohol: null,
    })
    expect(() => leerAnalisis('{"nombre":"x"}')).toThrow('respuesta')
    expect(() => leerAnalisis('no es json')).toThrow('respuesta')
  })

  it('clasifica azúcar y grasa y traduce los errores del proveedor', () => {
    expect(nivelDe(6, 50)).toBe('Bajo')
    expect(nivelDe(24, 65)).toBe('Medio')
    expect(nivelDe(40, 65)).toBe('Alto')
    expect(motivoDeEstado(401)).toBe('clave')
    expect(motivoDeEstado(429)).toBe('limite')
    expect(motivoDeEstado(500)).toBe('desconocido')
  })

  it('da al asistente las metas, las restricciones y el aviso de salud', () => {
    const prompt = promptDelAsistente(plan, 'HOY: 1.190 de 1.850 kcal')
    expect(prompt).toContain('1.850 kcal y 140 g de proteína')
    expect(prompt).toContain('sin lactosa')
    expect(prompt).toContain('no diagnosticas ni sustituyes a un profesional de la salud')
    // Los datos actuales de la app acompañan a las instrucciones.
    expect(prompt).toContain('=== DATOS ACTUALES DE LA PERSONA EN KALO ===\nHOY: 1.190 de 1.850 kcal')
    expect(saludoDelAsistente('Carlos', totales, plan)).toBe(
      'Hola Carlos, soy tu asistente nutricional. Vas en 1.190 kcal y 52 g de proteína. Te faltan 660 kcal y 88 g de proteína. ¿En qué te ayudo?',
    )
  })

  it('no acepta una configuración guardada con otra forma', () => {
    expect(leerConfigIA({ proveedor: 'anthropic', apiKey: 'clave', modelo: 'claude-opus-5-5', verificada: true })).toEqual({
      proveedor: 'anthropic',
      modelo: 'claude-opus-5-5',
      nombreModelo: 'claude-opus-5-5',
      verificada: true,
    })
    expect(leerConfigIA({ proveedor: 'otro', apiKey: 'clave', modelo: 'm' })).toBeNull()
    expect(leerConfigIA({ proveedor: 'openai', modelo: '' })).toBeNull()
  })
})

describe('errores de Google', () => {
  it('reconoce una clave inválida aunque el código HTTP sea 400', async () => {
    const { motivoDeGoogle } = await import('../features/ia/proveedores/google')
    const claveInvalida = {
      error: {
        code: 400,
        status: 'INVALID_ARGUMENT',
        details: [{ reason: 'API_KEY_INVALID', domain: 'googleapis.com' }],
      },
    }
    expect(motivoDeGoogle(400, claveInvalida)).toEqual({ motivo: 'clave', codigo: 'API_KEY_INVALID' })
    expect(motivoDeGoogle(403, { error: { status: 'PERMISSION_DENIED' } }).motivo).toBe('clave')
    expect(motivoDeGoogle(429, { error: { status: 'RESOURCE_EXHAUSTED' } }).motivo).toBe('limite')
    // Sin pistas en el cuerpo, decide el código HTTP.
    expect(motivoDeGoogle(500, null).motivo).toBeNull()
  })
})
