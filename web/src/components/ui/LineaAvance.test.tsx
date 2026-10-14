import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LineaAvance } from './LineaAvance'

/** El riel es aria-hidden: se consulta por clase, que es lo que cambia por estado. */
function pintar(props: Parameters<typeof LineaAvance>[0]) {
  const { container } = render(<LineaAvance {...props} />)
  return container.firstElementChild as HTMLElement
}

describe('LineaAvance', () => {
  it('es decorativa: el estado lo dice el texto de quien la usa', () => {
    expect(pintar({ razon: 0.5, estado: 'parcial', tono: 'llama' })).toHaveAttribute('aria-hidden', 'true')
  })

  it('cumplido: avance sólido que llega a la marca de meta', () => {
    const linea = pintar({ razon: 1, estado: 'cumplido', tono: 'sol' })
    const avance = linea.querySelector('.bg-sol') as HTMLElement
    expect(avance).toBeInTheDocument()
    expect(avance.className).not.toContain('border-dashed')
  })

  it('parcial de un día pasado: avance discontinuo', () => {
    const linea = pintar({ razon: 0.6, estado: 'parcial', tono: 'llama', pasado: true })
    expect(linea.querySelector('.border-dashed.border-llama')).toBeInTheDocument()
    expect(linea.querySelector('.bg-llama')).not.toBeInTheDocument()
  })

  it('excedido: doble línea y sin relleno', () => {
    const linea = pintar({ razon: 1.2, estado: 'excedido', tono: 'llama' })
    expect(linea.querySelectorAll('.bg-exceso')).toHaveLength(2)
    expect(linea.querySelector('.bg-llama')).not.toBeInTheDocument()
  })

  it('sin registro: riel punteado y nada de avance', () => {
    const linea = pintar({ razon: 0, estado: 'vacio', tono: 'agua' })
    expect(linea.querySelector('.border-dotted')).toBeInTheDocument()
    expect(linea.querySelector('.bg-agua-luz')).not.toBeInTheDocument()
  })
})
