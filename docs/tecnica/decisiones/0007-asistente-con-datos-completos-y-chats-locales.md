# 0007 · El asistente lee todos los datos de la app y guarda tres chats en el dispositivo

- Fecha: 2026-10-14
- Estado: aceptada (sin verificar con un proveedor real)

## Contexto
Las respuestas del asistente eran pobres: el prompt pedía "dos o tres frases, sin Markdown" y el único dato que veía era el total del día. Además la conversación vivía en memoria, sin límite ni historial.

## Decisión
- **El asistente recibe todo lo registrado en cada consulta**, como parte de sus instrucciones y no del historial: perfil y metas, el día al detalle (cada comida con sus macros, tomas de agua, ejercicio, sueño y siestas), los últimos 14 días, comidas de la última semana, promedios y cumplimiento, historial de peso y recordatorios (`domain/contextoAsistente.ts`). Se lee en el momento de enviar, así que siempre está al día y el historial del chat no arrastra datos viejos.
- **Por qué contexto y no herramientas** (function calling): funciona igual con los tres proveedores sin tres implementaciones de herramientas, y el volumen (unos miles de tokens) es asumible. Si el historial creciera, el siguiente paso son herramientas de consulta.
- **Respuestas completas con formato.** El prompt pide planes, menús, recetas, listas de compra y análisis con cifras reales, en Markdown. Las respuestas se pintan con un intérprete propio de un subconjunto de Markdown (`domain/markdown.ts`) que genera elementos de React, nunca HTML en crudo.
- **Chats con límite y historial.** Cada chat admite 20 mensajes del usuario; al llegar al límite se pide abrir uno nuevo (controla el contexto y el gasto de la API key). Se conservan los 3 chats más recientes, en `localStorage` por usuario (`kalo:chats:<id>`), validados con zod al leerlos.
- **Pantalla completa.** El asistente ocupa toda la ventana; en escritorio, con el historial a la izquierda.

## Consecuencias
- Las conversaciones, que contienen datos de salud, se quedan en el dispositivo (no viajan a Supabase) y se envían al proveedor de IA del usuario junto con sus registros. La pantalla de IA ya avisa de que sus datos van a su proveedor.
- Cada consulta cuesta más tokens que antes por el contexto; el tope de 20 mensajes y el aviso de que el coste corre por cuenta del usuario lo acotan.
- El asistente no escribe datos: propone comidas con tarjetas "Registrar" y es la persona quien confirma.
