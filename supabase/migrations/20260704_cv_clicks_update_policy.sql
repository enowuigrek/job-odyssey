-- Odczyt/ukrywanie powiadomień nie zapisywało się do bazy: wiersze cv_clicks
-- wstawia edge function (service role), a klient nie miał polityki UPDATE —
-- update "przechodził" bez błędu, ale zmieniał 0 wierszy, więc po kolejnym
-- odświeżeniu wszystkie powiadomienia wracały.
drop policy if exists "Users can update clicks on own links" on cv_clicks;
create policy "Users can update clicks on own links" on cv_clicks
  for update
  using (token in (select token from cv_tracking_links where user_id = auth.uid()))
  with check (token in (select token from cv_tracking_links where user_id = auth.uid()));

-- Usuwanie pojedynczych linków śledzących z modala "Śledzone linki"
drop policy if exists "Users can delete own tracking links" on cv_tracking_links;
create policy "Users can delete own tracking links" on cv_tracking_links
  for delete
  using (user_id = auth.uid());
