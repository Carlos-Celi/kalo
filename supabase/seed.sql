-- Datos de prueba para el entorno local. Se cargan con `supabase start` (la
-- primera vez) y con `supabase db reset`; nunca se aplican al proyecto remoto
-- (`supabase db push` no ejecuta el seed salvo que se pida con --include-seed).
--
-- Crea dos cuentas ya confirmadas, para entrar sin pasar por el correo:
--   prueba@kalo.test   onboarding completo: entra directo a Inicio
--   nuevo@kalo.test    recién registrada: entra al onboarding
-- Contraseña de ambas: kalo-local-1234
-- Son credenciales públicas y solo de desarrollo: no las reutilices en ningún
-- proyecto real.

do $$
declare
  cuenta record;
begin
  for cuenta in
    select *
    from (values
      ('00000000-0000-4000-8000-000000000001'::uuid, 'prueba@kalo.test'),
      ('00000000-0000-4000-8000-000000000002'::uuid, 'nuevo@kalo.test')
    ) as c (id, correo)
  loop
    -- Las columnas de tokens van como cadena vacía: Auth no admite NULL en ellas.
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change, email_change_token_new,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token
    ) values (
      '00000000-0000-0000-0000-000000000000', cuenta.id, 'authenticated', 'authenticated',
      cuenta.correo, extensions.crypt('kalo-local-1234', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}', '{}', now(), now(),
      '', '', '', '', '', '', '', ''
    );

    insert into auth.identities (
      id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), cuenta.id, cuenta.id::text, 'email',
      jsonb_build_object('sub', cuenta.id::text, 'email', cuenta.correo, 'email_verified', true),
      now(), now(), now()
    );
  end loop;

  -- Las filas de perfil ya las creó el disparador `al_crear_usuario`.
  -- El plan es el de ejemplo del diseño (Medidas, Objetivos, Habitos, Metas).
  update public.perfiles
  set
    nombre = 'Prueba',
    edad = 30,
    sexo = 'masculino',
    estatura_cm = 172,
    peso_kg = 78,
    objetivo = 'bajar',
    peso_meta_kg = 72,
    actividad = 'ligero',
    sueno_habitual = '5-7',
    alcohol = 'fines-de-semana',
    restricciones = '{sin-lactosa}',
    meta_kcal = 1850,
    meta_proteina_g = 140,
    meta_agua_ml = 2500,
    meta_ejercicio_min = 60,
    meta_sueno_min = 480,
    onboarding_completado_en = now()
  where id = '00000000-0000-4000-8000-000000000001';
end;
$$;
