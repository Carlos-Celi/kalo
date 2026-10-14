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
- **La guía visual vigente es `docs/rediseno/guia.md`** («Sala de estudio»). `design/` conserva la estructura y el contenido de las pantallas, pero no su estilo (color, tipografía, componentes).
- Tipografía: Saira Condensed (600–800) para números de marcador y títulos; Onest para la interfaz.
- Colores (app oscura, sin modo claro): `sala` `#110C0A` (fondo) · `muro` `#1E1512`/`banco` `#2A1E19` (superficies) · `hueso` `#F3EEE8` (texto) · `ceniza` `#B8ABA2` (texto secundario) · `brasa` `#D13D0A` (solo acciones) · llama `#F97316` (calorías) · sol `#FFC933` (proteína) · agua `#6AAEF0` · ejercicio `#F0904A` · sueño `#D99A7C` · peso `#F2C46B` · exceso `#FF6A55`. Detalle y contrastes en la guía.
- La luz de sala (resplandor detrás de calorías y proteína) y la línea de avance son datos: el estado se lee por forma (sólida, discontinua, doble) y símbolo (✓, ½, !), no solo por color.
- Accesibilidad: objetivos táctiles ≥44 px, texto ≥12 px, foco visible, etiquetas accesibles, no depender solo del color.

## Navegación
Tab bar: Inicio · Registros · (+) acceso rápido · Asistente · Progreso. Ajustes y Recordatorios se abren desde Inicio. En escritorio, barra lateral con las mismas secciones y el botón "Registro rápido" justo debajo de Progreso.

## Mapa de pantallas (archivo → qué es)
- Marca/acceso/onboarding: `Main` (guía de marca, no es pantalla), `Login`, `Perfil` (nombre, edad, sexo), `Medidas` (estatura, peso), `Objetivos`, `Habitos`, `Metas` (plan generado con calorías y proteína).
- `Inicio`: saludo con Kalo, dos paneles de meta (calorías y proteína) con su luz y línea de avance, banda "Siguiente paso", resumen "Registros de hoy" (4 mosaicos que enlazan a su sección, sin botones de registro) y gráfica de 7 días. No lista las comidas del día.
- `Registros` (hub): selector de 4 secciones (Comida, Agua, Ejercicio, Sueño); semana con un anillo de progreso por día y símbolo (cumplido ✓ / parcial ½ / excedido !); detalle y registro inline por sección. `RegistrosAgua/Ejercicio/Sueno` son solo variantes con otra pestaña activa: no son pantallas aparte.
  - Comida: abre `Camara` (foto) → `Analisis` (resultado IA editable, guardar) o `Manual`.
  - Agua: +250/+500/+750 ml, deshacer. Ejercicio: +10/+20/+30 min, deshacer. Sueño: ajuste ±15 min.
- `Mas`: hoja "Registro rápido": Comida, Agua, Ejercicio, Sueño, Peso. `Peso`: stepper ±0,1 kg, IMC, meta, gráfica, nota, guardado con confirmación.
- `Asistente`: chat nutriólogo con sugerencias de comidas y botón "Registrar".
- `ProveedorIA`: proveedor (Anthropic/OpenAI/Google), API key (oculta/mostrar, guardar en almacenamiento seguro del dispositivo), modelo, probar conexión.
- `Progreso`: gráficas de calorías, proteína y peso. `Recordatorios`. `Ajustes` (incluye "Tu cuenta y tus datos": descargar mis datos, documentos legales y eliminar la cuenta).
- Legales (públicas, sin diseño en `design/`): `/privacidad`, `/terminos`, `/cookies`. Crear cuenta exige aceptar términos, privacidad y el tratamiento de datos de salud (ADR 0011).

## Reglas de dominio
- Estado diario (línea de avance): cumplido = ≥ meta (comida: entre 90 % y 105 % de la meta); excedido solo aplica a calorías (> 105 %, color de error con "!").
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
