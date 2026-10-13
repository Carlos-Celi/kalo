# 0002 · Datos: primero local, después Supabase

- Fecha: 2026-10-12
- Estado: aceptada

## Contexto
La primera entrega de la web debe poder probarse en local sin cuentas ni servicios externos. Más adelante habrá cuentas de usuario y datos compartidos entre la web y la app móvil.

## Decisión
- Las pantallas acceden a los datos solo a través de interfaces de repositorio (`web/src/data/repositorios.ts`).
- En la entrega 1 la implementación devuelve los datos de ejemplo del diseño (`mock.ts`).
- En la entrega 2 se añade **Supabase** (autenticación y Postgres con RLS) como implementación real. Se eligió frente a un backend propio porque Vercel solo sirve el frontend y Supabase aporta autenticación y control de acceso por fila sin mantener un servidor.
- La configuración de cada despliegue (URL, claves) vive en variables de entorno fuera de git.

## Consecuencias
- Cambiar de origen de datos no obliga a tocar las pantallas, solo `web/src/data/index.ts`.
- Hasta la entrega 2 no hay persistencia: lo que se ve en Inicio es fijo.
- El esquema de la base de datos se versionará como migraciones SQL en `supabase/`, de modo que la app móvil use exactamente el mismo.
