# Kalo — app de nutrición y hábitos (con IA), móvil y web

Eres el desarrollador de Kalo. La carpeta `design/` contiene el diseño de referencia: un HTML por pantalla (`*.dc.html`, estilos en línea, datos de ejemplo). `design/canvas.json` solo indica la posición de cada pantalla en el lienzo. Reproduce fielmente el diseño; no copies el HTML tal cual: impleméntalo en el stack de cada cliente (ver "Stack").

## Estructura del repositorio
- `design/` — diseño de referencia (solo lectura). `assets/` — mascota/logo.
- `mobile/` — app móvil en Flutter (iOS y Android).
- `web/` — app web en React + Vite + TypeScript.
- `docs/` — documentación: `avance/` (hoja de ruta y bitácora) y `tecnica/` (arquitectura, entorno local, despliegue, seguridad, decisiones).
- `supabase/` — configuración local y migraciones SQL del esquema (compartido por web y móvil).

## Stack
- Móvil: Flutter (Dart), en `mobile/`.
- Web: React + Vite + TypeScript + Tailwind, en `web/`. Responsive: el diseño es de 390 px de ancho; en móvil se reproduce tal cual y desde 1024 px se usa barra lateral y varias columnas (no se estira la vista móvil). Detalle en `docs/tecnica/arquitectura.md`.
- Ambos clientes implementan las mismas pantallas, identidad y reglas de dominio de este documento.

## Forma de trabajo
- Idioma: español en código de dominio, commits y documentación.
- Local con Docker: `docker compose up web` (desarrollo, puerto 5173) y `docker compose --profile preview up --build web-preview` (build de producción, puerto 8080). Ver `docs/tecnica/entorno-local.md`.
- Antes de dar algo por terminado en `web/`: `npm run lint`, `npm run typecheck`, `npm test` y `npm run build`.
- Cada entrega añade una entrada a `docs/avance/bitacora.md` y actualiza `docs/avance/hoja-de-ruta.md`. Las decisiones técnicas relevantes se registran como ADR en `docs/tecnica/decisiones/`.
- Datos y cuentas: Supabase (Auth + Postgres). Toda tabla nueva lleva RLS, sin permisos para `anon` y con los permisos mínimos para `authenticated`; los cambios de esquema van como migración en `supabase/migrations/`. En local: `supabase start`.
- Seguridad (`docs/tecnica/seguridad.md`): el repositorio es público. Ningún secreto en git ni en variables `VITE_*`; la configuración del despliegue personal (Vercel, Supabase) vive fuera del repositorio (`docs/tecnica/despliegue.md`).

## Producto
Registro de comida (foto + IA o manual), agua, ejercicio, sueño y peso. Dos metas principales: **calorías y proteína**. Asistente que actúa como nutriólogo. Recordatorios, gráficas de progreso, ajustes editables.

## Identidad
- Nombre: **Kalo**. Mascota/logo: llama con lentes de sol. `assets/Kalo.png` es la llama sin fondo (avatares circulares e ilustraciones); `assets/kalo-mascot-b.png` es el ícono cuadrado a sangre con esquinas redondeadas (logotipo, favicon, notificaciones); `assets/kalo-mascot.png` es el ícono original con márgenes blancos (conservado como fuente).
- Tipografía: Plus Jakarta Sans (400–800).
- Colores: primario `#D13D0A` (botones, activo) · llama `#F97316` · sol `#FFC933` (proteína) · brasa `#A92408`/`#9A2E06` · crema `#FFF0E3`, `#FFF8F2` · bordes `#F2E4DA` · texto `#2B1810` · texto secundario `#7A6458`/`#5A4337` · agua `#2F80D8` (`#1A5FA8` si lleva texto blanco) · ejercicio `#E8772E`/`#A04B12` · sueño `#7C2D12` · error/exceso `#B42318` · peso (tarjeta) `#FFF4CC`/`#8A5200`.
- Accesibilidad: objetivos táctiles ≥44 px, texto ≥12 px, foco visible, etiquetas accesibles, no depender solo del color.

## Navegación
Tab bar: Inicio · Registros · (+) acceso rápido · Asistente · Progreso. Ajustes y Recordatorios se abren desde Inicio.

## Mapa de pantallas (archivo → qué es)
- Marca/acceso/onboarding: `Main` (guía de marca, no es pantalla), `Login`, `Perfil` (nombre, edad, sexo), `Medidas` (estatura, peso), `Objetivos`, `Habitos`, `Metas` (plan generado con calorías y proteína).
- `Inicio`: saludo, dos anillos (calorías y proteína), tarjeta "Siguiente paso", 4 mosaicos de hábitos, barras de 7 días.
- `Registros` (hub): selector de 4 secciones (Comida, Agua, Ejercicio, Sueño); anillos semanales por día (cumplido / parcial / excedido); detalle y registro inline por sección. `RegistrosAgua/Ejercicio/Sueno` son solo variantes con otra pestaña activa: no son pantallas aparte.
  - Comida: abre `Camara` (foto) → `Analisis` (resultado IA editable, guardar) o `Manual`.
  - Agua: +250/+500/+750 ml, deshacer. Ejercicio: +10/+20/+30 min, deshacer. Sueño: ajuste ±15 min.
- `Mas`: hoja "Registro rápido": Comida, Agua, Ejercicio, Sueño, Peso. `Peso`: stepper ±0,1 kg, IMC, meta, gráfica, nota, guardado con confirmación.
- `Asistente`: chat nutriólogo con sugerencias de comidas y botón "Registrar".
- `ProveedorIA`: proveedor (Anthropic/OpenAI/Google), API key (oculta/mostrar, guardar en almacenamiento seguro del dispositivo), modelo, probar conexión.
- `Progreso`: gráficas de calorías, proteína y peso. `Recordatorios`. `Ajustes`.

## Reglas de dominio
- Anillo diario: cumplido = ≥ meta (comida: entre 90 % y 105 % de la meta); excedido solo aplica a calorías (> 105 %, color de error con "!").
- Metas por defecto de ejemplo: 1.850 kcal, 140 g proteína, 2,5 L agua, 60 min ejercicio, 8 h sueño, peso meta 72 kg, estatura 172 cm. IMC = kg / m².
- Todos los números del diseño son datos de ejemplo: sustituir por datos reales del usuario.

## IA
- Foto de comida → estimar kcal, proteína, azúcar y grasa con el proveedor/modelo configurado; el usuario puede corregir antes de guardar. Etiquetar entradas de IA con la insignia "IA" y las de licor con "Licor".
- Asistente: prompt de sistema de nutriólogo; usar las metas y el registro del día como contexto; incluir aviso de que no sustituye consejo médico.
- La API key del usuario nunca se registra en logs ni se envía a servidores propios.

## Plan de trabajo sugerido
1. Proyecto Expo + tema (colores, tipografía, componentes: Botón, Chip, Anillo, Barra, TabBar, Hoja).
2. Navegación y pantallas estáticas con datos mock.
3. Estado y persistencia (comidas, agua, ejercicio, sueño, peso, metas).
4. Anillos semanales y gráficas a partir de datos reales.
5. Cámara + análisis con IA; ProveedorIA; Asistente.
6. Recordatorios (notificaciones locales), Ajustes, pruebas y pulido de accesibilidad.
