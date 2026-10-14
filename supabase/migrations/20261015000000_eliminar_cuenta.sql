-- Derecho de supresión: cada persona puede borrar su cuenta y todos sus datos
-- desde Configuración (docs/tecnica/decisiones/0011-politicas-y-control-de-datos.md).
--
-- Borrar la fila de auth.users arrastra, por `on delete cascade`, el perfil,
-- todos los registros (comidas con su foto, agua, ejercicio, sueño, siestas,
-- pesos), los recordatorios, los avisos enviados y las sesiones de Auth.
--
-- Es `security definer` porque el rol `authenticated` no puede tocar el
-- esquema auth. Solo borra a quien llama (auth.uid()), fija search_path
-- vacío y no es invocable por el rol anónimo.
create function public.eliminar_mi_cuenta()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  usuario uuid := auth.uid();
begin
  if usuario is null then
    raise exception 'Sin sesión' using errcode = '28000';
  end if;
  delete from auth.users where id = usuario;
end;
$$;

revoke execute on function public.eliminar_mi_cuenta() from public, anon;
grant execute on function public.eliminar_mi_cuenta() to authenticated;
