import { Outlet } from 'react-router'
import { Sidebar } from '../components/nav/Sidebar'
import { TabBar } from '../components/nav/TabBar'

/**
 * Marco común de las pantallas con navegación.
 * Hasta 1023 px: columna móvil del diseño (390 px de referencia) y tab bar.
 * Desde 1024 px: barra lateral y contenido ancho.
 */
export function AppShell() {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[264px_minmax(0,1fr)]">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-30 focus:rounded-boton-sm focus:bg-white focus:px-4 focus:py-3 focus:font-bold"
      >
        Saltar al contenido
      </a>
      <Sidebar className="hidden lg:flex" />
      <main
        id="contenido"
        className="mx-auto w-full max-w-[480px] px-4 pt-[max(20px,env(safe-area-inset-top))] pb-28 lg:max-w-[1160px] lg:px-10 lg:pt-9 lg:pb-12"
      >
        <Outlet />
      </main>
      <TabBar className="lg:hidden" />
    </div>
  )
}
