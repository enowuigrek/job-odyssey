-- Ustawienia per użytkownik (na razie tylko własna domena linków
-- śledzących — kolejne globalne przełączniki appki lądują tu w przyszłości
-- zamiast w candidate_profile, który jest danymi CV, nie appki).
create table if not exists user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  tracking_domain text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table user_settings enable row level security;

drop policy if exists "Users can view own settings" on user_settings;
create policy "Users can view own settings" on user_settings
  for select using (user_id = auth.uid());

drop policy if exists "Users can insert own settings" on user_settings;
create policy "Users can insert own settings" on user_settings
  for insert with check (user_id = auth.uid());

drop policy if exists "Users can update own settings" on user_settings;
create policy "Users can update own settings" on user_settings
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
