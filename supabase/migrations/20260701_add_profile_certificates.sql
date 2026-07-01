-- ============================================================
-- Certyfikaty kandydata
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profile_certificates (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL DEFAULT '',
  issuer      TEXT        NOT NULL DEFAULT '',
  year        TEXT        NOT NULL DEFAULT '',
  file_url    TEXT,
  sort_order  INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profile_certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Użytkownicy zarządzają swoimi certyfikatami"
  ON public.profile_certificates
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- Storage bucket: certificates (public — URL potrzebny do trackowania)
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'certificates',
  'certificates',
  true,
  10485760,  -- 10 MB
  ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Publiczny odczyt plików certyfikatów"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'certificates');

CREATE POLICY "Właściciel może uploadować certyfikaty"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'certificates'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Właściciel może nadpisać certyfikat"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'certificates'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Właściciel może usunąć certyfikat"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'certificates'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
