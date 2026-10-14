# Implementación del rediseño «Sala de estudio»

Pasos para llevar la [guía](guia.md) al código: primero la web (`web/`) y después la app móvil (`mobile/`). Las reglas de dominio, la navegación, las rutas y los datos no cambian; solo cambian el tema, los componentes visuales y la composición.

## 0. Antes de empezar

1. Crear una rama, por ejemplo `rediseno-sala`.
2. Leer la [guía](guia.md) y abrir [`pantallas/propuesta.html`](pantallas/propuesta.html) en el navegador como referencia.
3. Registrar la decisión en [ADR 0010](../tecnica/decisiones/0010-rediseno-sala-de-estudio.md) (ya creado como «Aceptada, pendiente de implementar»). Cambiarlo a «Implementada» al terminar.
4. Al terminar la web, actualizar la sección **Identidad** de `CLAUDE.md`:
   - Tipografía: Saira Condensed (números y títulos) + Onest (interfaz).
   - Colores: los tokens de la [guía, sección 2](guia.md#2-color).
   - Añadir: «La guía visual vigente es `docs/rediseno/guia.md`; `design/` conserva la estructura de las pantallas, pero no su estilo».
   - Regla de Inicio: «Inicio muestra el resumen de registros y la gráfica de 7 días, no la lista de comidas».

## 1. Tipografías (web)

```bash
cd web
npm uninstall @fontsource-variable/plus-jakarta-sans
npm install @fontsource-variable/onest @fontsource/saira-condensed
```

En `src/main.tsx`, sustituir el import de Plus Jakarta Sans por:

```ts
import '@fontsource-variable/onest'
import '@fontsource/saira-condensed/600.css'
import '@fontsource/saira-condensed/700.css'
import '@fontsource/saira-condensed/800.css'
```

Comprobar en npm que los dos paquetes existen con esos nombres antes de instalar. Las fuentes quedan empaquetadas por Vite, sin peticiones a Google Fonts (lo exige la CSP de `docs/tecnica/seguridad.md`).

## 2. Tokens (web)

En `src/theme/global.css`, dentro de `@theme`:

1. Cambiar la familia:
   ```css
   --font-sans: 'Onest Variable', ui-sans-serif, system-ui, sans-serif;
   --font-marcador: 'Saira Condensed', 'Arial Narrow', sans-serif;
   ```
2. Añadir los tokens nuevos. Conviven con los actuales durante la migración, así se puede cambiar pantalla a pantalla:
   ```css
   --color-sala: #110c0a;
   --color-muro: #1e1512;
   --color-banco: #2a1e19;
   --color-filo: #4a3a33;
   --color-hueso: #f3eee8;
   --color-ceniza: #b8aba2;
   --color-ceniza-2: #8e8078;
   --color-brasa: #d13d0a;
   --color-brasa-hover: #b5340a;
   /* llama (#f97316) y sol (#ffc933) ya existen */
   --color-agua-luz: #6aaef0;
   --color-ejercicio-luz: #f0904a;
   --color-sueno-luz: #d99a7c;
   --color-peso-luz: #f2c46b;
   --color-exceso: #ff6a55;
   --radius-panel: 16px;
   --radius-control: 12px;
   --ease-sala: cubic-bezier(0.16, 1, 0.3, 1);
   ```
3. En `@layer base`:
   - `html { color-scheme: dark; }`
   - `body { background: var(--color-sala); color: var(--color-hueso); }`
   - El foco pasa a `outline: 2px solid var(--color-sol); outline-offset: 3px;`.
   - Placeholder en `var(--color-ceniza-2)`.
   - `::selection { background: var(--color-brasa); color: #fff; }`
4. Utilidades nuevas:
   ```css
   @utility num-marcador {
     font-family: var(--font-marcador);
     font-variant-numeric: tabular-nums;
     letter-spacing: -0.01em;
   }
   ```
5. En `web/index.html`: `<meta name="theme-color" content="#110C0A" />`.
6. Al final de la migración, borrar los tokens que ya no se usen (`crema`, `crema-suave`, `borde`, `tinta-*`, `calorias-pista`, `anillo-pista`, `camara-*`, `sombra-suave`, etc.). Antes de borrar cada uno, buscar sus usos con `grep -rn "<nombre>" src`.

## 3. Componentes base (`src/components/ui/`)

| Componente | Acción |
|---|---|
| `LineaAvance.tsx` (nuevo) | Props: `fraccion` (valor/meta), `estado: EstadoAnillo`, `color` (clase o variable) y `pasado?: boolean` para dibujar el parcial discontinuo. Dibuja el riel de 1 px, la marca de meta al `100% / 1.05`, el avance (`min(fraccion / 1.05, 1)`) y las formas de la [guía §6](guia.md#6-estado-por-forma). Es `aria-hidden`. Reutilizar `useEntrada` de `useAnimacion.ts` para el crecimiento. |
| `LuzSala.tsx` (nuevo) | Props: `fraccion`, `tono: 'calorias' \| 'proteina'`, `excedido`. Un `span` absoluto con el degradado radial, `transform: scale(0.35 + p × 0.75)` y `opacity: 0.12 + p × 0.88`. No se pinta si `fraccion === 0`. Transición de 1,1 s con `--ease-sala`. Es `aria-hidden`. |
| `PanelMeta.tsx` (nuevo) | Sustituye a `AnilloMeta` en Inicio: etiqueta, «meta …», número `num-marcador` de 88 px (76 px en móvil estrecho), `LineaAvance`, estado y restante. Contiene `LuzSala`. Calcula el estado con `estadoAnillo` de `domain/reglas.ts` (no duplicar la regla del 90–105 %). Es un `Link` a Registros con `aria-label` completo. |
| `ProgressRing.tsx` | Deja de usarse en Inicio. Si no queda ningún uso, se borra. |
| `ProgressBar.tsx` | Se sustituye por `LineaAvance` donde muestre avance hacia una meta. |
| `BarChart.tsx` | Barras según el estado de cada día (sólida, borde discontinuo, `exceso` con «!», hoy con resplandor y valor), meta como línea continua de 1 px en `hueso`, días debajo y leyenda. Cada día lleva texto accesible («Jueves: 1.540 kcal, parcial»). |
| `Button.tsx` | Variantes `primario` (`brasa`), `claro` (`hueso`/`tinta`) y `fantasma` (borde `filo`). Alto de 46 px y radio de 12. Retirar las variantes que dependan de `crema`. |
| `Chip.tsx`, `GrupoChips.tsx` | `muro` con borde `filo`, 44 px y radio 999; el activo en `hueso` con texto `tinta`. |
| `Badge.tsx` | Insignias «IA» y «Licor» según la [guía §7](guia.md#7-componentes). |
| `CampoTexto.tsx`, `CamposNumericos.tsx` | Fondo `muro`, borde `filo`, radio 12 y etiqueta en `ceniza`. |
| `Interruptor.tsx` | Pista `banco`; activo `llama`. |
| `MascotAvatar.tsx` | Props nuevas: `brillo?: number` (0–1, `drop-shadow` en `llama`) y `estado?: 'encendido' \| 'medias' \| 'apagado'` (filtros de la [guía §8](guia.md#8-kalo)). |
| `LineaPeso.tsx` | Trazo en `peso-luz`, punto final relleno y meta como línea de 1 px. |
| `Esqueleto.tsx` | Fondo `muro` con pulso suave. |
| `PantallaFlujo.tsx`, `ErrorCarga.tsx`, `Markdown.tsx` | Solo cambian los colores a los tokens nuevos. |

**CSP**: la web no permite estilos en línea en el HTML (`docs/tecnica/seguridad.md`). Los valores dinámicos (fracción de la luz, ancho del avance) se pasan como variables CSS con la prop `style` de React (`style={{ '--p': fraccion }}`), que se aplica desde JavaScript y la CSP no la bloquea. No se generan `<style>` ni atributos `style` en el HTML servido.

Navegación (`src/components/nav/`):

- `TabBar.tsx`: fondo `#0A0706` al 92 % con `backdrop-blur`, borde superior de 1 px, activo en `llama` y (+) de 54 × 54 en `brasa` con radio 18.
- `Sidebar.tsx`: 220 px, ítem activo con fondo `muro` y texto `llama`, botón «Registro rápido» primario.

## 4. Pantallas, en este orden

### 4.1 Inicio (`src/features/inicio/`)

Composición nueva (ver [`inicio.png`](pantallas/inicio.png), [`inicio-abajo.png`](pantallas/inicio-abajo.png) y [`escritorio.png`](pantallas/escritorio.png)):

1. **Cabecera**: `MascotAvatar` de 50 px con `brillo` = promedio de las fracciones de calorías y proteína (0,25 si las calorías están excedidas), saludo, fecha y racha, y el acceso a Recordatorios (Configuración se queda en el riel en escritorio).
2. **`MetasHoy`** → dos `PanelMeta` (calorías y proteína), apilados en móvil y lado a lado desde `lg`.
3. **`SiguientePaso`** → banda `hueso` con un botón primario.
4. **`HabitosGrid`** → «Registros de hoy»: mosaicos Agua, Ejercicio, Sueño y Comidas en 2 × 2 (móvil) y 4 columnas (`lg`), con `LineaAvance` en el color de cada hábito. Se conserva el atajo «+250 ml» con «Deshacer» en Agua.
5. **`GraficaSemana`** → «Últimos 7 días» con el nuevo `BarChart`. Conserva el selector Calorías · Proteína · Agua. En `lg` va en la columna derecha.
6. **No** se muestra la lista de comidas del día en Inicio.
7. **Registro nuevo**: al volver de un registro, el mosaico afectado queda resaltado (borde `llama`, resplandor y la marca «Nuevo») hasta que recibe foco, clic o puntero. Basta un estado en memoria del resumen (el último hábito registrado), sin persistirlo.

Rejilla en escritorio: riel de 220 px, contenido central (paneles, banda y resumen) y una columna derecha de unos 320 px para la gráfica. La vista móvil no se estira.

### 4.2 Registros (`src/features/registros/`)

- Título de marcador «REGISTROS» y control segmentado Comida · Agua · Ejercicio · Sueño.
- Semana (`SemanaAnillos.tsx`, que conviene renombrar a `SemanaRegistros.tsx`): cada día con `LineaAvance` corta (días pasados con `pasado`) y símbolo ✓, ½ o !; hoy, con el porcentaje. Leyenda visible.
- Filas de comida en `muro` con insignias; acciones «Tomar foto» (primaria) y «Manual» (fantasma).
- Agua, Ejercicio y Sueño: chips de cantidad en el color del hábito, «Deshacer» como fantasma y el ajuste de ±15 min de sueño con el stepper.

### 4.3 Cámara y Resultado de la IA (`src/features/ia/`)

- Cámara: sustituir `camara-*` por `sala`, `muro` y `banco`; el escáner pasa a `llama`.
- Análisis: la estimación de kcal usa `PanelMeta` (o su parte visual) con la luz proporcional a lo que la comida aporta a la meta del día y el rango estimado; proteína, azúcar y grasa en tres mosaicos; «Editar» fantasma y «Guardar en …» primario.

### 4.4 Asistente (`src/features/ia/AsistentePage.tsx`)

- Aviso médico fijo arriba con borde `divisor`. Burbujas según la [guía §7](guia.md#7-componentes); cifras del día con `num-marcador` dentro del Markdown; sugerencias en `banco` con «Registrar» primario; campo de mensaje en `muro`.

### 4.5 Progreso y Peso

- Control segmentado de periodo; cada tarjeta abre con su cifra en Marcador M (44 px); barras y líneas con la meta en 1 px; peso en `peso-luz`.
- Peso: stepper con botones de 48 × 48 en `banco` y valor en marcador; la confirmación de guardado con el botón primario.

### 4.6 Acceso y onboarding (`auth`, `onboarding`, `perfil`)

- Acceso: Kalo de 150 px con `estado="encendido"` sobre una luz radial, «KALO» en marcador, el lema «Enciende tus hábitos.», campos y botones.
- Onboarding (Perfil, Medidas, Objetivos, Hábitos, Metas): títulos de marcador, chips y campos nuevos. El plan generado muestra calorías y proteína en `PanelMeta` sin luz de avance (meta, no progreso).

### 4.7 Configuración, Recordatorios y Proveedor de IA

- Listas en `muro` con divisores de 1 px, interruptores nuevos y una sola acción primaria por pantalla. La API key se sigue mostrando oculta, con el botón de mostrar.

## 5. Pruebas y verificación (web)

1. Actualizar las pruebas que dependan de textos o estructura cambiados (`InicioPage.test.tsx` y las de Registros, Asistente y Peso).
2. Pruebas nuevas:
   - `PanelMeta`: muestra «✓» entre el 90 % y el 105 % de calorías, «!» y «te pasaste por …» por encima del 105 %, y nunca «excedido» en proteína.
   - `LineaAvance`: el ancho del avance es `min(fraccion / 1.05, 1)` y la forma corresponde al estado.
   - `BarChart`: cada día tiene su texto accesible con el estado.
   - Inicio: no muestra la lista de comidas; el mosaico del último registro lleva «Nuevo» y la marca desaparece al enfocarlo.
3. Antes de dar la web por terminada (regla de `CLAUDE.md`):
   ```bash
   npm run lint
   npm run typecheck
   npm test
   npm run build
   ```
4. Revisión visual con `docker compose up web` a 390 × 844 y a 1280 × 800, comparando con [`pantallas/`](pantallas/).
5. Contraste: comprobar cada combinación de texto y fondo con la tabla de la [guía §2](guia.md#2-color).
6. «Reducir movimiento» activado: sin transiciones de luz ni de líneas.

## 6. App móvil (`mobile/`, Flutter)

`mobile/` aún es la plantilla. Al construir el tema:

1. **Fuentes**: añadir los TTF de Onest y Saira Condensed (600, 700 y 800) en `mobile/assets/fonts/` y declararlos en `pubspec.yaml`. Se empaquetan para no depender de la red.
2. **Tema** (`lib/tema/`):
   - `ThemeData(brightness: Brightness.dark, scaffoldBackgroundColor: Color(0xFF110C0A), fontFamily: 'Onest')`.
   - `ColorScheme` con `primary: brasa`, `surface: muro`, `onSurface: hueso`, `error: exceso`.
   - Una extensión `ThemeExtension<ColoresKalo>` con todos los tokens de la [guía §2](guia.md#2-color), incluidos los de hábito aclarados.
   - Estilos de texto `marcadorXL/L/M`, `titulo`, `dato`, `etiqueta` y `nota` con `fontFeatures: [FontFeature.tabularFigures()]`.
3. **Componentes equivalentes**:
   - `PanelMeta`: `Stack` con un `CustomPaint` (o `DecoratedBox` con `RadialGradient`) para la luz, animado con `TweenAnimationBuilder` de 1.100 ms y `Cubic(0.16, 1, 0.3, 1)`.
   - `LineaAvance`: `CustomPainter` con riel, marca de meta, avance sólido, discontinuo o doble.
   - Mosaicos, banda, gráfica de 7 días, tab bar y botones según la [guía §7](guia.md#7-componentes).
4. **Movimiento**: si `MediaQuery.disableAnimationsOf(context)` es verdadero, la duración es cero.
5. **Accesibilidad**: `Semantics` con la etiqueta completa de cada número y objetivos de 44 × 44 o más.

## 7. Documentación al cerrar

- Entrada en `docs/avance/bitacora.md` (qué se hizo, qué se verificó y qué no).
- Hoja de ruta: marcar la entrega «Rediseño Sala de estudio» como ✅ web y ⏳ móvil.
- ADR 0010 a «Implementada».
- `CLAUDE.md` actualizado (paso 0.4).

## 8. Criterios de aceptación

- [ ] Ninguna pantalla usa fondo blanco, `crema` ni Plus Jakarta Sans.
- [ ] Inicio: paneles con luz proporcional, banda «Siguiente», «Registros de hoy» y «Últimos 7 días»; sin lista de comidas.
- [ ] Los estados se distinguen sin color (forma y símbolo) en Inicio, Registros, Progreso y la gráfica.
- [ ] Una sola acción `brasa` por pantalla.
- [ ] Contraste ≥ 4,5:1 en todo texto normal; objetivos táctiles ≥ 44 px; foco visible.
- [ ] Lint, tipos, pruebas y build en verde.
- [ ] Capturas a 390 px y a 1280 px coherentes con `docs/rediseno/pantallas/`.
