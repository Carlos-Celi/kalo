-- Onboarding: datos del perfil (Perfil, Medidas, Objetivos, Hábitos) y metas
-- diarias (Metas). Todo vive en `perfiles`, una fila por usuario, bajo la
-- misma RLS: cada quien solo lee y edita la suya.
--
-- Las columnas son opcionales hasta terminar el onboarding;
-- `onboarding_completado_en` marca que el plan está completo.

alter table public.perfiles
  add column edad smallint check (edad between 16 and 100),
  add column sexo text check (sexo in ('femenino', 'masculino', 'sin-especificar')),
  add column estatura_cm smallint check (estatura_cm between 120 and 220),
  add column peso_kg numeric(4, 1) check (peso_kg between 30 and 200),
  add column objetivo text check (objetivo in ('bajar', 'mantener', 'musculo', 'sano')),
  add column peso_meta_kg numeric(4, 1) check (peso_meta_kg between 30 and 200),
  add column actividad text check (actividad in ('sedentario', 'ligero', 'moderado', 'intenso')),
  add column sueno_habitual text check (sueno_habitual in ('menos-5', '5-7', '7-9', 'mas-9')),
  add column alcohol text check (alcohol in ('nunca', 'fines-de-semana', 'frecuente')),
  add column restricciones text[] not null default '{}' check (
    restricciones <@ array['vegetariano', 'sin-lactosa', 'sin-gluten', 'diabetes', 'hipertension']
  ),
  add column meta_kcal smallint check (meta_kcal between 1000 and 5000),
  add column meta_proteina_g smallint check (meta_proteina_g between 30 and 300),
  add column meta_agua_ml smallint check (meta_agua_ml between 500 and 6000),
  add column meta_ejercicio_min smallint check (meta_ejercicio_min between 0 and 240),
  add column meta_sueno_min smallint check (meta_sueno_min between 240 and 720),
  add column onboarding_completado_en timestamptz;

-- No se puede marcar el onboarding como completo con datos a medias.
alter table public.perfiles
  add constraint perfiles_onboarding_completo check (
    onboarding_completado_en is null
    or num_nulls(
      nombre, edad, sexo, estatura_cm, peso_kg, objetivo, peso_meta_kg, actividad,
      sueno_habitual, alcohol, meta_kcal, meta_proteina_g, meta_agua_ml,
      meta_ejercicio_min, meta_sueno_min
    ) = 0
  );

comment on column public.perfiles.restricciones is
  'Restricciones alimentarias y condiciones de salud declaradas por el usuario.';

-- El usuario autenticado puede modificar solo estas columnas de su fila
-- (`id`, `creado_en` y `actualizado_en` siguen sin exponerse a escritura).
grant update (
  edad, sexo, estatura_cm, peso_kg, objetivo, peso_meta_kg, actividad, sueno_habitual,
  alcohol, restricciones, meta_kcal, meta_proteina_g, meta_agua_ml, meta_ejercicio_min,
  meta_sueno_min, onboarding_completado_en
) on table public.perfiles to authenticated;
