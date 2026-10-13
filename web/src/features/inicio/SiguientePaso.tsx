import { rutas } from '../../app/rutas'
import { Button } from '../../components/ui/Button'
import { MascotAvatar } from '../../components/ui/MascotAvatar'
import { formatoEntero } from '../../domain/formato'
import { restante } from '../../domain/reglas'
import type { Avance, SiguientePaso as Paso } from '../../domain/tipos'

interface Props {
  paso: Paso
  proteina: Avance
  className?: string
}

/** Recomendación de la mascota para la próxima comida. */
export function SiguientePaso({ paso, proteina, className = '' }: Props) {
  const faltan = restante(proteina)
  return (
    <section
      aria-label="Siguiente paso"
      className={`flex flex-col gap-3 rounded-tarjeta bg-crema p-3.5 lg:justify-between lg:gap-5 lg:rounded-tarjeta-lg lg:p-6 ${className}`}
    >
      <div className="flex items-center gap-3 lg:flex-col lg:items-start lg:gap-4">
        <MascotAvatar tamano={40} className="lg:hidden" />
        <MascotAvatar tamano={64} className="hidden lg:block" />
        <div className="grow">
          <h2 className="text-xs font-bold text-kalo-oscuro lg:text-[13px]">
            Siguiente: {paso.comida}
          </h2>
          <p className="text-sm leading-[1.35] font-bold lg:mt-1 lg:text-lg">
            {faltan > 0 && `Te faltan ${formatoEntero(faltan)} g de proteína. `}
            {paso.mensaje}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button to={rutas.camara}>Registrar {paso.comida}</Button>
        <Button to={rutas.asistente} variante="secundario">
          Pedir una idea
        </Button>
      </div>
    </section>
  )
}
