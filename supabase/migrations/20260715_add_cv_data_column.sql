-- Treść CV z generatora (dotąd tylko w localStorage per przeglądarka —
-- edycja/podgląd w generatorze nie działały na innym urządzeniu). Trzymana
-- jako jsonb obok metadanych CV, żeby korzystać z istniejącego mechanizmu
-- synchronizacji (diffAndSync po updatedAt w AppContext).
alter table cvs
  add column if not exists data jsonb;
