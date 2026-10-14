import type { CSSProperties } from 'react'
import { useNavigate } from 'react-router'
import { rutas } from '../../app/rutas'
import { useTitulo } from '../../app/useTitulo'
import { Button } from '../../components/ui/Button'
import { formatoDecimal } from '../../domain/formato'
import { LIMITES, type Rango } from '../../domain/perfil'
import { imc } from '../../domain/reglas'
import { useOnboarding } from './borrador'
import { MarcoOnboarding, Nota } from './MarcoOnboarding'

interface DeslizadorProps {
  id: string
  etiqueta: string
  unidad: string
  rango: Rango
  valor: number
  onCambio: (valor: number) => void
}

function Deslizador({ id, etiqueta, unidad, rango, valor, onCambio }: DeslizadorProps) {
  return (
    <div className="flex flex-col gap-2.5 rounded-[20px] border border-filo bg-muro p-[18px]">
      <label htmlFor={id} className="text-[13px] font-semibold text-ceniza">
        {etiqueta}
      </label>
      <div aria-hidden="true" className="flex items-baseline gap-1.5 text-llama">
        <span className="num-marcador text-[56px] leading-none font-extrabold">{valor}</span>
        <span className="text-base font-semibold text-ceniza">{unidad}</span>
      </div>
      <input
        id={id}
        type="range"
        min={rango.min}
        max={rango.max}
        step={1}
        value={valor}
        aria-valuetext={`${valor} ${unidad}`}
        onChange={(evento) => onCambio(Number(evento.target.value))}
        className="deslizador h-7 w-full"
        style={{ '--relleno': `${((valor - rango.min) / (rango.max - rango.min)) * 100}%` } as CSSProperties}
      />
      <div aria-hidden="true" className="flex justify-between text-xs font-semibold text-ceniza">
        <span>
          {rango.min} {unidad}
        </span>
        <span>
          {rango.max} {unidad}
        </span>
      </div>
    </div>
  )
}

/** Paso 2 del onboarding (design/Medidas.dc.html). */
export function MedidasPaso() {
  useTitulo('Tus medidas')
  const { borrador, cambiar } = useOnboarding()
  const navegar = useNavigate()
  const indice = imc(borrador.pesoKg, borrador.estaturaCm)

  return (
    <MarcoOnboarding
      paso={2}
      volver={rutas.bienvenida}
      titulo="¿Cuánto mides y pesas?"
      lema="Desliza para ajustar. Podrás editarlo cuando quieras."
      onEnviar={() => void navegar(rutas.bienvenidaObjetivos)}
      pie={
        <Button type="submit" tamano="xl">
          Continuar
        </Button>
      }
    >
      <div className="grid gap-5 sm:grid-cols-2">
      <Deslizador
        id="estatura"
        etiqueta="Estatura"
        unidad="cm"
        rango={LIMITES.estaturaCm}
        valor={borrador.estaturaCm}
        onCambio={(estaturaCm) => cambiar({ estaturaCm })}
      />
      <Deslizador
        id="peso"
        etiqueta="Peso actual"
        unidad="kg"
        rango={LIMITES.pesoKg}
        valor={borrador.pesoKg}
        onCambio={(pesoKg) => cambiar({ pesoKg })}
      />
      </div>
      {indice !== null && (
        <Nota icono="pulso">
          Tu IMC estimado es {formatoDecimal(indice)}. Lo usamos solo como referencia.
        </Nota>
      )}
    </MarcoOnboarding>
  )
}
