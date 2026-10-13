import { createBrowserRouter, type RouteObject } from 'react-router'
import { InicioPage } from '../features/inicio/InicioPage'
import { PantallaPendiente } from '../features/pendiente/PantallaPendiente'
import { AppShell } from './AppShell'
import { rutas } from './rutas'

export const definicionRutas: RouteObject[] = [
  {
    element: <AppShell />,
    children: [
      { path: rutas.inicio, element: <InicioPage /> },
      {
        path: rutas.registros,
        element: <PantallaPendiente titulo="Registros" referencia="Registros.dc.html" />,
      },
      {
        path: rutas.registrosAgua,
        element: <PantallaPendiente titulo="Registros · Agua" referencia="RegistrosAgua.dc.html" />,
      },
      {
        path: rutas.registrosEjercicio,
        element: (
          <PantallaPendiente titulo="Registros · Ejercicio" referencia="RegistrosEjercicio.dc.html" />
        ),
      },
      {
        path: rutas.registrosSueno,
        element: <PantallaPendiente titulo="Registros · Sueño" referencia="RegistrosSueno.dc.html" />,
      },
      {
        path: rutas.camara,
        element: <PantallaPendiente titulo="Foto con IA" referencia="Camara.dc.html" />,
      },
      {
        path: rutas.registroRapido,
        element: <PantallaPendiente titulo="Registro rápido" referencia="Mas.dc.html" />,
      },
      {
        path: rutas.asistente,
        element: <PantallaPendiente titulo="Asistente" referencia="Asistente.dc.html" />,
      },
      {
        path: rutas.progreso,
        element: <PantallaPendiente titulo="Progreso" referencia="Progreso.dc.html" />,
      },
      {
        path: rutas.recordatorios,
        element: <PantallaPendiente titulo="Recordatorios" referencia="Recordatorios.dc.html" />,
      },
      {
        path: rutas.ajustes,
        element: <PantallaPendiente titulo="Configuración" referencia="Ajustes.dc.html" />,
      },
      { path: '*', element: <PantallaPendiente titulo="Página no encontrada" /> },
    ],
  },
  {
    path: rutas.login,
    element: (
      <main className="mx-auto w-full max-w-[480px] px-4 py-10">
        <PantallaPendiente titulo="Iniciar sesión" referencia="Login.dc.html" />
      </main>
    ),
  },
]

export const router = createBrowserRouter(definicionRutas)
