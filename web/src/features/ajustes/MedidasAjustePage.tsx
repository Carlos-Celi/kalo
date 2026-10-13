import { useState } from 'react'
import { useTitulo } from '../../app/useTitulo'
import { Icon } from '../../components/ui/Icon'
import { CampoNumero } from '../../components/ui/CamposNumericos'
import { repositorios } from '../../data'
import { claveDia } from '../../domain/fechas'
import { formatoDecimal } from '../../domain/formato'
import { LIMITES } from '../../domain/perfil'
import { imc } from '../../domain/reglas'
import { usePerfil } from '../perfil/contexto'
import { PaginaAjuste } from './PaginaAjuste'
import { useGuardarAjuste } from './useGuardarAjuste'

/** Estatura, peso actual y peso meta. El peso queda también en el historial de hoy. */
export function MedidasAjustePage() {
  useTitulo('Medidas y peso')
  const { perfil } = usePerfil()
  const { fase, guardar, editar } = useGuardarAjuste()
  const plan = perfil.plan
  const [estaturaCm, setEstaturaCm] = useState(plan?.datos.estaturaCm ?? 170)
  const [pesoKg, setPesoKg] = useState(plan?.datos.pesoKg ?? 70)
  const [pesoMetaKg, setPesoMetaKg] = useState(plan?.datos.pesoMetaKg ?? 70)

  if (!plan) return null

  const indice = imc(pesoKg, estaturaCm)
  const diferencia = Math.round((pesoKg - pesoMetaKg) * 10) / 10
  const cambioPeso = pesoKg !== plan.datos.pesoKg

  function enviar() {
    if (!plan) return
    void guardar({ ...plan, datos: { ...plan.datos, estaturaCm, pesoKg, pesoMetaKg } }, async () => {
      if (!cambioPeso) return
      // Un cambio de peso también es un registro de hoy: así la gráfica de Progreso lo refleja.
      const hoy = claveDia(new Date())
      const [registrado] = (await repositorios.registros.obtenerPesos(hoy)).filter(
        (peso) => peso.fecha === hoy,
      )
      await repositorios.registros.guardarPeso({ fecha: hoy, kg: pesoKg, nota: registrado?.nota ?? '' })
    })
  }

  const cambiar = <T,>(poner: (valor: T) => void) => (valor: T) => {
    poner(valor)
    editar()
  }

  return (
    <PaginaAjuste
      titulo="Medidas y peso"
      descripcion="Estatura, peso actual y el peso al que quieres llegar."
      fase={fase}
      mensajeGuardado="Medidas actualizadas."
      onEnviar={enviar}
    >
      <div className="grid gap-5 md:grid-cols-3">
        <CampoNumero
          id="estatura"
          etiqueta="Estatura"
          unidad="cm"
          valor={estaturaCm}
          min={LIMITES.estaturaCm.min}
          max={LIMITES.estaturaCm.max}
          paso={1}
          onCambio={cambiar(setEstaturaCm)}
        />
        <CampoNumero
          id="peso"
          etiqueta="Peso actual"
          unidad="kg"
          valor={pesoKg}
          min={LIMITES.pesoKg.min}
          max={LIMITES.pesoKg.max}
          paso={0.1}
          decimales={1}
          onCambio={cambiar(setPesoKg)}
          ayuda="Al guardar, también queda como tu peso de hoy."
        />
        <CampoNumero
          id="peso-meta"
          etiqueta="Peso meta"
          unidad="kg"
          valor={pesoMetaKg}
          min={LIMITES.pesoKg.min}
          max={LIMITES.pesoKg.max}
          paso={0.1}
          decimales={1}
          onCambio={cambiar(setPesoMetaKg)}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex items-center gap-3 rounded-boton bg-crema p-3.5 text-[13px] font-semibold text-kalo-oscuro">
          <Icon nombre="pulso" tamano={18} className="shrink-0" />
          {indice !== null
            ? `Tu IMC estimado es ${formatoDecimal(indice)}. Lo usamos solo como referencia.`
            : 'Completa tus medidas para ver tu IMC.'}
        </div>
        <div className="flex items-center gap-3 rounded-boton bg-peso-fondo p-3.5 text-[13px] font-semibold text-peso-texto">
          <Icon nombre="diana" tamano={18} className="shrink-0" />
          {diferencia === 0
            ? 'Estás en tu peso meta.'
            : diferencia > 0
              ? `Te faltan ${formatoDecimal(diferencia)} kg para tu meta.`
              : `Estás ${formatoDecimal(-diferencia)} kg por debajo de tu meta.`}
        </div>
      </div>
    </PaginaAjuste>
  )
}
