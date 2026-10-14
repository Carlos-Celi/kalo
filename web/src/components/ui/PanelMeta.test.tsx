import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { PanelMeta } from './PanelMeta'

function pintar(props: Parameters<typeof PanelMeta>[0]) {
  render(
    <MemoryRouter>
      <PanelMeta {...props} />
    </MemoryRouter>,
  )
}

describe('PanelMeta', () => {
  it('calorías entre el 90 % y el 105 %: cumplido con ✓', () => {
    pintar({ nombre: 'Calorías', tono: 'calorias', unidad: 'kcal', avance: { valor: 1800, meta: 1850 }, mensaje: 'Te quedan 50' })
    expect(screen.getByText('✓ 97 %')).toBeVisible()
  })

  it('calorías por encima del 105 %: excedido con «!»', () => {
    pintar({ nombre: 'Calorías', tono: 'calorias', unidad: 'kcal', avance: { valor: 2140, meta: 1850 }, mensaje: 'Te pasaste por 290' })
    expect(screen.getByText('! 116 %')).toBeVisible()
    expect(screen.getByRole('link', { name: /116 %/ })).toBeVisible()
  })

  it('proteína nunca se marca como excedida: pasar la meta es cumplir', () => {
    pintar({ nombre: 'Proteína', tono: 'proteina', unidad: 'g', avance: { valor: 160, meta: 140 }, mensaje: 'Meta cumplida' })
    expect(screen.getByText('✓ 114 %')).toBeVisible()
    expect(screen.queryByText(/^!/)).not.toBeInTheDocument()
  })

  it('sin registro dice «Sin registro»', () => {
    pintar({ nombre: 'Proteína', tono: 'proteina', unidad: 'g', avance: { valor: 0, meta: 140 }, mensaje: 'Faltan 140 g' })
    expect(screen.getByText('Sin registro')).toBeVisible()
  })
})
