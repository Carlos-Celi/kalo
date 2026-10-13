import { useState } from 'react'
import { useNavigate } from 'react-router'
import { rutas } from '../../app/rutas'
import { useTitulo } from '../../app/useTitulo'
import { Button } from '../../components/ui/Button'
import { CampoTexto } from '../../components/ui/CampoTexto'
import { Chip } from '../../components/ui/Chip'
import { LIMITES, validarEdad, validarNombre, type Sexo } from '../../domain/perfil'
import { cerrarSesion } from '../auth/acciones'
import { aNumero, useOnboarding } from './borrador'
import { MarcoOnboarding, Nota } from './MarcoOnboarding'

const sexos: { valor: Sexo; etiqueta: string }[] = [
  { valor: 'femenino', etiqueta: 'Femenino' },
  { valor: 'masculino', etiqueta: 'Masculino' },
  { valor: 'sin-especificar', etiqueta: 'Prefiero no decir' },
]

interface Errores {
  nombre?: string | null
  edad?: string | null
  sexo?: string | null
}

/** Paso 1 del onboarding (design/Perfil.dc.html). */
export function PerfilPaso() {
  useTitulo('Tu perfil')
  const { borrador, cambiar, rehaciendo } = useOnboarding()
  const navegar = useNavigate()
  const [errores, setErrores] = useState<Errores>({})

  function continuar() {
    const nuevos: Errores = {
      nombre: validarNombre(borrador.nombre),
      edad: validarEdad(aNumero(borrador.edad)),
      sexo: borrador.sexo ? null : 'Elige una opción.',
    }
    setErrores(nuevos)
    if (nuevos.nombre || nuevos.edad || nuevos.sexo) return
    void navegar(rutas.bienvenidaMedidas)
  }

  return (
    <MarcoOnboarding
      paso={1}
      // Con sesión no se puede volver al login: la salida es cerrarla.
      volver={
        rehaciendo
          ? rutas.ajustes
          : { etiqueta: 'Cerrar sesión y volver', accion: () => void cerrarSesion() }
      }
      titulo="¿Cómo te llamas?"
      lema="Cuéntanos lo básico para personalizar tu plan."
      onEnviar={continuar}
      pie={
        <Button type="submit" tamano="xl">
          Continuar
        </Button>
      }
    >
      <CampoTexto
        id="nombre"
        etiqueta="Nombre"
        icono="persona"
        type="text"
        autoComplete="given-name"
        placeholder="Tu nombre"
        maxLength={LIMITES.nombre.max}
        valor={borrador.nombre}
        onCambio={(nombre) => cambiar({ nombre })}
        error={errores.nombre}
      />
      <CampoTexto
        id="edad"
        etiqueta="Edad"
        icono="calendario"
        type="text"
        inputMode="numeric"
        placeholder="Años"
        maxLength={3}
        valor={borrador.edad}
        onCambio={(edad) => cambiar({ edad: edad.replace(/\D/g, '') })}
        error={errores.edad}
      />
      <div className="flex flex-col gap-2.5">
        <div id="sexo-etiqueta" className="text-[13px] font-semibold">
          Sexo
        </div>
        <div
          role="group"
          aria-labelledby="sexo-etiqueta"
          aria-describedby={errores.sexo ? 'sexo-error' : undefined}
          className="flex flex-wrap gap-2"
        >
          {sexos.map(({ valor, etiqueta }) => (
            <Chip
              key={valor}
              tono="crema"
              seleccionado={borrador.sexo === valor}
              onClick={() => cambiar({ sexo: valor })}
            >
              {etiqueta}
            </Chip>
          ))}
        </div>
        {errores.sexo && (
          <p id="sexo-error" className="text-xs font-semibold text-error">
            {errores.sexo}
          </p>
        )}
      </div>
      <Nota icono="escudo">Tus datos solo se usan para calcular tus metas diarias.</Nota>
    </MarcoOnboarding>
  )
}
