# Guía del rediseño «Sala de estudio»

Kalo se ve como un estudio de entrenamiento en penumbra. Calorías y proteína aparecen en números de marcador y, detrás de cada uno, una luz cálida crece con el avance real hacia la meta. La llama de Kalo es la fuente de esa luz.

Esta guía sustituye la identidad visual de `CLAUDE.md` (sección «Identidad») y del diseño de referencia en `design/` en todo lo visual: color, tipografía, componentes y composición. **No cambian**: el nombre, la mascota, la navegación, el mapa de pantallas, las reglas de dominio, las metas por defecto ni las reglas de IA.

Pantallas de referencia: [`pantallas/`](pantallas/) (capturas PNG y [`propuesta.html`](pantallas/propuesta.html), que se abre en el navegador e incluye un Inicio interactivo).

---

## 1. Principios

1. **Dos números mandan.** Calorías y proteína son lo primero que se ve en Inicio y siempre van a tamaño de marcador.
2. **La luz es un dato.** El resplandor solo existe para mostrar avance. Si no hay registro, no hay luz. Nunca se usa como adorno.
3. **El estado se lee por forma.** Cumplido, parcial y excedido se distinguen por la forma de la línea o de la barra y por un símbolo (✓, ½, !). El color refuerza, no decide.
4. **La brasa es para actuar.** El rojo `brasa` solo se usa en la acción principal de cada pantalla.
5. **Kalo es protagonista.** La mascota brilla según el avance y aparece grande en el acceso, no solo como avatar.
6. **Controles estándar.** El mundo aporta color, tipografía, densidad y la luz. Botones, pestañas, campos y navegación son los de siempre.

## 2. Color

La app es oscura de forma intencional (una sola apariencia; no hay modo claro). Los fondos son casi negros cálidos, nunca gris neutro.

### Superficies y texto

| Token | Hex | Uso |
|---|---|---|
| `sala` | `#110C0A` | Fondo de la app |
| `muro` | `#1E1512` | Paneles, mosaicos, filas, campos |
| `banco` | `#2A1E19` | Superficie sobre `muro` (sugerencias del asistente, botones del stepper) |
| `filo` | `#4A3A33` | Bordes de 1 px, riel de las líneas de avance |
| `divisor` | `#2A1E19` | Separadores entre secciones |
| `hueso` | `#F3EEE8` | Texto principal; fondo de la banda «Siguiente» y del segmento activo |
| `ceniza` | `#B8ABA2` | Texto secundario (8,7:1 sobre `sala`, 7,2:1 sobre `banco`) |
| `ceniza-2` | `#8E8078` | Texto terciario: pestañas inactivas, placeholders (5,1:1 sobre `sala`, 4,7:1 sobre `muro`; no usar sobre `banco`) |
| `tinta` | `#110C0A` | Texto sobre `hueso` |
| `tinta-2` | `#5A4337` | Texto secundario sobre `hueso` |

### Marca y datos

| Token | Hex | Uso |
|---|---|---|
| `brasa` | `#D13D0A` | Botón primario, (+) del tab bar. Texto blanco encima (4,8:1). |
| `brasa-hover` | `#B5340A` | Hover y pulsado del primario (oscurece, no aclara) |
| `llama` | `#F97316` | Calorías: número, avance, barras, luz. Pestaña activa. |
| `sol` | `#FFC933` | Proteína: número, avance, barras, luz |
| `agua` | `#6AAEF0` | Agua (versión aclarada de `#2F80D8`) |
| `ejercicio` | `#F0904A` | Ejercicio (aclarada de `#E8772E`) |
| `sueno` | `#D99A7C` | Sueño (aclarada de `#7C2D12`, ilegible sobre oscuro) |
| `peso` | `#F2C46B` | Peso (aclarada de `#8A5200`) |
| `exceso` | `#FF6A55` | Excedido y errores (aclarada de `#B42318`). Siempre con «!» o texto. |

Los colores de hábito se aclararon y pasan de 6,8:1 en adelante sobre `muro` y `banco`. Los originales de `CLAUDE.md` no se usan sobre fondo oscuro.

### Reglas de color

- Una pantalla tiene **un** botón `brasa` como acción principal. Las secundarias van en `hueso` (fondo claro) o fantasma (borde `filo`).
- Color plano. El único degradado permitido es la luz de sala (sección 5).
- Sin sombras de color decorativas. La única sombra con color es la luz y el resaltado de «registro nuevo», y las dos son dato.

## 3. Tipografía

| Rol | Familia | Pesos | Uso |
|---|---|---|---|
| Marcador | **Saira Condensed** | 600, 700, 800 | Todo número de dato, títulos de pantalla y de sección en mayúsculas |
| Interfaz | **Onest** | 400–700 | Texto, etiquetas, botones, campos |

Plus Jakarta Sans se retira.

### Escala

| Nombre | Tamaño / interlineado | Familia y peso | Ejemplo |
|---|---|---|---|
| Marcador XL | 88 px / 0,86 (76 px bajo 560 px de ancho) | Saira 800 | `1.190` en Inicio |
| Marcador L | 72 px / 0,9 | Saira 800 | `620` en Análisis |
| Marcador M | 44 px / 1 | Saira 800 | Cifra principal de cada gráfica de Progreso |
| Título de pantalla | 40 px / 0,9, mayúsculas | Saira 800 | `REGISTROS` |
| Dato | 24–26 px / 1,05 | Saira 700 | `35 min` en un mosaico |
| Título de sección | 22 px, mayúsculas, +0,01em | Saira 700 | `REGISTROS DE HOY` |
| Unidad junto a un número | 28 px (XL), 15 px (dato) | Saira 700, color `ceniza` | `kcal`, `g`, `L` |
| Cuerpo | 15–16 px / 1,5 | Onest 400–600 | Mensajes, descripciones |
| Etiqueta | 13 px | Onest 600, `ceniza` | `Calorías`, `meta 1.850` |
| Nota | 12 px (mínimo) | Onest 500–600 | `faltan 0,9 L`, leyendas |

- Números siempre con `font-variant-numeric: tabular-nums`.
- Separador de miles con punto (`1.850`) y decimales con coma (`1,6 L`), como ya hace `domain/formato.ts`.
- Las mayúsculas solo van en títulos de marcador. Las etiquetas pequeñas van en tipo oración.

## 4. Espacio, forma y elevación

- **Margen lateral** móvil: 18 px. **Separación** entre bloques: 12 px; dentro de una rejilla de mosaicos: 6 px; entre secciones con título: 18 px por encima.
- **Radios**: paneles y banda 16 px; mosaicos, filas, campos y botones 12 px; chips 999 px; segmento activo 9 px dentro de un contenedor de 12 px.
- **Líneas finas** siempre de 1 px exacto (riel, marca de meta, divisores, bordes).
- **Elevación**: los paneles no llevan sombra ni borde; se separan del fondo por el tono (`muro` sobre `sala`). El tab bar es `#0A0706` al 92 % con desenfoque de 14 px.
- **Objetivos táctiles** ≥ 44 px: botones de 46 px de alto, chips de 44 px, botones de icono de 44 × 44.

## 5. La luz de sala

Cada panel de meta (calorías, proteína) lleva detrás un resplandor radial que crece con el avance.

```
p = min(valor / meta, 1)                 // avance de 0 a 1
escala   = 0.35 + p × 0.75               // tamaño del resplandor
opacidad = 0.12 + p × 0.88
```

- **Forma**: elipse radial (de `tono` a transparente) de 150 % del ancho del panel, centrada abajo (−40 %) y recortada por el panel.
- **Tono**: calorías `rgba(249,115,22,.5)`; proteína `rgba(255,201,51,.32)`.
- **Sin registro** (`valor = 0`): sin luz.
- **Excedido** (solo calorías, > 105 %): `p` fijo en 0,45 y tono `rgba(255,106,85,.28)`. La sala se atenúa.
- **Transición**: 1,1 s, `cubic-bezier(.16, 1, .3, 1)`, solo `transform` y `opacity`. Con «reducir movimiento», sin transición.
- **Kalo** (avatar de Inicio) brilla con `drop-shadow` según `brillo = promedio(p_calorías, p_proteína)`; con exceso, `brillo = 0,25`.

## 6. Estado por forma

### Línea de avance

En los paneles de meta y los mosaicos sustituye a los anillos y a las barras de progreso (los anillos se quedan en la semana de Registros).

- **Riel**: 1 px `filo` a todo el ancho. El ancho representa del 0 % al 105 % de la meta, así que la **marca de meta** (1 px × 13 px, `hueso`) va al 95,2 % (`100% / 1,05`).
- **Avance**: 3 px con extremos redondeados, color del dato, ancho `min(valor / meta / 1,05, 1)`.

| Estado (`estadoAnillo` de `domain/reglas.ts`) | Forma | Texto |
|---|---|---|
| `vacio` | Riel punteado (2 px / 4 px), sin avance | «sin registro» |
| `parcial` | Avance sólido hasta donde va hoy; en días pasados, **discontinuo** (8 / 5) | porcentaje o «faltan …» |
| `cumplido` | Avance sólido que alcanza la marca | «✓ 98 %» |
| `excedido` (solo calorías) | **Doble línea** de 2 px en `exceso`, sin relleno | «! 116 %», «te pasaste por …» |

Las reglas no cambian: calorías cumplidas entre el 90 % y el 105 %, excedidas por encima del 105 %; el resto de metas se cumplen al llegar al 100 %.

### Gráfica de 7 días y anillos de la semana (Registros)

En Registros cada día es un **anillo de progreso** de 40 px (riel de 1 px en `filo`, arco de 3,5 px en el color de la sección) con el símbolo dentro y el porcentaje debajo.

| Estado | Barra (gráfica de Inicio) | Anillo (semana de Registros) |
|---|---|---|
| Cumplido | Sólida en el color del dato, con «✓» encima | Anillo completo con «✓» |
| Parcial | Solo borde discontinuo de 1,5 px, con «½» | Arco discontinuo (4/3) hasta el avance, con «½» |
| Excedido | Sólida en `exceso`, con «!» | Doble anillo en `exceso` con «!» |
| Sin registro | Borde discontinuo a ras del eje | Riel punteado, sin símbolo |
| Hoy | Al 55 % de opacidad mientras no se cumple, con resplandor y su valor encima | Arco sólido hasta el avance |

La meta se dibuja como una línea continua de 1 px en `hueso`. La gráfica siempre lleva leyenda (muestra de color + texto).

## 7. Componentes

| Componente | Especificación |
|---|---|
| **Panel de meta** | `muro`, radio 16, padding 16. Fila superior: etiqueta y «meta 1.850». Número Marcador XL (proteína en `sol`). Línea de avance. Fila inferior: estado y «quedan 660». Detrás, la luz. Todo el panel enlaza a Registros con una etiqueta accesible que lee el valor, la meta y el estado. |
| **Banda «Siguiente»** | Fondo `hueso`, texto `tinta`, radio 16. Título de 15 px, detalle de 13 px en `tinta-2` y botón primario a la derecha. |
| **Mosaico de registro** | `muro`, radio 12, padding 11/12. Etiqueta y meta arriba, dato en Saira 28 px con unidad en `ceniza`, línea de avance en el color del hábito y «faltan …». Todo el mosaico enlaza a su sección de Registros; no lleva botones de registro (el agua se añade en Registros o en Registro rápido). |
| **Registro nuevo** | Al guardar, el mosaico afectado lleva borde de 1 px en `llama`, resplandor y la marca «Nuevo» hasta que el usuario lo toca, lo enfoca o pasa el puntero por encima. |
| **Gráfica de 7 días** | `muro`, radio 16. Arriba el promedio y la meta; barras según la sección 6; días debajo (hoy en `hueso`); leyenda. Conserva el selector Calorías · Proteína · Agua de `GraficaSemana`. |
| **Botón primario** | `brasa`, texto blanco Onest 700 15 px, 46 px de alto, radio 12; hover `brasa-hover`; pulsado `scale(.97)`. |
| **Botón claro** | `hueso` con texto `tinta`. Para la segunda acción cuando la primera ya es `brasa`. |
| **Botón fantasma** | Transparente, borde 1 px `filo`, texto `hueso`. |
| **Chip de cantidad** | 44 px, radio 999, `muro` con borde `filo`; texto en el color del hábito (`+250 ml` en `agua`). |
| **Insignias** | 11 px, 700, mayúsculas con +0,06em, radio 5. «IA»: `llama` sobre `llama` al 16 %. «Licor»: `sueno` sobre `sueno` al 18 %. |
| **Control segmentado** | Contenedor `muro` de radio 12 con padding 4; segmento activo `hueso` con texto `tinta`. |
| **Stepper (peso)** | Botones de 48 × 48 en `banco` con borde `filo`; valor en Saira 800 de 40 px. |
| **Campos** | `muro`, borde 1 px `filo`, radio 12, padding 14; etiqueta Onest 600 13 px en `ceniza` encima; placeholder en `ceniza-2`. |
| **Tab bar** | 84 px + área segura, `#0A0706` al 92 % con desenfoque. Iconos de 22 px con trazo de 1,8 y etiqueta de 12 px; activo en `llama`; (+) de 54 × 54 en `brasa` con radio 18. |
| **Riel lateral (≥ 1024 px)** | 240 px, borde derecho de 1 px; ítems de 44 px con radio 10; activo con fondo `muro` y texto `llama`; el botón «Registro rápido» va justo debajo de Progreso; Recordatorios y Configuración abajo. |
| **Mensajes del asistente** | Usuario: `brasa`, texto blanco, esquina inferior derecha de 5 px. Kalo: `muro`, esquina inferior izquierda de 5 px. Las cifras del día van en Saira dentro del texto. Sugerencias en `banco` con botón «Registrar». El aviso médico va fijo arriba, con borde `divisor`. |
| **Alerta** (`components/ui/Alerta.tsx`) | Todo error de la app: caja de radio 12 con borde `exceso` al 40 % y fondo al 10 %, icono de alerta, **título que nombra el problema** («No pudimos guardar la comida»), detalle en `ceniza` con la causa probable y la salida («Lo que escribiste sigue aquí…»), y una acción opcional («Reintentar»). Nunca muestra el texto interno del servidor ni del proveedor. Variante `aviso` en `peso-luz`. Los errores de un campo concreto van bajo el campo en 12 px. |
| **Foco** | Contorno de 2 px en `sol` con separación de 3 px, en todo elemento interactivo. |

## 8. Kalo

- **Inicio**: avatar de 50 px con brillo según el avance (sección 5).
- **Acceso**: 150 px centrado, sobre una luz radial de 420 px.
- **Asistente**: avatar de 50 px con brillo fijo de 0,7.
- **Elenco por estado** (con la pose actual, `assets/Kalo.png`):
  - Encendido (meta cumplida): `drop-shadow` de 20 px en `llama` al 75 %.
  - A medias: `saturate(.7) brightness(.85)`.
  - Apagado (sin registro): `grayscale(1) brightness(.6)`.
- **Poses por encargar**, en el mismo estilo de ilustración: con pesas (ejercicio), con vaso (agua) y dormido (sueño). Hasta tenerlas se usa la pose base. No dibujarlas en SVG ni recortarlas con máscaras.

## 9. Pantallas

| Pantalla | Captura | Qué cambia |
|---|---|---|
| Inicio | [`inicio.png`](pantallas/inicio.png), [`inicio-abajo.png`](pantallas/inicio-abajo.png) | Cabecera con Kalo; panel de calorías y panel de proteína apilados; banda «Siguiente»; **Registros de hoy** (Agua, Ejercicio, Sueño, Comidas en 2 × 2, sin botones); **Últimos 7 días**. Inicio **no** muestra la lista de comidas del día. |
| Registros | [`registros.png`](pantallas/registros.png) | Título de marcador, control segmentado de 4 secciones y semana con un anillo por día (forma y símbolo); comidas por tipo con insignias y acciones «Tomar foto» y «Manual». La captura de la propuesta muestra líneas: se cambiaron por anillos tras la revisión. |
| Resultado de la IA | [`analisis-ia.png`](pantallas/analisis-ia.png) | Foto con la insignia «Analizado con IA»; la estimación en un panel de meta con su luz y su rango; proteína, azúcar y grasa en tres mosaicos; «Editar» y «Guardar en …». |
| Asistente | [`asistente.png`](pantallas/asistente.png) | Aviso médico arriba, burbujas, cifras en marcador y sugerencias con «Registrar». |
| Progreso | [`progreso.png`](pantallas/progreso.png) | Control segmentado de periodo; cada gráfica abre con su cifra principal en Marcador M; metas como línea de 1 px. |
| Acceso | [`acceso.png`](pantallas/acceso.png) | Kalo de 150 px encendido, nombre en marcador, campos y botones. |
| Escritorio (≥ 1024 px) | [`escritorio.png`](pantallas/escritorio.png) | Riel lateral; paneles de meta lado a lado; banda «Siguiente»; resumen en 4 columnas; gráfica de 7 días en la columna derecha. |

Las páginas legales (Privacidad, Términos, Cookies) usan un marco de lectura de 720 px con títulos de marcador. Las pantallas sin captura (Cámara, Manual, Registro rápido, Peso, Proveedor de IA, Recordatorios, Configuración y onboarding) aplican el mismo sistema: título de marcador, superficies `muro`, campos y botones de la sección 7, y una sola acción `brasa`. Cámara ya es oscura: sus tokens `camara-*` se sustituyen por `sala`, `muro` y `banco`.

## 10. Movimiento

- **Un solo momento con nombre**: la luz y la línea de avance se mueven 1,1 s con `cubic-bezier(.16, 1, .3, 1)` al registrar.
- **Registro nuevo**: resaltado hasta que se ve; se apaga en 0,6 s.
- **Pulsado**: `scale(.97)` en 0,12 s. Cambio de pantalla: solo opacidad, 0,16 s (como ahora).
- Se mantienen el escáner de la foto y los tres puntos del asistente, con los nuevos colores.
- Con `prefers-reduced-motion`, sin transiciones ni animaciones (como ahora).

## 11. Accesibilidad

- Texto ≥ 12 px y contraste ≥ 4,5:1 (≥ 3:1 en Marcador). Verificar cada token de hábito sobre `muro`.
- Ningún estado depende solo del color: forma de línea o barra, más símbolo o texto.
- Los números grandes llevan su contexto en la etiqueta accesible («Calorías: 1.190 de 1.850, 64 %, quedan 660»).
- La luz y las líneas son decorativas (`aria-hidden`); el estado se lee del texto.
- Foco visible en `sol` en todos los controles.

## 12. Qué no hacer

- Volver a las tarjetas blancas, los anillos o el naranja repartido en pedacitos.
- Usar la luz o el resplandor como adorno, sin dato detrás.
- Poner más de un botón `brasa` en una pantalla.
- Usar los colores de hábito originales sobre fondo oscuro.
- Degradados, vidrio o sombras de color fuera de la luz de sala.
- Emojis como iconos o ilustraciones dibujadas en CSS o SVG en lugar de la mascota.
- Cambiar navegación, controles estándar o reglas de dominio para «encajar» en el mundo.
