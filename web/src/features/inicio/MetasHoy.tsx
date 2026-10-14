import { PanelMeta } from '../../components/ui/PanelMeta'
import type { Avance } from '../../domain/tipos'
import { mensajeCalorias, mensajeProteina } from './mensajes'

interface Props {
  calorias: Avance
  proteina: Avance
  className?: string
}

/** Las dos metas principales del día: calorías y proteína, cada una con su luz. */
export function MetasHoy({ calorias, proteina, className = '' }: Props) {
  return (
    <section
      aria-label="Metas principales de hoy"
      className={`grid gap-3 lg:grid-cols-2 ${className}`}
    >
      <PanelMeta
        nombre="Calorías"
        tono="calorias"
        unidad="kcal"
        avance={calorias}
        mensaje={mensajeCalorias(calorias)}
      />
      <PanelMeta
        nombre="Proteína"
        tono="proteina"
        unidad="g"
        avance={proteina}
        mensaje={mensajeProteina(proteina)}
      />
    </section>
  )
}
