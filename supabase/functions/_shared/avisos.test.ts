// Pruebas de la lógica pura de los avisos por correo. Se ejecutan con Node 24
// (que ejecuta TypeScript tal cual), sin dependencias:
//
//   node --test supabase/functions/_shared/avisos.test.ts

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  avisosPendientes,
  componerCorreo,
  convieneAvisar,
  momentoLocal,
  textoDelAviso,
  type Recordatorio,
} from './avisos.ts'

const agua: Recordatorio = {
  id: 'agua',
  tipo: 'agua',
  nombre: 'Beber agua',
  horas: ['08:00', '10:00'],
  dias: [0, 1, 2, 3, 4, 5, 6],
}

describe('momento local', () => {
  it('convierte el instante a la hora de la zona de la persona', () => {
    // 2026-10-14 03:30 UTC es el 13 a las 22:30 en Bogotá (UTC−5) y el 14 a las 12:30 en Sídney.
    const instante = new Date('2026-10-14T03:30:00Z')
    assert.deepEqual(momentoLocal(instante, 'America/Bogota'), { fecha: '2026-10-13', dia: 2, minuto: 22 * 60 + 30 })
    assert.deepEqual(momentoLocal(instante, 'Australia/Sydney'), { fecha: '2026-10-14', dia: 3, minuto: 14 * 60 + 30 })
  })

  it('con una zona desconocida usa UTC', () => {
    const instante = new Date('2026-10-14T03:30:00Z')
    assert.deepEqual(momentoLocal(instante, 'No/Existe'), momentoLocal(instante, 'UTC'))
  })

  it('la medianoche es el minuto 0, no el 24', () => {
    assert.equal(momentoLocal(new Date('2026-10-14T00:05:00Z'), 'UTC').minuto, 5)
  })
})

describe('avisos pendientes', () => {
  const ahora = { fecha: '2026-10-14', dia: 3, minuto: 8 * 60 + 4 }

  it('avisa dentro de la ventana de la hora programada', () => {
    const pendientes = avisosPendientes([agua], ahora, new Set())
    assert.deepEqual(pendientes.map((aviso) => aviso.clave), ['2026-10-14|agua|08:00'])
  })

  it('no avisa antes, ni pasada la ventana, ni dos veces', () => {
    assert.equal(avisosPendientes([agua], { ...ahora, minuto: 7 * 60 + 59 }, new Set()).length, 0)
    assert.equal(avisosPendientes([agua], { ...ahora, minuto: 8 * 60 + 10 }, new Set()).length, 0)
    assert.equal(avisosPendientes([agua], ahora, new Set(['2026-10-14|agua|08:00'])).length, 0)
  })

  it('respeta los días de la semana', () => {
    const soloLunes = { ...agua, dias: [1] }
    assert.equal(avisosPendientes([soloLunes], ahora, new Set()).length, 0)
  })
})

describe('avisos inteligentes', () => {
  const metas = { aguaMl: 2500, ejercicioMin: 60 }
  const aviso = (recordatorio: Recordatorio, hora: string) => ({ recordatorio, hora, clave: '' })

  it('no recuerda el agua si ya se llegó a la meta', () => {
    assert.equal(convieneAvisar(aviso(agua, '08:00'), { aguaMl: 2500, ejercicioMin: 0, tiposDeComida: 0 }, metas), false)
    assert.equal(convieneAvisar(aviso(agua, '08:00'), { aguaMl: 1000, ejercicioMin: 0, tiposDeComida: 0 }, metas), true)
  })

  it('no recuerda registrar una comida que ya está registrada', () => {
    const comidas: Recordatorio = { ...agua, id: 'comidas', tipo: 'comidas', horas: ['08:00', '13:00', '20:00'] }
    const registrada = { aguaMl: 0, ejercicioMin: 0, tiposDeComida: 2 }
    assert.equal(convieneAvisar(aviso(comidas, '13:00'), registrada, metas), false)
    assert.equal(convieneAvisar(aviso(comidas, '20:00'), registrada, metas), true)
  })
})

describe('correo', () => {
  it('escapa el HTML de los nombres propios', () => {
    const propio: Recordatorio = { ...agua, id: 'propio-1', tipo: 'propio', nombre: '<script>x</script>' }
    const correo = componerCorreo('Ana', [textoDelAviso(propio)], 'https://kalo.example')
    assert.ok(!correo.html.includes('<script>'))
    assert.ok(correo.html.includes('&lt;script&gt;'))
    assert.equal(correo.asunto, '<script>x</script>')
  })

  it('agrupa varios avisos en un solo correo', () => {
    const correo = componerCorreo('', [textoDelAviso(agua), textoDelAviso({ ...agua, tipo: 'peso' })], 'https://kalo.example')
    assert.equal(correo.asunto, 'Kalo: 2 recordatorios')
    assert.ok(correo.texto.startsWith('Hola,'))
  })
})
