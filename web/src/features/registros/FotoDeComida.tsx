import { useEffect, useRef, useState } from 'react'
import { repositorios } from '../../data'
import { Alerta } from '../../components/ui/Alerta'
import { Icon } from '../../components/ui/Icon'
import { pintarMiniatura } from '../ia/foto'

interface Props {
  /** Id de la comida cuya foto se muestra. */
  id: string
  /** Se llama cuando la foto se quita de la comida. */
  onQuitada: () => void
}

/** Foto ultracomprimida guardada con una comida, con la opción de quitarla. */
export function FotoDeComida({ id, onQuitada }: Props) {
  const lienzo = useRef<HTMLCanvasElement>(null)
  const [fase, setFase] = useState<'cargando' | 'lista' | 'error'>('cargando')
  const [quitando, setQuitando] = useState(false)
  const [fallo, setFallo] = useState(false)

  useEffect(() => {
    let vigente = true
    repositorios.registros
      .obtenerFoto(id)
      .then(async (url) => {
        const destino = lienzo.current
        const pintada = url && destino ? await pintarMiniatura(url, destino) : false
        if (vigente) setFase(pintada ? 'lista' : 'error')
      })
      .catch(() => {
        if (vigente) setFase('error')
      })
    return () => {
      vigente = false
    }
  }, [id])

  async function quitar() {
    setQuitando(true)
    setFallo(false)
    try {
      await repositorios.registros.quitarFoto(id)
      onQuitada()
    } catch {
      setFallo(true)
      setQuitando(false)
    }
  }

  if (fase === 'error') return null

  return (
    <section aria-label="Foto de la comida" className="flex flex-col gap-2">
      <div className="relative overflow-hidden rounded-3xl bg-muro">
        <canvas
          ref={lienzo}
          role="img"
          aria-label="Foto guardada de esta comida"
          className="block h-auto max-h-[240px] w-full object-cover"
        />
        {fase === 'cargando' && (
          <p role="status" className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white">
            Cargando foto…
          </p>
        )}
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-xs font-medium text-ceniza">
          <Icon nombre="camara" tamano={14} />
          Foto ultracomprimida, solo visible para ti
        </span>
        <button
          type="button"
          disabled={quitando}
          onClick={() => void quitar()}
          className="min-h-11 rounded-full px-3 text-[13px] font-bold text-exceso disabled:opacity-50"
        >
          Quitar foto
        </button>
      </div>
      {fallo && (
        <Alerta titulo="No pudimos quitar la foto">
          La comida y la foto siguen como estaban. Revisa tu conexión y vuelve a intentarlo.
        </Alerta>
      )}
    </section>
  )
}
