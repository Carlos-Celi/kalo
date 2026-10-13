import { useState } from 'react'
import { useTitulo } from '../../app/useTitulo'
import { Button } from '../../components/ui/Button'
import { Icon } from '../../components/ui/Icon'
import { cerrarSesion } from '../auth/acciones'
import { useAuth } from '../auth/contexto'

/**
 * Configuración. Por ahora solo la cuenta; el resto de ajustes del diseño
 * (design/Ajustes.dc.html) llega en una entrega posterior.
 */
export function AjustesPage() {
  useTitulo('Configuración')
  const auth = useAuth()
  const [saliendo, setSaliendo] = useState(false)

  async function salir() {
    setSaliendo(true)
    await cerrarSesion().catch(() => undefined)
    setSaliendo(false)
  }

  return (
    <div className="flex flex-col gap-3.5 lg:max-w-[560px] lg:gap-5">
      <h1 className="text-2xl font-extrabold tracking-[-0.5px] lg:text-[32px]">Configuración</h1>

      <section
        aria-labelledby="cuenta"
        className="flex flex-col gap-3 rounded-tarjeta border border-borde p-4 lg:p-6"
      >
        <h2 id="cuenta" className="text-[15px] font-extrabold">
          Cuenta
        </h2>
        {auth.fase === 'autenticado' ? (
          <>
            <p className="text-sm font-medium break-all text-tinta-2">{auth.usuario.correo}</p>
            <Button variante="suave" onClick={() => void salir()} disabled={saliendo} className="gap-2">
              <Icon nombre="salir" tamano={18} />
              {saliendo ? 'Cerrando sesión…' : 'Cerrar sesión'}
            </Button>
          </>
        ) : (
          <p className="text-sm font-medium text-tinta-3">
            Modo demostración: no hay ninguna cuenta iniciada.
          </p>
        )}
      </section>

      <p className="text-sm font-medium text-tinta-3">
        El resto de ajustes todavía está en construcción.
      </p>
    </div>
  )
}
