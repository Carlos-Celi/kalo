import { describe, expect, it } from 'vitest'
import {
  chatLleno,
  guardarChat,
  leerChats,
  LIMITE_MENSAJES_POR_CHAT,
  MAXIMO_CHATS,
  mensajesEnviados,
  quitarChat,
  tituloDeChat,
  type Chat,
  type TurnoChat,
} from './chats'
import { contextoDeLaApp } from './contextoAsistente'
import type { Plan } from './perfil'
import type { ResumenDia } from './progreso'
import type { Registros } from './registros'

const turno = (rol: TurnoChat['rol'], texto = 'hola'): TurnoChat => ({
  rol,
  texto,
  visible: texto,
  sugerencias: [],
})

function chat(id: string, actualizadoEn: number, preguntas = 1): Chat {
  return {
    id,
    titulo: id,
    creadoEn: actualizadoEn,
    actualizadoEn,
    turnos: Array.from({ length: preguntas }, () => [turno('usuario'), turno('asistente')]).flat(),
  }
}

describe('chats del asistente', () => {
  it('conserva solo los tres más recientes', () => {
    let chats: Chat[] = []
    for (let i = 1; i <= MAXIMO_CHATS + 2; i++) chats = guardarChat(chats, chat(`c${i}`, i))
    expect(chats.map((otro) => otro.id)).toEqual(['c5', 'c4', 'c3'])
  })

  it('actualizar un chat lo sube al primer lugar sin duplicarlo', () => {
    const chats = [chat('a', 3), chat('b', 2), chat('c', 1)]
    const nuevos = guardarChat(chats, chat('c', 10, 2))
    expect(nuevos.map((otro) => otro.id)).toEqual(['c', 'a', 'b'])
    expect(quitarChat(nuevos, 'a').map((otro) => otro.id)).toEqual(['c', 'b'])
  })

  it('cuenta solo las preguntas del usuario y marca el límite', () => {
    expect(mensajesEnviados(null)).toBe(0)
    expect(mensajesEnviados(chat('x', 1, 3))).toBe(3)
    expect(chatLleno(chat('x', 1, LIMITE_MENSAJES_POR_CHAT - 1))).toBe(false)
    expect(chatLleno(chat('x', 1, LIMITE_MENSAJES_POR_CHAT))).toBe(true)
  })

  it('titula con el comienzo de la primera pregunta', () => {
    expect(tituloDeChat('  ¿Qué   ceno hoy?  ')).toBe('¿Qué ceno hoy?')
    expect(tituloDeChat('a'.repeat(100))).toHaveLength(42)
    expect(tituloDeChat('   ')).toBe('Chat nuevo')
  })

  it('descarta lo guardado con otra forma y respeta el máximo', () => {
    expect(leerChats('no es una lista')).toEqual([])
    const validos = [chat('a', 4), chat('b', 3), chat('c', 2), chat('d', 1)]
    const leidos = leerChats([...validos, { id: 'roto' }, null])
    expect(leidos.map((otro) => otro.id)).toEqual(['a', 'b', 'c'])
  })
})

describe('contexto del asistente', () => {
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
      restricciones: [],
    },
    metas: { kcal: 1850, proteinaG: 140, aguaL: 2.5, ejercicioMin: 60, suenoMin: 480 },
  }
  const registros: Registros = {
    comidas: [
      {
        id: 'c1',
        fecha: '2026-10-14',
        tipo: 'almuerzo',
        nombre: 'Arroz con pollo',
        porcion: '1 plato',
        kcal: 620,
        proteinaG: 38,
        carbohidratosG: 70,
        azucarG: 3,
        grasaG: 18,
        esAlcohol: false,
        gradosAlcohol: null,
        origen: 'ia',
        tieneFoto: false,
        creadoEn: '2026-10-14T13:10:00.000Z',
      },
      {
        id: 'c0',
        fecha: '2026-10-13',
        tipo: 'cena',
        nombre: 'Tortilla de claras',
        porcion: '',
        kcal: 300,
        proteinaG: 30,
        carbohidratosG: 5,
        azucarG: 1,
        grasaG: 12,
        esAlcohol: false,
        gradosAlcohol: null,
        origen: 'manual',
        tieneFoto: false,
        creadoEn: '2026-10-13T20:00:00.000Z',
      },
    ],
    aguas: [{ id: 'a1', fecha: '2026-10-14', ml: 500, creadoEn: '2026-10-14T10:00:00.000Z' }],
    ejercicios: [
      {
        id: 'e1',
        fecha: '2026-10-14',
        minutos: 40,
        nombre: 'Bicicleta',
        kcal: 380,
        origenKcal: 'manual',
        creadoEn: '2026-10-14T07:00:00.000Z',
      },
    ],
    suenos: [{ fecha: '2026-10-14', minutos: 420 }],
    siestas: [{ id: 's1', fecha: '2026-10-14', minutos: 30, creadoEn: '2026-10-14T15:00:00.000Z' }],
  }
  const dia = (fecha: string, cambios: Partial<ResumenDia>): ResumenDia => ({
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
  })

  const texto = contextoDeLaApp({
    ahora: new Date(2026, 9, 14, 16, 5),
    hoy: '2026-10-14',
    plan,
    registros,
    resumen: [
      dia('2026-10-13', { kcal: 1700, proteinaG: 120, aguaMl: 2000, suenoMin: 450 }),
      dia('2026-10-14', { kcal: 620, proteinaG: 38, aguaMl: 500, ejercicioMin: 40, suenoMin: 450 }),
    ],
    pesos: [
      { fecha: '2026-10-01', kg: 79, nota: '' },
      { fecha: '2026-10-12', kg: 78, nota: 'En ayunas' },
    ],
    recordatorios: [
      { id: 'agua', tipo: 'agua', nombre: 'Beber agua', horas: ['08:00'], dias: [0, 1, 2, 3, 4, 5, 6], activo: true },
    ],
  })

  it('incluye el estado de hoy con su detalle', () => {
    expect(texto).toContain('Calorías: 620 de 1.850 kcal (faltan 1.230)')
    expect(texto).toContain('Proteína: 38 de 140 g (faltan 102 g)')
    expect(texto).toContain('Sueño: 7 h 30 en total (noche 7 h, siestas 30 min)')
    expect(texto).toContain('Almuerzo: Arroz con pollo (1 plato) — 620 kcal · P 38 g')
    expect(texto).toContain('[estimado por IA]')
    expect(texto).toContain('Bicicleta 40 min, 380 kcal (medidas por el usuario)')
  })

  it('resume el historial, las comidas recientes, el peso y los recordatorios', () => {
    expect(texto).toContain('- 2026-10-13: 1.700 · 120 · 2 · 0 · 7 h 30')
    expect(texto).toContain('- 2026-10-13 Cena: Tortilla de claras — 300 kcal')
    expect(texto).toContain('PESO: último registro 78 kg el 2026-10-12')
    expect(texto).toContain('Cambio en el periodo: -1 kg')
    expect(texto).toContain('RECORDATORIOS ACTIVOS: Beber agua')
  })
})
