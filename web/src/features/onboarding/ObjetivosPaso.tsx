import { useState } from 'react'
import { useNavigate } from 'react-router'
import { rutas } from '../../app/rutas'
import { useTitulo } from '../../app/useTitulo'
import { Button } from '../../components/ui/Button'
import { CampoTexto } from '../../components/ui/CampoTexto'
import { Icon, type NombreIcono } from '../../components/ui/Icon'
import { validarPeso, type Objetivo } from '../../domain/perfil'
import { pesoMetaSugerido } from '../../domain/plan'
import { aNumero, textoDePeso, useOnboarding } from './borrador'
import { MarcoOnboarding } from './MarcoOnboarding'

const objetivos: { valor: Objetivo; icono: NombreIcono; titulo: string; detalle: string }[] = [
  { valor: 'bajar', icono: 'llama', titulo: 'Bajar de peso', detalle: 'Déficit calórico moderado' },
  {
    valor: 'mantener',
    icono: 'pulso',
    titulo: 'Mantener mi peso',
    detalle: 'Equilibrar lo que como y gasto',
  },
  {
    valor: 'musculo',
    icono: 'pesa',
    titulo: 'Ganar masa muscular',
    detalle: 'Más proteína y entrenamiento',
  },
  {
    valor: 'sano',
    icono: 'hoja',
    titulo: 'Comer más sano',
    detalle: 'Mejor calidad, menos azúcar y grasa',
  },
]

/** Paso 3 del onboarding (design/Objetivos.dc.html). */
export function ObjetivosPaso() {
  useTitulo('Tu objetivo')
  const { borrador, cambiar } = useOnboarding()
  const navegar = useNavigate()
  const [errores, setErrores] = useState<{ objetivo?: string | null; pesoMeta?: string | null }>({})

  function elegir(objetivo: Objetivo) {
    // Cada objetivo propone su peso meta; el usuario puede corregirlo después.
    cambiar({ objetivo, pesoMeta: textoDePeso(pesoMetaSugerido(objetivo, borrador.pesoKg)) })
  }

  function continuar() {
    const nuevos = {
      objetivo: borrador.objetivo ? null : 'Elige tu objetivo principal.',
      pesoMeta: validarPeso(aNumero(borrador.pesoMeta)),
    }
    setErrores(nuevos)
    if (nuevos.objetivo || nuevos.pesoMeta) return
    void navegar(rutas.bienvenidaHabitos)
  }

  return (
    <MarcoOnboarding
      paso={3}
      volver={rutas.bienvenidaMedidas}
      titulo="¿Cuál es tu objetivo?"
      lema="Elige el principal. Ajustaremos tus calorías y metas."
      onEnviar={continuar}
      pie={
        <Button type="submit" tamano="xl">
          Continuar
        </Button>
      }
    >
      <fieldset
        aria-describedby={errores.objetivo ? 'objetivo-error' : undefined}
        className="flex flex-col gap-2.5"
      >
        <legend className="sr-only">Objetivo principal</legend>
        {objetivos.map(({ valor, icono, titulo, detalle }) => {
          const elegido = borrador.objetivo === valor
          return (
            <label
              key={valor}
              className={`flex cursor-pointer items-center gap-3 rounded-2xl p-3.5 has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-llama ${
                elegido ? 'border-[1.5px] border-llama bg-crema' : 'border border-borde bg-white'
              }`}
            >
              <input
                type="radio"
                name="objetivo"
                value={valor}
                checked={elegido}
                onChange={() => elegir(valor)}
                className="sr-only"
              />
              <span
                className={`flex size-11 shrink-0 items-center justify-center rounded-boton-sm ${
                  elegido ? 'bg-kalo text-white' : 'bg-crema text-kalo'
                }`}
              >
                <Icon nombre={icono} tamano={20} />
              </span>
              <span className="flex grow flex-col gap-0.5">
                <span className="text-[15px] font-bold">{titulo}</span>
                <span className="text-xs font-medium text-tinta-3">{detalle}</span>
              </span>
              <span
                aria-hidden="true"
                className={`flex size-[22px] shrink-0 items-center justify-center rounded-full ${
                  elegido ? 'bg-kalo text-white' : 'border-[1.5px] border-borde-fuerte bg-white'
                }`}
              >
                {elegido && <Icon nombre="check" tamano={14} grosor={3} />}
              </span>
            </label>
          )
        })}
        {errores.objetivo && (
          <p id="objetivo-error" className="text-xs font-semibold text-error">
            {errores.objetivo}
          </p>
        )}
      </fieldset>
      <CampoTexto
        id="peso-meta"
        etiqueta="Peso meta"
        icono="diana"
        type="text"
        inputMode="decimal"
        placeholder="Tu peso meta"
        maxLength={5}
        sufijo="kg"
        valor={borrador.pesoMeta}
        onCambio={(pesoMeta) => cambiar({ pesoMeta })}
        error={errores.pesoMeta}
      />
    </MarcoOnboarding>
  )
}
