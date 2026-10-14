# Documentación de Kalo

## Avance
- [Hoja de ruta](avance/hoja-de-ruta.md): entregas previstas y estado de cada pantalla.
- [Bitácora](avance/bitacora.md): qué se hizo en cada entrega y qué quedó pendiente.

## Diseño
- [Rediseño «Sala de estudio»](rediseno/README.md): guía visual vigente, pantallas e instrucciones de implementación.

## Técnica
- [Arquitectura de la web](tecnica/arquitectura.md): estructura, capas y convenciones.
- [Entorno local con Docker](tecnica/entorno-local.md): cómo levantar y probar la web.
- [Despliegue](tecnica/despliegue.md): cómo configurar Vercel y Supabase sin dejar nada en git.
- [Seguridad](tecnica/seguridad.md): amenazas consideradas y controles aplicados.
- [Decisiones](tecnica/decisiones/): registro de decisiones de arquitectura (ADR).

## Cómo se mantiene
Cada entrega añade una entrada a la bitácora y actualiza la hoja de ruta. Una decisión que cambie el rumbo técnico (stack, datos, seguridad) se registra como un ADR nuevo y numerado; los anteriores no se reescriben, se marcan como sustituidos.

La especificación del producto (identidad, pantallas, reglas de dominio) está en [`CLAUDE.md`](../CLAUDE.md) y el diseño de referencia en [`design/`](../design/). La guía visual vigente es [`rediseno/guia.md`](rediseno/guia.md): `design/` conserva la estructura de las pantallas, pero no su estilo.
