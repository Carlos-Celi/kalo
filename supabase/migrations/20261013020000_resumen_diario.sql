-- Totales por día para las gráficas de Progreso.
--
-- Un año de registros supera el máximo de filas que devuelve la API, así que
-- el resumen se calcula en la base de datos: una fila por día del rango.
-- Es `security invoker`: se ejecuta con los permisos de quien la llama y RLS
-- sigue limitando los datos a los del propio usuario.

create function public.resumen_diario(desde date, hasta date)
returns table (
  fecha date,
  kcal integer,
  proteina_g numeric,
  azucar_g numeric,
  grasa_g numeric,
  agua_ml integer,
  ejercicio_min integer,
  ejercicio_kcal integer,
  sueno_min integer,
  bebidas_alcohol integer,
  kcal_alcohol integer
)
language sql
stable
security invoker
set search_path = ''
as $$
  with dias as (
    -- Como mucho 400 días por llamada.
    select generate_series(desde, least(hasta, desde + 399), interval '1 day')::date as fecha
  ),
  comida as (
    select
      c.fecha,
      sum(c.kcal) as kcal,
      sum(c.proteina_g) as proteina_g,
      sum(c.azucar_g) as azucar_g,
      sum(c.grasa_g) as grasa_g,
      count(*) filter (where c.es_alcohol) as bebidas_alcohol,
      coalesce(sum(c.kcal) filter (where c.es_alcohol), 0) as kcal_alcohol
    from public.comidas c
    where c.fecha between desde and hasta
    group by c.fecha
  ),
  agua as (
    select a.fecha, sum(a.ml) as ml
    from public.aguas a
    where a.fecha between desde and hasta
    group by a.fecha
  ),
  ejercicio as (
    select e.fecha, sum(e.minutos) as minutos, sum(e.kcal) as kcal
    from public.ejercicios e
    where e.fecha between desde and hasta
    group by e.fecha
  )
  select
    d.fecha,
    coalesce(comida.kcal, 0)::integer,
    coalesce(comida.proteina_g, 0),
    coalesce(comida.azucar_g, 0),
    coalesce(comida.grasa_g, 0),
    coalesce(agua.ml, 0)::integer,
    coalesce(ejercicio.minutos, 0)::integer,
    coalesce(ejercicio.kcal, 0)::integer,
    coalesce(s.minutos, 0)::integer,
    coalesce(comida.bebidas_alcohol, 0)::integer,
    coalesce(comida.kcal_alcohol, 0)::integer
  from dias d
  left join comida on comida.fecha = d.fecha
  left join agua on agua.fecha = d.fecha
  left join ejercicio on ejercicio.fecha = d.fecha
  left join public.suenos s on s.fecha = d.fecha
  order by d.fecha;
$$;

revoke execute on function public.resumen_diario(date, date) from public, anon;
grant execute on function public.resumen_diario(date, date) to authenticated;
