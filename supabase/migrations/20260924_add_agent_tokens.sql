-- Osobiste tokeny dla zewnętrznego agenta (np. zaplanowanej sesji Claude Code), który
-- szuka ofert i dodaje aplikacje z CV przez edge function agent-api. Token widzi
-- wyłącznie dane swojego właściciela. W bazie trzymamy tylko hash SHA-256 — sam token
-- użytkownik widzi raz, przy generowaniu w Ustawieniach.
create table if not exists agent_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token_hash text not null unique,
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);

create index if not exists agent_tokens_user_id_idx on agent_tokens(user_id);

alter table agent_tokens enable row level security;

-- User zarządza tylko swoimi tokenami; agent-api szuka po hashu kluczem service role.
drop policy if exists "agent_tokens_select_own" on agent_tokens;
create policy "agent_tokens_select_own" on agent_tokens
  for select using (auth.uid() = user_id);

drop policy if exists "agent_tokens_insert_own" on agent_tokens;
create policy "agent_tokens_insert_own" on agent_tokens
  for insert with check (auth.uid() = user_id);

drop policy if exists "agent_tokens_delete_own" on agent_tokens;
create policy "agent_tokens_delete_own" on agent_tokens
  for delete using (auth.uid() = user_id);
