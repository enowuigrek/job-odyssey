-- Funkcja delete_user, którą woła przycisk "Usuń konto" (SettingsPage →
-- supabase.rpc('delete_user')), NIGDY nie istniała w bazie — przycisk był
-- martwy (audyt przed wypuszczeniem, 2026-07-15). SECURITY DEFINER wykonuje
-- się z prawami właściciela funkcji, więc może usunąć konto z auth.users.
-- Kasuje wszystkie dane usera, jego pliki w storage i samo konto.
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

  -- Kliknięcia nie mają user_id — kasowane po tokenach linków usera
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

  -- Pliki w storage (ścieżki uploadów mają prefiks <userId>/)
  delete from storage.objects
    where bucket_id in ('cv-files', 'certificates')
      and name like uid::text || '/%';

  -- Samo konto
  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_user() from public, anon;
grant execute on function public.delete_user() to authenticated;
