-- Adds server-side read/dismissed status to CV click notifications so the
-- bell's unread count and notification list are consistent across devices
-- (previously tracked client-side only, in localStorage).
alter table cv_clicks
  add column if not exists read_at timestamptz,
  add column if not exists dismissed_at timestamptz;

create index if not exists idx_cv_clicks_dismissed_at
  on cv_clicks (dismissed_at)
  where dismissed_at is null;
