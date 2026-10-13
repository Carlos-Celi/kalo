# 0001 · Stack de la web

- Fecha: 2026-10-12
- Estado: aceptada

## Contexto
Kalo tendrá app móvil en Flutter y una web que debe verse bien en laptop y en móvil. La web se desplegará en Vercel. El diseño de referencia son pantallas HTML de 390 px con estilos en línea.

## Decisión
- **React + Vite + TypeScript** como aplicación de una sola página (SPA). Se descartó Next.js: la web no necesita renderizado en servidor ni rutas de API propias, y una SPA estática es más simple de desplegar y de proteger.
- **React Router** para las rutas.
- **Tailwind CSS 4** con los colores, radios y tipografía del diseño como tokens. Permite trasladar los estilos en línea del diseño casi uno a uno y resolver el responsive con un prefijo.
- **Fuente autoalojada** en lugar de Google Fonts: sin peticiones a terceros y con una CSP más estricta.
- **Vitest + Testing Library** para pruebas; **oxlint** para lint (viene con la plantilla).
- **Docker** para el entorno local: desarrollo y una vista previa equivalente a producción.

## Consecuencias
- Vercel sirve archivos estáticos; hace falta una regla de reescritura para las rutas de la SPA.
- No hay servidor propio: lo que requiera secreto (por ejemplo, operaciones privilegiadas sobre la base de datos) deberá resolverse con reglas en Supabase o con funciones del lado servidor, nunca en el cliente.
- Web y móvil no comparten código; comparten la especificación (`CLAUDE.md`) y el diseño.
