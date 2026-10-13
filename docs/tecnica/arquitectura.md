# Arquitectura de la web

## Stack
React 19 · Vite 8 · TypeScript 6 (estricto) · React Router · Tailwind CSS 4 · Vitest + Testing Library · oxlint.
Motivos en [ADR 0001](decisiones/0001-stack-web.md).

## Estructura de `web/src`

```
app/           arranque: rutas, router, AppShell (marco con navegación)
theme/         global.css: tokens de la marca y estilos base
components/
  ui/          piezas visuales sin conocimiento del dominio (Button, ProgressRing…)
  nav/         TabBar (móvil) y Sidebar (escritorio)
features/      una carpeta por pantalla o flujo (inicio/, pendiente/…)
domain/        tipos, reglas de negocio y formato; sin React ni acceso a datos
data/          interfaces de repositorio y sus implementaciones
test/          configuración de pruebas
```

### Dependencias entre capas
`features` → `components`, `domain`, `data` · `components` → `domain` (solo tipos) · `domain` → nada.
`domain` no importa React ni `data`: sus reglas son funciones puras y se prueban solas.

### Datos
Las pantallas no saben de dónde salen los datos: piden a un repositorio definido en `data/repositorios.ts`. `data/index.ts` es el único sitio donde se elige la implementación. Hoy es `mock.ts` (los datos de ejemplo del diseño); después será Supabase sin tocar las pantallas. Ver [ADR 0002](decisiones/0002-datos-local-primero.md).

## Diseño y tema
- Los valores visuales vienen de `design/*.dc.html` y se expresan como tokens en `theme/global.css` (`bg-kalo`, `text-tinta-3`, `rounded-tarjeta`…). No se escriben colores hexadecimales sueltos en los componentes.
- La tipografía se sirve desde el propio sitio (`@fontsource-variable/plus-jakarta-sans`): sin peticiones a terceros.
- Los iconos son los SVG del diseño, centralizados en `components/ui/Icon.tsx`.

## Responsive
Un único punto de corte: **1024 px** (`lg:` en Tailwind).

| Ancho | Navegación | Contenido |
|---|---|---|
| < 1024 px | Tab bar inferior fijo | Columna del diseño móvil, máx. 480 px centrada |
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
