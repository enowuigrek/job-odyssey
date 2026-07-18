-- Poprzednia wersja delete_user() (20260715_add_delete_user.sql) próbowała
-- kasować pliki bezpośrednim `delete from storage.objects` — Supabase to
-- blokuje ("Direct deletion from storage tables is not allowed. Use the
-- Storage API instead"), więc cała funkcja rzucała błąd i nic się nie
-- usuwało (błąd w środku plpgsql cofa całą transakcję, dane bezpieczne).
-- Czyszczenie plików przeniesione do klienta (deleteAllUserStorageFiles
-- w src/lib/db.ts, wołane PRZED tym RPC) — ta wersja usuwa tylko wiersze
-- w tabelach i konto w auth.users.
create or replace function public.delete_user()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Brak zalogowanego użytkownika';
  end if;

  delete from public.cv_clicks
    where token in (select token from public.cv_tracking_links where user_id = uid);
  delete from public.cv_tracking_links where user_id = uid;

  delete from public.interviews where user_id = uid;
  delete from public.applications where user_id = uid;
  delete from public.cvs where user_id = uid;
  delete from public.questions where user_id = uid;
  delete from public.stories where user_id = uid;

  delete from public.profile_certificates where user_id = uid;
  delete from public.profile_descriptions where user_id = uid;
  delete from public.profile_education where user_id = uid;
  delete from public.profile_experiences where user_id = uid;
  delete from public.profile_projects where user_id = uid;
  delete from public.profile_tech_categories where user_id = uid;
  delete from public.candidate_profile where user_id = uid;
  delete from public.user_settings where user_id = uid;

  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_user() from public, anon;
grant execute on function public.delete_user() to authenticated;
