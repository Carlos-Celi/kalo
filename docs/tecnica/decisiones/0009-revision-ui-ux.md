# 0009 · Revisión de UI/UX: usabilidad por encima del diseño de referencia donde chocan

- Fecha: 2026-10-13
- Estado: aceptada (revisada en el navegador a 390 px y 1280 px; sin probar en dispositivos reales)

## Contexto
Una crítica de la web contra `design/` encontró un fallo funcional y varios puntos de usabilidad y contraste. Se decidió corregirlos aunque algunos se aparten del diseño de referencia (que es de solo lectura).

## Decisión
- **La hoja de Registro rápido se ancla a la ventana.** La entrada de pantalla usaba `animation-fill-mode: both` con un `transform`: al terminar quedaba `matrix(1,0,0,1,0,0)` y el contenedor pasaba a ser el bloque contenedor de todo `position: fixed`. En 390×844 la hoja medía 1011 px y dos de sus cuatro accesos quedaban fuera de pantalla. Ahora la entrada de ruta (`animate-ruta`) es solo opacidad (160 ms), `animate-aparecer` usa `backwards`, la hoja va por encima del tab bar (`z-40`) y mantiene el foco dentro.
- **Registros móvil, más compacto.** La racha pasa a ser la primera fila de la tarjeta de la semana; la leyenda y la nota de la meta se pliegan tras «¿Cómo se cuenta?» (siempre visibles desde 1024 px); las secciones miden 56 px y el día elegido es texto, no un botón falso. «Comidas de hoy» sube de ~500 a ~460 px.
- **Asistente.** Cabecera de una línea (el acceso a Configuración pasa al pie del historial en móvil), icono de reloj para el historial, aviso de «conectar IA» antes que las sugerencias (que no se muestran sin IA) y sin `role="log"`/`aria-live` sobre el texto que llega en trozos: el lector anuncia solo «respondiendo» y «respuesta lista».
- **Sin IA, registrar a mano es la salida principal** de la cámara; los tipos de comida van en una fila con desplazamiento.
- **Inicio**: atajo «+250 ml» con «Deshacer» en el mosaico de agua. **Peso**: mantener pulsado repite el paso, el valor se puede escribir y la gráfica dibuja la meta.
- **Errores de carga** con botón «Reintentar» (`ErrorCarga`).
- **Contraste.** `marcador` (placeholders) pasa de `#8c7a6e` (4,1:1) a `#75665b`; la pestaña activa y el día elegido usan `kalo-oscuro` sobre crema; el texto pequeño de la tarjeta naranja de Inicio y del plan es blanco en lugar de `kalo-claro` (≈3,9:1).
- **Imágenes de la mascota.** `assets/Kalo.png` (llama sin fondo, 256 px) se usa en `MascotAvatar` sobre un círculo cálido; `assets/kalo-mascot-b.png` (ícono a sangre, 256 px) en el logotipo del acceso y en las notificaciones; favicon (64 px) y `apple-touch-icon` (180 px, recortado al 84 % para no dejar esquinas transparentes) salen de ese mismo ícono. Se elimina el recorte con escala y desplazamiento que el ícono antiguo necesitaba.

## Consecuencias
- Desviaciones respecto a `design/`: estructura de Registros (racha dentro de la tarjeta, ayuda plegada), color del texto pequeño sobre la tarjeta naranja, placeholder y pestaña activa, y el avatar de la mascota.
- `mobile/` debe replicar estos cambios cuando se construya.
- El token `--color-mascota` se elimina (ya no hay un fondo sólido tras la imagen).
