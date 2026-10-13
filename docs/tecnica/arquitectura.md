# Arquitectura de la web

## Stack
React 19 · Vite 8 · TypeScript 6 (estricto) · React Router · Tailwind CSS 4 · Supabase (Auth + Postgres) · Vitest + Testing Library · oxlint.
Motivos en [ADR 0001](decisiones/0001-stack-web.md), [0002](decisiones/0002-datos-local-primero.md), [0003](decisiones/0003-autenticacion.md), [0004](decisiones/0004-plan-calculado-sin-ia.md) y [0005](decisiones/0005-ia-desde-el-navegador.md).

## Estructura de `web/src`

```
app/           arranque: rutas, router, AppShell (marco con navegación)
theme/         global.css: tokens de la marca y estilos base
components/
  ui/          piezas visuales sin conocimiento del dominio (Button, ProgressRing…)
  nav/         TabBar (móvil) y Sidebar (escritorio)
features/      una carpeta por pantalla o flujo (inicio/, registros/, progreso/, ia/…)
domain/        tipos, reglas de negocio y formato; sin React ni acceso a datos
data/          interfaces de repositorio y sus implementaciones (mock, supabase)
lib/           configuración y clientes externos (env, supabase)
test/          configuración de pruebas
```

### Dependencias entre capas
`features` → `components`, `domain`, `data` · `components` → `domain` (solo tipos) · `domain` → nada.
`domain` no importa React ni `data`: sus reglas son funciones puras y se prueban solas.

### Datos
Las pantallas no saben de dónde salen los datos: piden a un repositorio definido en `data/repositorios.ts`. `data/index.ts` es el único sitio donde se elige la implementación: Supabase si está configurado, y si no `mock.ts` (los datos de ejemplo del diseño). Ver [ADR 0002](decisiones/0002-datos-local-primero.md).

### Perfil y onboarding
`features/perfil/PerfilProvider` carga el perfil una vez iniciada la sesión y lo expone con `usePerfil()`. `RequierePlan` envía al onboarding (`/bienvenida`) a quien aún no tiene plan. Las respuestas del onboarding viven en memoria en `features/onboarding/OnboardingLayout` y se guardan de una vez al final; el cálculo de las metas es una función pura en `domain/plan.ts` ([ADR 0004](decisiones/0004-plan-calculado-sin-ia.md)).

### Registros
`features/registros/useRegistros` carga los registros de los últimos días y ofrece las acciones rápidas (agua, ejercicio, sueño); la pantalla se actualiza con lo que confirma el servidor. Los totales, el estado de cada anillo y la racha son funciones puras de `domain/registros.ts`. Las fechas son siempre el día local del usuario (`domain/fechas.ts`), nunca el instante UTC. Las gráficas de Progreso no leen registros sueltos: piden a la base de datos un total por día (`resumen_diario`).

### IA y recordatorios
La IA se llama desde el navegador con la clave del usuario, detrás de una interfaz común con tres implementaciones (`features/ia/proveedores/`); ver [ADR 0005](decisiones/0005-ia-desde-el-navegador.md). El asistente compone en cada consulta unas instrucciones con todo lo registrado (`domain/contextoAsistente.ts`) y guarda hasta tres chats de 20 mensajes en el dispositivo (`domain/chats.ts`, `features/ia/almacenChats.ts`); ver [ADR 0007](decisiones/0007-asistente-con-datos-completos-y-chats-locales.md).

Los recordatorios se guardan en el dispositivo y, con cuenta, se copian a Supabase. `AvisosRecordatorios` los entrega como notificaciones del navegador mientras la app está abierta y, si se activa el correo, una Edge Function programada los envía aunque esté cerrada ([ADR 0006](decisiones/0006-recordatorios-por-correo.md)).

### Configuración
`/ajustes` es un índice: cada dato se edita en su pantalla (`features/ajustes/`: perfil, medidas, objetivo y hábitos, metas) con `PaginaAjuste` como marco y `useGuardarAjuste` para guardar el plan. El onboarding solo se recorre la primera vez.

### Pantallas sin tab bar
Las pantallas de un solo propósito (alta manual, peso, cámara, análisis, proveedor de IA) usan `components/ui/PantallaFlujo` en lugar de `AppShell`: flecha de volver y, desde 640 px, tarjeta centrada de 720 px (1000 px con `ancha`) con el formulario repartido en columnas.

### Pantalla completa
Una ruta con `handle: { pantallaCompleta: true }` (el asistente) hace que `AppShell` retire márgenes y ancho máximo: el contenido ocupa toda la ventana, dejando sitio al tab bar en móvil.

### Sesión
`features/auth/AuthProvider` envuelve todas las rutas y expone el estado con `useAuth()`: `cargando`, `demo` (sin Supabase configurado), `anonimo` o `autenticado`. `RutaProtegida` redirige a `/login` cuando no hay sesión. Es solo navegación: quien protege los datos es RLS en la base de datos. Las llamadas a Supabase Auth están en `features/auth/acciones.ts`, que devuelve motivos de fallo propios en lugar de los mensajes del servidor.

## Diseño y tema
- Los valores visuales vienen de `design/*.dc.html` y se expresan como tokens en `theme/global.css` (`bg-kalo`, `text-tinta-3`, `rounded-tarjeta`…). No se escriben colores hexadecimales sueltos en los componentes.
- La tipografía se sirve desde el propio sitio (`@fontsource-variable/plus-jakarta-sans`): sin peticiones a terceros.
- Los iconos son los SVG del diseño, centralizados en `components/ui/Icon.tsx`.

## Responsive
El corte principal es **1024 px** (`lg:` en Tailwind); los formularios usan además **640 px** (`sm:`) para pasar de una a varias columnas, y el inicio de sesión **768 px** (`md:`) para mostrar el panel de marca.

| Ancho | Navegación | Contenido |
|---|---|---|
| < 640 px | Tab bar inferior fijo | Columna del diseño móvil, máx. 480 px |
| 640–1023 px | Tab bar inferior fijo | Columna de hasta 760 px; formularios y tarjetas de flujo en dos columnas |
| ≥ 1024 px | Barra lateral fija de 264 px | Hasta 1160 px, rejilla de 12 columnas |

El diseño solo define la vista de 390 px; la de escritorio reordena los mismos componentes, no crea otros nuevos. En Inicio: metas (7 col.) junto a siguiente paso (5 col.), los cuatro hábitos en una fila y la gráfica a todo el ancho.

## Convenciones
- Código, nombres de dominio y documentación en español; los nombres de componentes de interfaz genéricos siguen la convención habitual (`Button`, `Icon`).
- Rutas declaradas una sola vez en `app/rutas.ts`.
- Números y fechas siempre a través de `domain/formato.ts` (`1.190`, `1,6`, `6 h 45`).
- Accesibilidad: objetivos táctiles de al menos 44 px, foco visible, `aria-current` en la navegación, texto alternativo a todo lo que se comunica con gráficos, sin depender solo del color.
- Pruebas junto al código (`*.test.ts(x)`): reglas de dominio de forma unitaria y pantallas por lo que ve el usuario (roles y textos).

## Comandos (`web/`)
| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Comprobación de tipos y build de producción |
| `npm run typecheck` | Solo comprobación de tipos |
| `npm run lint` | oxlint |
| `npm test` | Pruebas una vez (`npm run test:watch` para modo continuo) |
