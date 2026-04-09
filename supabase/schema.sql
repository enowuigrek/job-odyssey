-- ============================================================
-- Job Odyssey — Supabase Schema
-- Wklej całość w Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- CV tracking links
CREATE TABLE IF NOT EXISTS cv_tracking_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  application_id UUID NOT NULL,
  cv_id UUID,
  token TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  target_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CV Clicks (zapisywane przez Edge Function — bez auth)
CREATE TABLE IF NOT EXISTS cv_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL,
  clicked_at TIMESTAMPTZ DEFAULT NOW(),
  user_agent TEXT,
  referrer TEXT
);

-- Applications
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_name TEXT NOT NULL,
  position TEXT NOT NULL,
  job_url TEXT,
  location TEXT,
  salary_offered TEXT,
  salary_expected TEXT,
  status TEXT NOT NULL DEFAULT 'saved',
  applied_date TEXT,
  cv_id UUID,
  notes TEXT,
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

-- Interviews
CREATE TABLE IF NOT EXISTS interviews (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  application_id UUID NOT NULL,
  scheduled_date TEXT NOT NULL,
  duration INTEGER,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled',
  what_went_well TEXT,
  what_went_wrong TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

-- CVs
CREATE TABLE IF NOT EXISTS cvs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  file_name TEXT,
  target_position TEXT,
  keywords TEXT[],
  is_default BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

-- Questions
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  question TEXT NOT NULL,
  category TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'medium',
  positions TEXT[],
  my_answer TEXT,
  suggested_answer TEXT,
  times_asked INTEGER DEFAULT 0,
  last_asked_at TEXT,
  related_story_ids TEXT[],
  tags TEXT[],
  source TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

-- Stories
CREATE TABLE IF NOT EXISTS stories (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  situation TEXT NOT NULL,
  task TEXT NOT NULL,
  action TEXT NOT NULL,
  result TEXT NOT NULL,
  skills TEXT[],
  positions TEXT[],
  used_in_interviews TEXT[],
  effectiveness INTEGER,
  tags TEXT[],
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE cvs ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_tracking_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_applications" ON applications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_interviews" ON interviews FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_cvs" ON cvs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_questions" ON questions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_stories" ON stories FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_tracking_links" ON cv_tracking_links FOR ALL USING (auth.uid() = user_id);

-- cv_clicks: każdy może wstawić (edge function), tylko właściciel może czytać
CREATE POLICY "insert_clicks" ON cv_clicks FOR INSERT WITH CHECK (true);
CREATE POLICY "read_own_clicks" ON cv_clicks FOR SELECT
  USING (token IN (SELECT token FROM cv_tracking_links WHERE user_id = auth.uid()));

-- ============================================================
-- Storage bucket dla plików CV
-- ============================================================

INSERT INTO storage.buckets (id, name, public) VALUES ('cv-files', 'cv-files', false)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "cv_upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'cv-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "cv_read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'cv-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "cv_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'cv-files' AND auth.uid()::text = (storage.foldername(name))[1]);
