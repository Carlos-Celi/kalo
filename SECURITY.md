# Seguridad

## Cómo informar de una vulnerabilidad

Si encuentras un fallo de seguridad en Kalo, **no abras un issue público**. Infórmalo de forma privada desde [«Report a vulnerability»](https://github.com/Carlos-Celi/kalo/security/advisories/new) en la pestaña *Security* del repositorio.

Incluye, si puedes:
- qué parte afecta (web, base de datos, función de correo…) y cómo reproducirlo;
- el impacto que crees que tiene;
- si ya se está aprovechando.

Respondemos en cuanto podamos, te mantenemos al tanto mientras se corrige y te damos crédito si quieres cuando se publique el arreglo.

## Qué esperamos de quien investiga

- Prueba solo con tu propia cuenta. No accedas, modifiques ni borres datos de otras personas.
- Nada de ataques de denegación de servicio, ingeniería social ni pruebas contra la infraestructura de los proveedores (Supabase, Vercel, Resend, Cloudflare o los proveedores de IA).
- Danos un tiempo razonable para corregirlo antes de hacerlo público.

## Alcance

Código de este repositorio: la web (`web/`), el esquema y las funciones de Supabase (`supabase/`) y la app móvil (`mobile/`). Los controles aplicados están descritos en [`docs/tecnica/seguridad.md`](docs/tecnica/seguridad.md).
