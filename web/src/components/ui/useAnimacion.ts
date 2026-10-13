import { useEffect, useRef, useState } from 'react'

function sinMovimiento(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Devuelve 0 en el primer pintado y `valor` en el siguiente, para que un
 * `transition` de CSS anime la entrada (anillos y barras que se llenan).
 */
export function useEntrada(valor: number): number {
  const [mostrado, setMostrado] = useState(() => (sinMovimiento() ? valor : 0))
  useEffect(() => {
    const cuadro = requestAnimationFrame(() => setMostrado(valor))
    return () => cancelAnimationFrame(cuadro)
  }, [valor])
  return mostrado
}

/** Cuenta desde el valor anterior hasta `objetivo` en `duracion` ms (cifras que "suben"). */
export function useContador(objetivo: number, duracion = 700): number {
  const [valor, setValor] = useState(() => (sinMovimiento() ? objetivo : 0))
  const desde = useRef(valor)
  useEffect(() => {
    if (sinMovimiento()) {
      desde.current = objetivo
      const cuadro = requestAnimationFrame(() => setValor(objetivo))
      return () => cancelAnimationFrame(cuadro)
    }
    const origen = desde.current
    const inicio = performance.now()
    let cuadro = 0
    const paso = (ahora: number) => {
      const t = Math.min((ahora - inicio) / duracion, 1)
      const actual = origen + (objetivo - origen) * (1 - (1 - t) ** 3)
      desde.current = actual
      setValor(actual)
      if (t < 1) cuadro = requestAnimationFrame(paso)
    }
    cuadro = requestAnimationFrame(paso)
    return () => cancelAnimationFrame(cuadro)
  }, [objetivo, duracion])
  return Math.round(valor)
}
