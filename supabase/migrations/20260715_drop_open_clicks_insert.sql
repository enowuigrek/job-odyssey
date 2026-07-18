-- Audyt RLS przed wypuszczeniem produktu: polityka insert_clicks miała
-- with_check = true, czyli KAŻDY z publicznym kluczem anon mógł wstawiać
-- sfabrykowane kliknięcia z dowolnym tokenem (spam powiadomień userów).
-- Jest zbędna — funkcja edge `track` wstawia kliknięcia kluczem serwisowym,
-- który omija RLS; frontend nigdy nie insertuje do cv_clicks.
drop policy if exists "insert_clicks" on cv_clicks;
