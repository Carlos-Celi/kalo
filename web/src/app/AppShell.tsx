import { Outlet, useLocation, useMatches } from 'react-router'
import { Sidebar } from '../components/nav/Sidebar'
import { TabBar } from '../components/nav/TabBar'

/** Marca de una ruta que ocupa toda la pantalla (el asistente), sin márgenes ni ancho máximo. */
export interface ManejadorDeRuta {
  pantallaCompleta?: boolean
}

/**
 * Marco común de las pantallas con navegación.
 * Hasta 1023 px: columna móvil del diseño (390 px de referencia) y tab bar.
 * Desde 1024 px: barra lateral y contenido ancho.
 */
export function AppShell() {
  const { pathname } = useLocation()
  const completa = useMatches().some(
    (coincidencia) => (coincidencia.handle as ManejadorDeRuta | undefined)?.pantallaCompleta,
  )

  return (
    <div className="min-h-dvh bg-sala lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-30 focus:rounded-boton-sm focus:bg-hueso focus:px-4 focus:py-3 focus:font-bold focus:text-tinta"
      >
        Saltar al contenido
      </a>
      <Sidebar className="hidden lg:flex" />
      <main
        id="contenido"
        className={
          completa
            ? // Cubre la ventana: en móvil deja sitio al tab bar; en escritorio llega hasta abajo.
              'h-dvh w-full min-w-0 overflow-hidden pb-[calc(76px+env(safe-area-inset-bottom))] lg:pb-0'
            : 'mx-auto w-full max-w-[480px] px-4 pt-[max(20px,env(safe-area-inset-top))] pb-28 sm:max-w-[760px] sm:px-6 lg:max-w-[1160px] lg:px-10 lg:pt-9 lg:pb-12'
        }
      >
        {/*
          Cada pantalla entra con un fundido breve; la clave la reinicia al cambiar de ruta.
          Solo opacidad: un transform aquí capturaría a los descendientes `fixed` (la hoja).
        */}
        <div key={pathname} className="h-full animate-ruta">
          <Outlet />
        </div>
      </main>
      <TabBar className="lg:hidden" />
    </div>
  )
}
