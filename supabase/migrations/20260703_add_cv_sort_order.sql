-- Własna kolejność kafelków w Bazie CV (przeciąganie) — trzymana w bazie,
-- żeby układ był taki sam na każdym urządzeniu.
alter table cvs
  add column if not exists sort_order integer;
