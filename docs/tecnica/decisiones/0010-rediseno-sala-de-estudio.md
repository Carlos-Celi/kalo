# 0010 · Rediseño visual «Sala de estudio»

- Fecha: 2026-10-13
- Estado: implementada en la web (revisada en el navegador a 390 px y 1280 px); `mobile/` pendiente

## Contexto
El diseño de referencia (`design/`) es limpio y accesible, pero usa el lenguaje de toda la categoría: tarjetas blancas, anillos de progreso y un acento naranja. Sin la mascota no se distingue de otras apps de conteo. Calorías y proteína, las dos metas principales, aparecen a ~24 px dentro de anillos, compitiendo con mosaicos y gráfica, y la mascota solo sale como avatar de 40 px. El público objetivo pasa a ser gym y fitness, que pidió algo más llamativo, moderno y premium, con una referencia directa al gym.

Se exploraron tres tiradas de direcciones (pizarra del box, discos olímpicos, marcador de paletas, casete, señalética, pulsos, barra con moleteado, cuadrícula) y se eligió «Sala de estudio».

## Decisión
- **Mundo**: estudio de entrenamiento en penumbra cálida. Fondo `#110C0A`, superficies `#1E1512`/`#2A1E19` y texto `#F3EEE8`. La app es oscura, sin modo claro.
- **La luz es un dato**: el resplandor detrás de cada panel de meta escala con `valor / meta`; sin registro no hay luz, y con exceso se atenúa y se vuelve rojiza.
- **Estado por forma**: la línea de avance (riel de 1 px, marca de meta, avance de 3 px) y las barras distinguen cumplido, parcial y excedido por su forma y un símbolo, no solo por el color. Las reglas de dominio no cambian.
- **Tipografía**: Saira Condensed para números y títulos, Onest para la interfaz; se retira Plus Jakarta Sans.
- **Color**: se mantienen el naranja y la mascota. `#D13D0A` queda solo para acciones, `#F97316` para calorías y `#FFC933` para proteína. Los colores de agua, ejercicio, sueño, peso y error se aclaran para pasar el contraste sobre fondo oscuro.
- **Inicio**: dos paneles de meta, banda «Siguiente», resumen de registros y gráfica de 7 días. No muestra la lista de comidas del día.
- La guía vigente es `docs/rediseno/guia.md`; `design/` conserva la estructura de las pantallas, pero no su estilo.

## Consecuencias
- Cambian el tema (`web/src/theme/global.css`), las fuentes y la mayoría de los componentes visuales; las rutas, los datos y la lógica no cambian. Pasos en `docs/rediseno/implementacion.md`.
- Hay que actualizar la sección Identidad de `CLAUDE.md` al implementar.
- Faltan ilustraciones de la mascota (con pesas, con vaso, dormido); mientras tanto se usa la pose base con filtros por estado.
- Riesgo asumido: la estética oscura con luz se acerca a lo habitual en apps de fitness; se mitiga con la regla de que la luz siempre representa un dato.
- `mobile/` construirá su tema directamente con estos tokens.

## Implementación (web)
- Los nombres de token cambian (`crema`, `tinta-*`, `borde`, `kalo`… se retiran). Se migró con una tabla de equivalencias sobre todo `src`; ver `docs/rediseno/implementacion.md`.
- `ProgressRing` y `ProgressBar` se sustituyen por `PanelMeta`, `LuzSala` y `LineaAvance`.
- Colores de texto sobre los tonos de hábito claros (ejercicio, sueño): `tinta`, no blanco, para llegar a 4,5:1.
- Las pruebas del repositorio necesitan Node 24 (el de Docker); con Node 25 en el host, `localStorage` global choca con jsdom: `NODE_OPTIONS=--no-experimental-webstorage npm test`.
