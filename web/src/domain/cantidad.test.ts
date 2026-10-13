import { describe, expect, it } from 'vitest'
import { borradorVacio, validarComida } from '../features/registros/comidaBorrador'
import { escalarAnalisis, leerAnalisis, type AnalisisComida } from './ia'

// La IA vio dos panes con huevo y estimó 300 kcal en total (150 cada uno).
const dosPanes: AnalisisComida = {
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
  confianza: 80,
  ingredientes: ['Pan', 'Huevo'],
  es_alcohol: false,
  grados_alcohol: null,
}

describe('cantidad detectada por la IA', () => {
  it('reescala el total conservando lo que vale cada unidad', () => {
    const tres = escalarAnalisis(dosPanes, 3)
    expect(tres).toMatchObject({ cantidad: 3, kcal: 450, kcal_minimo: 390, kcal_maximo: 510, proteina_g: 21 })
    const uno = escalarAnalisis(dosPanes, 1)
    expect(uno).toMatchObject({ cantidad: 1, kcal: 150, proteina_g: 7, grasa_g: 5 })
    // Volver a la cantidad original devuelve la estimación original.
    expect(escalarAnalisis(uno, 2)).toMatchObject({ cantidad: 2, kcal: 300 })
  })

  it('admite medias porciones y acota la cantidad', () => {
    expect(escalarAnalisis(dosPanes, 0.5)).toMatchObject({ cantidad: 0.5, kcal: 75 })
    expect(escalarAnalisis(dosPanes, 1.3).cantidad).toBe(1.5)
    expect(escalarAnalisis(dosPanes, 0).cantidad).toBe(0.5)
    expect(escalarAnalisis(dosPanes, 500).cantidad).toBe(50)
  })

  it('toma como 1 una cantidad ausente o absurda en la respuesta', () => {
    const texto = JSON.stringify({ ...dosPanes, cantidad: 0 })
    expect(leerAnalisis(texto).cantidad).toBe(1)
    expect(leerAnalisis(JSON.stringify({ ...dosPanes, cantidad: 2.4 })).cantidad).toBe(2.5)
  })
})

describe('bebida con alcohol', () => {
  const lleno = (tipo: Parameters<typeof borradorVacio>[0]) => ({
    ...borradorVacio(tipo),
    nombre: 'Algo',
    kcal: '150',
    esAlcohol: true,
    gradosAlcohol: '5',
  })

  it('solo se conserva en snacks y licores', () => {
    for (const tipo of ['desayuno', 'almuerzo', 'cena'] as const) {
      const resultado = validarComida(lleno(tipo), '2026-10-14', 'manual')
      expect('comida' in resultado && resultado.comida).toMatchObject({ esAlcohol: false, gradosAlcohol: null })
    }
    for (const tipo of ['snack', 'licor'] as const) {
      const resultado = validarComida(lleno(tipo), '2026-10-14', 'manual')
      expect('comida' in resultado && resultado.comida).toMatchObject({ esAlcohol: true, gradosAlcohol: 5 })
    }
  })
})
