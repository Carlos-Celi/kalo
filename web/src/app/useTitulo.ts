import { useEffect } from 'react'

/** Título de la pestaña del navegador para la pantalla actual. */
export function useTitulo(titulo: string) {
  useEffect(() => {
    document.title = `${titulo} · Kalo`
  }, [titulo])
}
