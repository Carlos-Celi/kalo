# 0004 · El plan del onboarding se calcula con una fórmula, no con IA

- Fecha: 2026-10-13
- Estado: aceptada (se revisará en la entrega de IA)

## Contexto
El diseño del onboarding termina con "Generar mi plan con IA" y una tarjeta "Sugerido por la IA". La integración con proveedores de IA es la entrega 6 y depende de que el usuario configure su propia API key, cosa que no puede exigirse para terminar el registro. Las metas de calorías y proteína hacen falta desde ya: sin ellas Inicio no tiene con qué compararse.

## Decisión
- Las metas se calculan en el cliente con reglas fijas (`web/src/domain/plan.ts`):
  - Calorías: gasto en reposo con Mifflin-St Jeor × factor de actividad (1,2 / 1,375 / 1,55 / 1,725), con −500 kcal para bajar de peso, +300 para ganar músculo y sin ajuste para mantener o comer más sano. Mínimo 1.000 kcal.
  - Proteína: 1,8 g/kg (bajar), 2 g/kg (músculo), 1,4 g/kg (resto).
  - Agua: 33 ml/kg, entre 1,5 y 4 L. Ejercicio: 30 min si se parte del sedentarismo, 60 en otro caso. Sueño: 8 h.
  - Sin sexo declarado se usa el punto medio de la constante de Mifflin-St Jeor.
- Con el perfil de ejemplo del diseño (30 años, 172 cm, 78 kg, actividad ligera, bajar de peso) el resultado coincide con el del diseño: 1.850 kcal, 140 g, 2,5 L, 60 min, 8 h.
- Como no interviene ninguna IA, los textos no la mencionan: el botón dice "Generar mi plan" y la tarjeta "Sugerido para ti".
- El usuario puede ajustar todas las metas antes de guardar, como en el diseño.
- Todo se guarda en `perfiles` (migración `20261013000000_onboarding.sql`), una fila por usuario, con los mismos límites en `check` que valida el cliente.

## Consecuencias
- El onboarding funciona sin API key y también en modo demostración.
- Las respuestas sobre sueño habitual, alcohol y restricciones se guardan pero aún no cambian el cálculo: servirán de contexto para el asistente.
- Cuando exista la IA podrá proponer el plan y recuperar los textos del diseño; la fórmula quedará como alternativa sin proveedor configurado.
- Son estimaciones generales, no consejo médico. El mínimo de edad es 16 años; revisarlo es una decisión de producto pendiente.
