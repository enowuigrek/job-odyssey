-- ============================================================
-- Zdjęcie profilowe kandydata
-- ============================================================

ALTER TABLE public.candidate_profile
  ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- ============================================================
-- Storage bucket: avatars (public — potrzebne do wyświetlania w PDF/CV
-- bez logowania, tak jak certificates)
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880,  -- 5 MB (po przycięciu i tak dużo mniej, ale limit na oryginalny upload)
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Publiczny odczyt zdjęć profilowych"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Właściciel może uploadować zdjęcie profilowe"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Właściciel może nadpisać zdjęcie profilowe"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Właściciel może usunąć zdjęcie profilowe"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
