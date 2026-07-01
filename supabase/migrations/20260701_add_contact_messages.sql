-- Contact form submissions from the public landing page.
-- Anyone can insert (anonymous visitors); nobody can read/update/delete via the API —
-- messages are reviewed directly in the Supabase Dashboard table editor.

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  created_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;

create policy "anyone_can_submit_contact_message"
  on public.contact_messages
  for insert
  to public
  with check (true);
