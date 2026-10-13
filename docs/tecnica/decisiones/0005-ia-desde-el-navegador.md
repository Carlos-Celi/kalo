# 0005 · La IA se llama desde el navegador con la clave del usuario

- Fecha: 2026-10-13
- Estado: aceptada

## Contexto
Kalo usa IA para estimar una comida a partir de una foto y para el asistente nutriólogo. El producto establece que cada usuario trae su propia API key (Anthropic, OpenAI o Google), que esa clave se guarda en el dispositivo y que nunca se envía a servidores propios ni se registra. El despliegue web no tiene backend: Vercel sirve archivos estáticos y Supabase solo guarda los datos.

## Decisión
- **Las llamadas salen del navegador directamente al proveedor.** No hay intermediario de Kalo que vea la clave, las fotos ni las conversaciones.
- **Una interfaz, tres implementaciones** (`web/src/features/ia/proveedores/`): `listarModelos`, `analizarFoto` y `conversar`. Anthropic usa el SDK oficial (`@anthropic-ai/sdk`, con `dangerouslyAllowBrowser`, que existe para este caso: clave del propio usuario); OpenAI y Google usan `fetch` contra su API REST. Cada cliente se descarga solo cuando se usa.
- **La clave se guarda cifrada en el dispositivo** (`features/ia/boveda.ts`): AES-GCM con una `CryptoKey` no extraíble guardada en IndexedDB. En `localStorage` solo quedan el proveedor y el modelo (`kalo:ia:<id>`). Nada de esto viaja a Supabase, y la clave se puede quitar desde "Proveedor de IA". Si el navegador no ofrece IndexedDB o WebCrypto, la clave dura lo que la pestaña.
- **"Probar conexión" lista los modelos del proveedor**: valida la clave sin gastar tokens y carga la lista real de modelos. Para Anthropic se propone `claude-opus-5-5`.
- **Análisis de foto con salida estructurada**: el modelo devuelve un JSON con un esquema fijo (`domain/ia.ts`); los valores se acotan a los límites de un registro antes de mostrarlos. La foto se reduce a 1280 px y se envía en JPEG. El original no se guarda; una miniatura ultracomprimida opcional sí ([ADR 0008](0008-fotos-de-comida-ultracomprimidas.md)).
- **Asistente**: instrucciones fijas por usuario (perfil, metas, restricciones, límites de lo que puede aconsejar) y el registro del día adjunto a cada consulta. Las comidas sugeridas llegan en un bloque `kalo-comidas` al final del texto, que la app convierte en tarjetas con "Registrar"; es el mismo mecanismo para los tres proveedores. La conversación vive en memoria y se pierde al cerrar la pestaña.
- **Rechazos**: en los modelos de Anthropic que lo admiten se activa el respaldo en servidor (`fallbacks: "default"`), que reintenta con otro modelo si el elegido declina por política.
- **Errores**: los clientes solo devuelven un motivo propio (`clave`, `limite`, `modelo`, `rechazo`, `red`…); el mensaje del proveedor no llega a la pantalla ni a la consola.

## Consecuencias
- `connect-src` de la CSP incluye `api.anthropic.com`, `api.openai.com` y `generativelanguage.googleapis.com` (en `web/vercel.json` y `web/nginx.conf`).
- El cifrado impide leer la clave del disco o copiarla a otro navegador, pero un script que se ejecute en el origen podría pedir que se descifre y usarla. La defensa frente a eso es la CSP estricta (sin scripts en línea ni de terceros) y no incluir dependencias que carguen código remoto. Es menos que el almacenamiento seguro de un teléfono; la app móvil usará el del sistema.
- El coste de la IA corre por cuenta del usuario en su proveedor, y la pantalla lo dice.
- Sin clave configurada, la foto con IA y el asistente quedan deshabilitados con un acceso a la configuración; el registro manual funciona igual.
- **Sin verificar contra los proveedores reales**: no se dispone de claves en el entorno de desarrollo. Las pantallas se prueban con un proveedor simulado; hay que hacer una prueba real con cada proveedor antes de darlo por bueno.
