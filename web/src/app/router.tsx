import { createBrowserRouter, Outlet, type RouteObject } from 'react-router'
import { AjustesPage } from '../features/ajustes/AjustesPage'
import { AuthProvider } from '../features/auth/AuthProvider'
import { LoginPage } from '../features/auth/LoginPage'
import { RestablecerPage } from '../features/auth/RestablecerPage'
import { RutaProtegida } from '../features/auth/RutaProtegida'
import { InicioPage } from '../features/inicio/InicioPage'
import { HabitosPaso } from '../features/onboarding/HabitosPaso'
import { MedidasPaso } from '../features/onboarding/MedidasPaso'
import { ObjetivosPaso } from '../features/onboarding/ObjetivosPaso'
import { OnboardingLayout } from '../features/onboarding/OnboardingLayout'
import { PerfilPaso } from '../features/onboarding/PerfilPaso'
import { PlanPaso } from '../features/onboarding/PlanPaso'
import { PantallaPendiente } from '../features/pendiente/PantallaPendiente'
import { PerfilProvider } from '../features/perfil/PerfilProvider'
import { RequierePlan } from '../features/perfil/RequierePlan'
import { AppShell } from './AppShell'
import { rutas } from './rutas'

const pantallasConNavegacion: RouteObject[] = [
  {
    element: (
      <RequierePlan>
        <AppShell />
      </RequierePlan>
    ),
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
      { path: rutas.ajustes, element: <AjustesPage /> },
      { path: '*', element: <PantallaPendiente titulo="Página no encontrada" /> },
    ],
  },
]

const onboarding: RouteObject = {
  path: rutas.bienvenida,
  element: <OnboardingLayout />,
  children: [
    { index: true, element: <PerfilPaso /> },
    { path: rutas.bienvenidaMedidas, element: <MedidasPaso /> },
    { path: rutas.bienvenidaObjetivos, element: <ObjetivosPaso /> },
    { path: rutas.bienvenidaHabitos, element: <HabitosPaso /> },
    { path: rutas.bienvenidaPlan, element: <PlanPaso /> },
  ],
}

const rutasDeLaApp: RouteObject[] = [
  {
    // Con sesión: se carga el perfil y, si aún no hay plan, se pasa por el onboarding.
    element: (
      <RutaProtegida>
        <PerfilProvider>
          <Outlet />
        </PerfilProvider>
      </RutaProtegida>
    ),
    children: [onboarding, ...pantallasConNavegacion],
  },
  { path: rutas.login, element: <LoginPage /> },
  { path: rutas.restablecer, element: <RestablecerPage /> },
]

/** Todas las rutas cuelgan del proveedor de sesión. */
export const definicionRutas: RouteObject[] = [
  {
    element: (
      <AuthProvider>
        <Outlet />
      </AuthProvider>
    ),
    children: rutasDeLaApp,
  },
]

export const router = createBrowserRouter(definicionRutas)
