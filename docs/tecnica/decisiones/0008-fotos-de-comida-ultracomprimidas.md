# 0008 · La foto de la comida se guarda como miniatura ultracomprimida

- Fecha: 2026-10-14
- Estado: aceptada (sin verificar en un navegador real con cámara)

## Contexto
El [ADR 0005](0005-ia-desde-el-navegador.md) decidió que la foto solo se envía al proveedor de IA y no se guarda. Se pidió poder ver después la foto de cada comida registrada, comprimida al máximo.

## Decisión
- **Miniatura, no la foto original.** Tras analizar, el navegador reduce la imagen a un lado mayor de 480 px y la codifica en **WebP** con calidad 0,5 (JPEG si el navegador no codifica WebP). Si pasa de unos 52 KB prueba calidades y lados menores (400, 320, 256 px). Resultado típico: 10–30 KB (`features/ia/foto.ts`, `comprimirMiniatura`).
- **Se guarda como texto en la fila de la comida** (`comidas.foto`, data URL, máximo 100.000 caracteres, con una restricción que solo admite `data:image/webp|jpeg;base64,…`). No hay bucket aparte: la foto hereda RLS de `comidas`. A cambio, las listas piden `tiene_foto` (columna generada) y nunca `foto`; la imagen se descarga al abrir la comida.
- **Es opcional y visible**: en el resultado del análisis hay un interruptor «Guardar la foto con esta comida» (activado por defecto) que indica el tamaño. En la comida guardada se puede **quitar la foto** sin borrar la comida; borrar la comida borra la foto.
- **Solo las fotos analizadas con IA se guardan**: las comidas manuales no llevan foto.
- **Se pinta en un lienzo** (`createImageBitmap` sobre un `Blob`), igual que la foto del análisis, para no abrir la CSP a imágenes `data:`.

## Consecuencias
- Las fotos de comida quedan en Supabase, ligadas a la cuenta y protegidas por RLS. Antes nunca salían del dispositivo (salvo hacia el proveedor de IA); es un cambio de privacidad que la pantalla anuncia y la persona decide en cada análisis.
- Coste de almacenamiento: ~20 KB por foto; mil fotos son unos 20 MB. Si creciera, el paso siguiente es Supabase Storage con la misma miniatura.
- En modo demostración la foto vive en memoria y se pierde al recargar.
- Una miniatura de 480 px sirve para recordar el plato, no para analizarlo de nuevo.
