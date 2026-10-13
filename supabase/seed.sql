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

-- Registros de ejemplo para `prueba@kalo.test`: los 13 días anteriores a hoy
-- y parte de hoy, para que las semanas y las gráficas tengan algo que mostrar.
do $$
declare
  usuario constant uuid := '00000000-0000-4000-8000-000000000001';
  dia date;
  n int;
begin
  for n in 1..13 loop
    dia := current_date - n;
    insert into public.comidas (usuario_id, fecha, tipo, nombre, kcal, proteina_g, carbohidratos_g, azucar_g, grasa_g, creado_en) values
      (usuario, dia, 'desayuno', 'Avena con plátano', 320 + (n % 3) * 30, 9 + (n % 4), 54, 9, 6, dia + time '07:30'),
      (usuario, dia, 'almuerzo', 'Arroz con pollo', 620 + (n % 5) * 40, 38 + (n % 3) * 4, 70, 3, 18, dia + time '13:10'),
      (usuario, dia, 'cena', 'Ensalada con atún', 480 + (n % 4) * 90, 34 + (n % 5) * 3, 30, 6, 16, dia + time '20:15'),
      (usuario, dia, 'snack', 'Yogur griego', 150 + (n % 2) * 180, 15 + (n % 2) * 20, 9, 7, 4, dia + time '17:00');
    insert into public.aguas (usuario_id, fecha, ml, creado_en) values
      (usuario, dia, 750, dia + time '09:00'),
      (usuario, dia, 750 + (n % 3) * 250, dia + time '13:30'),
      (usuario, dia, 500 + (n % 2) * 500, dia + time '18:00');
    if n % 3 <> 0 then
      insert into public.ejercicios (usuario_id, fecha, minutos, nombre, kcal, creado_en) values
        (usuario, dia, 30 + (n % 4) * 15, 'Caminata rápida', round((30 + (n % 4) * 15) * 3.7), dia + time '18:30');
    end if;
    insert into public.suenos (usuario_id, fecha, minutos) values (usuario, dia, 375 + (n % 5) * 30);
  end loop;

  insert into public.comidas (usuario_id, fecha, tipo, nombre, porcion, kcal, proteina_g, carbohidratos_g, azucar_g, grasa_g, es_alcohol, grados_alcohol, origen, creado_en) values
    (usuario, current_date, 'desayuno', 'Avena con plátano', '1 tazón', 320, 9, 54, 9, 6, false, null, 'manual', current_date + time '07:30'),
    (usuario, current_date, 'desayuno', 'Café con leche', '1 taza', 100, 5, 8, 5, 4, false, null, 'manual', current_date + time '07:40'),
    (usuario, current_date, 'almuerzo', 'Arroz con pollo', '1 plato', 620, 38, 70, 3, 18, false, null, 'ia', current_date + time '13:10'),
    (usuario, current_date, 'licor', 'Cerveza artesanal 330 ml', '330 ml', 150, 0, 14, 2, 0, true, 5.5, 'manual', current_date + time '16:30');
  insert into public.aguas (usuario_id, fecha, ml, creado_en) values
    (usuario, current_date, 250, current_date + time '07:30'),
    (usuario, current_date, 500, current_date + time '10:15'),
    (usuario, current_date, 500, current_date + time '13:40'),
    (usuario, current_date, 350, current_date + time '16:05');
  insert into public.ejercicios (usuario_id, fecha, minutos, nombre, kcal, creado_en) values
    (usuario, current_date, 20, 'Caminata rápida', 90, current_date + time '07:00'),
    (usuario, current_date, 15, 'Estiramiento', 40, current_date + time '12:30');
  insert into public.suenos (usuario_id, fecha, minutos) values (usuario, current_date, 405);

  -- Peso semanal de las últimas 12 semanas, de 81,4 a 78,0 kg.
  for n in 0..11 loop
    insert into public.pesos (usuario_id, fecha, kg) values
      (usuario, current_date - 1 - n * 7, 78.0 + n * 0.3 + (n % 3) * 0.1);
  end loop;
end;
$$;
