-- Licznik importów CV przez AI (funkcja "Importuj z CV") — limit 1x na wersję
-- próbną, 10/miesiąc na pełnej wersji jako zabezpieczenie przed nadużyciem
-- (nie realny limit produktowy, tylko ochrona kosztu wywołań LLM).
alter table user_settings
  add column if not exists ai_import_count integer not null default 0,
  add column if not exists ai_import_month text;

-- SECURITY DEFINER, bo edge function parse-cv woła to jako zalogowany user
-- (auth.uid() z jego własnego JWT) — sprawdza i inkrementuje atomowo w jednym
-- wywołaniu, PRZED wywołaniem LLM, żeby nieudane/odrzucone żądanie nie
-- zjadało limitu. Wzorowane na redeem_access_code() z 20260716_add_trial_access_codes.sql.
create or replace function public.check_and_increment_ai_import(p_limit integer, p_current_month text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  v_count integer;
  v_month text;
begin
  if uid is null then
    raise exception 'Brak zalogowanego użytkownika';
  end if;

  select ai_import_count, ai_import_month into v_count, v_month
    from public.user_settings where user_id = uid for update;

  if v_count is null then
    v_count := 0;
  end if;

  if v_month is distinct from p_current_month then
    v_count := 0;
  end if;

  if v_count >= p_limit then
    return false;
  end if;

  insert into public.user_settings (user_id, ai_import_count, ai_import_month, updated_at)
  values (uid, v_count + 1, p_current_month, now())
  on conflict (user_id) do update
    set ai_import_count = v_count + 1, ai_import_month = p_current_month, updated_at = now();

  return true;
end;
$$;

revoke all on function public.check_and_increment_ai_import(integer, text) from public, anon;
grant execute on function public.check_and_increment_ai_import(integer, text) to authenticated;
