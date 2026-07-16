-- Linki śledzące zapisane bez protokołu (np. "www.linkedin.com/...") psuły
-- przekierowanie: Location bez schematu jest traktowane przez przeglądarkę
-- jako ścieżka względna i dokleja się do adresu funkcji track.
update cv_tracking_links
  set target_url = 'https://' || target_url
  where target_url !~* '^https?://';
