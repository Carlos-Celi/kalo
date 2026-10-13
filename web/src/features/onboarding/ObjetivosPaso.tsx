import { useState } from 'react'
import { useNavigate } from 'react-router'
import { rutas } from '../../app/rutas'
import { useTitulo } from '../../app/useTitulo'
import { Button } from '../../components/ui/Button'
import { CampoTexto } from '../../components/ui/CampoTexto'
import { validarPeso, type Objetivo } from '../../domain/perfil'
import { pesoMetaSugerido } from '../../domain/plan'
import { ElegirObjetivo } from '../perfil/ElegirObjetivo'
import { aNumero, textoDePeso, useOnboarding } from './borrador'
import { MarcoOnboarding } from './MarcoOnboarding'

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
      <ElegirObjetivo valor={borrador.objetivo} onElegir={elegir} error={errores.objetivo} />
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
