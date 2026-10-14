import { render, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AnilloDia } from './AnilloDia'

function pintar(props: Parameters<typeof AnilloDia>[0]) {
  const { container } = render(<AnilloDia {...props} />)
  return container.firstElementChild as HTMLElement
}

describe('AnilloDia', () => {
  it('cumplido: anillo con ✓', () => {
    const anillo = pintar({ razon: 1, estado: 'cumplido', tono: 'agua' })
    expect(anillo).toHaveAttribute('aria-hidden', 'true')
    expect(anillo).toHaveTextContent('✓')
    expect(anillo.querySelector('.stroke-agua-luz')).toBeInTheDocument()
  })

  it('excedido: doble anillo rojo con «!»', () => {
    const anillo = pintar({ razon: 1.16, estado: 'excedido', tono: 'llama' })
    expect(anillo).toHaveTextContent('!')
    expect(anillo.querySelectorAll('.stroke-exceso')).toHaveLength(2)
  })

  it('parcial de un día pasado: arco discontinuo con ½', async () => {
    const anillo = pintar({ razon: 0.6, estado: 'parcial', tono: 'llama', pasado: true })
    expect(anillo).toHaveTextContent('½')
    // El arco crece al aparecer: se espera al siguiente cuadro.
    await waitFor(() =>
      expect(anillo.querySelector('.stroke-llama')?.getAttribute('stroke-dasharray')).toMatch(/^4 3 4 3/),
    )
  })

  it('sin registro: solo el riel punteado, sin símbolo', () => {
    const anillo = pintar({ razon: 0, estado: 'vacio', tono: 'sueno' })
    expect(anillo.querySelector('.stroke-sueno-luz')).not.toBeInTheDocument()
    expect(anillo.querySelector('.stroke-filo')?.getAttribute('stroke-dasharray')).toBe('1.5 3.5')
  })
})
