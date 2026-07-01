-- Admin overview: aggregate, non-content stats per user, for tracking adoption
-- during the invite-only trial period. Deliberately does NOT expose row content
-- (CV text, application details, profile fields) — only counts and timestamps,
-- to keep this compatible with data-minimisation under RODO/GDPR.
--
-- Guarded by email inside the function (SECURITY DEFINER, bypasses RLS to read
-- auth.users) so only the app owner gets real rows back; anyone else calling
-- this RPC gets an empty result, not an error, so it doesn't leak who the
-- admin is either.

create or replace function public.admin_get_users_overview()
returns table (
  user_id uuid,
  email text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  email_confirmed boolean,
  applications_count bigint,
  cvs_count bigint,
  interviews_count bigint,
  has_profile boolean
)
language sql
security definer
set search_path = public, auth
as $$
  select
    u.id,
    u.email,
    u.created_at,
    u.last_sign_in_at,
    u.email_confirmed_at is not null,
    (select count(*) from public.applications a where a.user_id = u.id),
    (select count(*) from public.cvs c where c.user_id = u.id),
    (select count(*) from public.interviews i where i.user_id = u.id),
    exists(select 1 from public.candidate_profile p where p.user_id = u.id)
  from auth.users u
  where (select auth.email()) = 'enowuigrek@gmail.com'
  order by u.created_at desc;
$$;

grant execute on function public.admin_get_users_overview() to authenticated;
