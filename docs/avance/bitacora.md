# Bitácora de avance

Las entradas más recientes van arriba.

## 2026-10-12 · Web, entrega 1: base local e Inicio

**Hecho**
- Entorno local con Docker: servicio de desarrollo con recarga en caliente (`localhost:5173`) y servicio de vista previa con el build de producción detrás de nginx (`localhost:8080`).
- Carpeta `docs/` con hoja de ruta, bitácora, arquitectura, entorno local, seguridad y dos decisiones (ADR).
- Tema de la marca como tokens de Tailwind: colores, tipografía Plus Jakarta Sans autoalojada, radios y estilos globales del diseño (foco, pulsación, movimiento reducido).
- Componentes base: `Button`, `Chip`, `Badge`, `Icon`, `MascotAvatar`, `ProgressRing`, `ProgressBar`, `BarChart`.
- Navegación: tab bar en móvil y barra lateral en escritorio (desde 1024 px), con todas las rutas enlazadas.
- Pantalla **Inicio** completa con los datos de ejemplo del diseño: saludo, anillos de calorías y proteína, siguiente paso, cuatro hábitos y barras de 7 días. En escritorio se reordena en varias columnas.
- Reglas de dominio (estado del anillo, IMC) y formato numérico en español, con pruebas.
- Protección del repositorio: `.gitignore` de secretos, escaneo con gitleaks (hook local y CI), Dependabot y CI de la web.

**Verificado**
- Lint, comprobación de tipos, 17 pruebas y build en verde.
- Inicio revisada en el navegador a 390 px contra `design/Inicio.dc.html` y a 1440 px.
- Vista previa de producción: cabeceras de seguridad presentes, CSP sin infracciones, rutas profundas resueltas por el fallback de SPA, nginx sin privilegios de root.

**Diferencias deliberadas respecto al diseño**
- El margen superior de 52 px del diseño reserva la barra de estado del teléfono; en web se usa 20 px más el área segura del dispositivo.
- El tab bar ajusta su relleno inferior al área segura en lugar de los 20 px fijos.
- En escritorio la campana y la configuración pasan del encabezado a la barra lateral.

**Pendiente / siguiente**
- Entrega 2: Vercel y Supabase (login real, esquema con RLS).
- Los datos de Inicio son de ejemplo: todavía no hay persistencia.
- `zustand` no se añadió aún: no hay estado compartido que lo justifique; se incorporará con la persistencia.
