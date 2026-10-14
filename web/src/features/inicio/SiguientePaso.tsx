import { Link } from 'react-router'
import { rutas } from '../../app/rutas'
import { Button } from '../../components/ui/Button'
import { formatoEntero } from '../../domain/formato'
import { restante } from '../../domain/reglas'
import type { Avance, SiguientePaso as Paso } from '../../domain/tipos'

interface Props {
  paso: Paso
  proteina: Avance
  className?: string
}

/** Banda clara con la próxima comida y la acción principal de Inicio. */
export function SiguientePaso({ paso, proteina, className = '' }: Props) {
  const faltan = restante(proteina)
  return (
    <section
      aria-label="Siguiente paso"
      className={`flex items-center gap-3 rounded-tarjeta bg-hueso p-3 pl-4 text-tinta ${className}`}
    >
      <div className="min-w-0 grow">
        <h2 className="text-[15px] leading-tight font-bold">Siguiente: {paso.comida}</h2>
        <p className="mt-0.5 text-[13px] leading-snug text-tinta-2">
          {faltan > 0 && `Te faltan ${formatoEntero(faltan)} g de proteína. `}
          {paso.mensaje}
        </p>
        <Link
          to={rutas.asistente}
          className="-mb-2 mt-1 inline-flex min-h-11 items-center text-[13px] font-bold text-brasa underline"
        >
          Pedir una idea
        </Link>
      </div>
      <Button to={rutas.camara} tamano="lg" className="shrink-0">
        Registrar<span className="sr-only"> {paso.comida}</span>
      </Button>
    </section>
  )
}
