-- Źródło aplikacji: 'ai' = utworzona importem paczki (oferta + CV dobrane przez AI),
-- NULL = dodana ręcznie. Dashboard porównuje odzew obu źródeł.
alter table applications
  add column if not exists origin text;
