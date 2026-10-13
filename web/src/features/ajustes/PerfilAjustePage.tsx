import { useState } from 'react'
import { useTitulo } from '../../app/useTitulo'
import { CampoTexto } from '../../components/ui/CampoTexto'
import { GrupoChips } from '../../components/ui/GrupoChips'
import { LIMITES, validarEdad, validarNombre, type Sexo } from '../../domain/perfil'
import { numeroDeTexto } from '../../domain/formato'
import { usePerfil } from '../perfil/contexto'
import { opcionesSexo } from '../perfil/opciones'
import { PaginaAjuste } from './PaginaAjuste'
import { useGuardarAjuste } from './useGuardarAjuste'

/** Nombre, edad y sexo, sin pasar por el onboarding. */
export function PerfilAjustePage() {
  useTitulo('Tu perfil')
  const { perfil } = usePerfil()
  const { fase, guardar, editar } = useGuardarAjuste()
  const plan = perfil.plan
  const [nombre, setNombre] = useState(plan?.datos.nombre ?? '')
  const [edad, setEdad] = useState(String(plan?.datos.edad ?? ''))
  const [sexo, setSexo] = useState<Sexo | null>(plan?.datos.sexo ?? null)
  const [revisado, setRevisado] = useState(false)

  if (!plan) return null

  const errorNombre = revisado ? validarNombre(nombre) : null
  const errorEdad = revisado ? validarEdad(numeroDeTexto(edad)) : null

  function enviar() {
    setRevisado(true)
    if (!plan || validarNombre(nombre) || validarEdad(numeroDeTexto(edad)) || !sexo) return
    void guardar({
      ...plan,
      datos: { ...plan.datos, nombre: nombre.trim(), edad: numeroDeTexto(edad), sexo },
    })
  }

  return (
    <PaginaAjuste
      titulo="Tu perfil"
      descripcion="Lo básico que usamos para personalizar tu plan."
      fase={fase}
      mensajeGuardado="Perfil actualizado."
      onEnviar={enviar}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <CampoTexto
          id="nombre"
          etiqueta="Nombre"
          icono="persona"
          type="text"
          autoComplete="given-name"
          maxLength={LIMITES.nombre.max}
          valor={nombre}
          onCambio={(valor) => {
            setNombre(valor)
            editar()
          }}
          error={errorNombre}
        />
        <CampoTexto
          id="edad"
          etiqueta="Edad"
          icono="calendario"
          type="text"
          inputMode="numeric"
          maxLength={3}
          sufijo="años"
          valor={edad}
          onCambio={(valor) => {
            setEdad(valor.replace(/\D/g, ''))
            editar()
          }}
          error={errorEdad}
        />
      </div>
      <GrupoChips
        pregunta="Sexo"
        opciones={opcionesSexo}
        elegidas={sexo ? [sexo] : []}
        onElegir={(valor) => {
          setSexo(valor)
          editar()
        }}
        falta={revisado && !sexo}
      />
      <p className="rounded-boton bg-crema-suave px-3.5 py-3 text-xs leading-normal font-medium text-tinta-2">
        Tus metas diarias no cambian solas al editar tu perfil. Si quieres que se recalculen con estos
        datos, hazlo desde «Metas diarias».
      </p>
    </PaginaAjuste>
  )
}
