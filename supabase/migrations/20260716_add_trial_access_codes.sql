-- System wersji próbnej przed wypuszczeniem produktu. `user_settings.plan`
-- ('trial' domyślnie / 'full') steruje limitami w UI (2 CV, 15 aplikacji).
-- Kody dostępu odblokowują pełną wersję bez integracji płatności — dodajesz
-- kod ręcznie w SQL Editor, dajesz go komuś do testów, wpisuje w Ustawieniach.
alter table user_settings
  add column if not exists plan text not null default 'trial';

-- Grandfather clause: kto już miał konto PRZED wdrożeniem tego systemu,
-- dostaje pełną wersję automatycznie — nikogo nie blokujemy wstecznie.
insert into user_settings (user_id, plan)
select id, 'full' from auth.users
on conflict (user_id) do update set plan = 'full';

-- Kody dostępu — świadomie BEZ żadnych polityk dla authenticated/anon.
-- Jedyny sposób odczytu/zapisu to funkcja redeem_access_code() niżej
-- (SECURITY DEFINER, omija RLS). Dodawanie kodów: ręcznie w SQL Editor, np.
--   insert into access_codes (code, max_uses) values ('ZNAJOMY2026', 1);
create table if not exists access_codes (
  code text primary key,
  plan text not null default 'full',
  max_uses int not null default 1,
  used_count int not null default 0,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

alter table access_codes enable row level security;

create or replace function public.redeem_access_code(p_code text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  v_code public.access_codes%rowtype;
begin
  if uid is null then
    raise exception 'Brak zalogowanego użytkownika';
  end if;

  select * into v_code from public.access_codes
    where code = upper(trim(p_code))
    for update;

  if not found then
    raise exception 'Nieprawidłowy kod dostępu';
  end if;

  if v_code.expires_at is not null and v_code.expires_at < now() then
    raise exception 'Ten kod dostępu wygasł';
  end if;

  if v_code.used_count >= v_code.max_uses then
    raise exception 'Ten kod dostępu został już wykorzystany';
  end if;

  update public.access_codes set used_count = used_count + 1 where code = v_code.code;

  insert into public.user_settings (user_id, plan, updated_at)
  values (uid, v_code.plan, now())
  on conflict (user_id) do update set plan = excluded.plan, updated_at = excluded.updated_at;

  return v_code.plan;
end;
$$;

revoke all on function public.redeem_access_code(text) from public, anon;
grant execute on function public.redeem_access_code(text) to authenticated;

-- Kody muszą być trzymane WIELKIMI literami — redeem_access_code() robi
-- upper(trim(...)) na wejściu, więc insert też powinien być wielkimi.
