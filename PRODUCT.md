# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

La web (React + Vite) es la referencia visual; la app móvil en Flutter implementa las mismas pantallas, identidad y reglas de dominio.

## Users

Personas que entrenan (gym / fitness) y quieren controlar su alimentación con foco en **proteína y calorías**. Ya conocen o han usado apps de conteo (tipo MyFitnessPal) y registran varias veces al día desde el móvil, a menudo justo después de comer o entrenar.

## Product Purpose

Kalo registra comida (foto + IA o manual), agua, ejercicio, sueño y peso, y lo convierte en dos metas diarias claras: calorías y proteína. Un asistente que actúa como nutriólogo sugiere comidas con el contexto del día. Éxito: el usuario cierra el día dentro de su meta de calorías y llega a su meta de proteína, de forma constante.

## Positioning

Registro con foto e IA que estima kcal, proteína, azúcar y grasa, editable antes de guardar; dos metas principales (no veinte); asistente nutriólogo con las metas y el registro del día como contexto; en español; el usuario trae su propia API key (Anthropic, OpenAI o Google), que nunca pasa por servidores propios.

## Capabilities and Constraints

- Registro de comida (foto + IA, manual), agua (+250/+500/+750 ml), ejercicio (+10/+20/+30 min), sueño (±15 min), peso (±0,1 kg, IMC).
- Anillo diario: cumplido = ≥ meta (comida: 90–105 %); excedido solo en calorías (> 105 %).
- Asistente con aviso de que no sustituye consejo médico.
- Recordatorios, progreso con gráficas, ajustes, proveedor de IA configurable.
- Navegación: Inicio · Registros · (+) · Asistente · Progreso.
- Diseño de 390 px de ancho; en web desde 1024 px barra lateral y varias columnas.

## Brand Commitments

- Nombre **Kalo**. Mascota: llama (fuego) con lentes de sol (`assets/Kalo.png`, `assets/kalo-mascot-b.png`). Intocable.
- Familia de color naranja/rojo fuego se mantiene. Tipografía, composición y el resto del sistema visual pueden reinventarse (decisión del usuario, 2026-10-13).
- Lema actual: "Enciende tus hábitos."
- Idioma: español.

## Evidence on Hand

Solo la mascota y el diseño de referencia en `design/`. No hay testimonios, usuarios, cifras de uso ni prensa: no inventarlos.

## Product Principles

1. Dos números mandan: calorías y proteína siempre son lo primero que se ve.
2. Registrar debe costar segundos, no minutos.
3. La IA propone, el usuario decide: toda estimación es editable.
4. Constancia sobre perfección: rachas y progreso semanal, sin castigo.
5. Privacidad: la API key es del usuario y se queda en su dispositivo.

## Accessibility & Inclusion

Objetivos táctiles ≥ 44 px, texto ≥ 12 px, foco visible, etiquetas accesibles, no depender solo del color (cumplido / parcial / excedido con forma o símbolo además del color).
