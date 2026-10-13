import { describe, expect, it } from 'vitest'
import { parsearMarkdown, tramosEnLinea } from './markdown'

describe('markdown del asistente', () => {
  it('reconoce títulos, listas y párrafos', () => {
    const bloques = parsearMarkdown(
      ['## Menú de mañana', '', 'Una opción **ligera**:', '- Avena', '- Yogur', '', '1. Compra', '2) Cocina'].join('\n'),
    )
    expect(bloques).toEqual([
      { tipo: 'titulo', nivel: 2, texto: 'Menú de mañana' },
      { tipo: 'parrafo', texto: 'Una opción **ligera**:' },
      { tipo: 'lista', ordenada: false, elementos: ['Avena', 'Yogur'] },
      { tipo: 'lista', ordenada: true, elementos: ['Compra', 'Cocina'] },
    ])
  })

  it('reconoce tablas aunque lleguen a medias', () => {
    const tabla = parsearMarkdown('| Comida | kcal |\n|---|---|\n| Avena | 320 |\n| Yogur | 100 |')
    expect(tabla).toEqual([
      { tipo: 'tabla', cabecera: ['Comida', 'kcal'], filas: [['Avena', '320'], ['Yogur', '100']] },
    ])
    // Mientras llega la respuesta, una cabecera sin separador es solo texto.
    expect(parsearMarkdown('| Comida | kcal |')[0].tipo).toBe('parrafo')
  })

  it('no interpreta HTML: lo deja como texto', () => {
    expect(tramosEnLinea('<b>x</b> y **z**')).toEqual([
      { tipo: 'texto', texto: '<b>x</b> y ' },
      { tipo: 'negrita', texto: 'z' },
    ])
  })

  it('marca negrita, cursiva y código en línea', () => {
    expect(tramosEnLinea('a **b** *c* `d`').map((tramo) => tramo.tipo)).toEqual([
      'texto', 'negrita', 'texto', 'cursiva', 'texto', 'codigo',
    ])
  })
})
