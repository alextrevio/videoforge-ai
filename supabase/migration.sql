-- ═══════════════════════════════════════════════════════════
-- VideoForge AI — Supabase Database Migration
-- ═══════════════════════════════════════════════════════════
-- Run this in Supabase Dashboard → SQL Editor → New Query
-- This creates all tables, RLS policies, and triggers needed.
-- ═══════════════════════════════════════════════════════════

-- 1. PROFILES (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT DEFAULT '',
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CHANNELS
CREATE TABLE IF NOT EXISTS public.channels (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  platform TEXT NOT NULL,
  niche TEXT NOT NULL,
  icon TEXT DEFAULT '📺',
  color TEXT DEFAULT '#666',
  status TEXT DEFAULT 'active',
  autopilot BOOLEAN DEFAULT false,
  autopilot_idea TEXT DEFAULT '',
  autopilot_per_day INTEGER DEFAULT 3,
  autopilot_duration TEXT DEFAULT '60',
  autopilot_platforms TEXT[] DEFAULT ARRAY['youtube'],
  oauth_token TEXT,
  oauth_refresh TEXT,
  oauth_expires_at TIMESTAMPTZ,
  platform_channel_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. VIDEOS
CREATE TABLE IF NOT EXISTS public.videos (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  channel_id TEXT NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  script TEXT DEFAULT '',
  status TEXT DEFAULT 'script',
  progress INTEGER DEFAULT 0,
  duration TEXT DEFAULT '1:00',
  scheduled_date DATE,
  scheduled_time TEXT,
  platforms TEXT[] DEFAULT ARRAY['youtube'],
  audio_url TEXT,
  video_url TEXT,
  thumbnail_url TEXT,
  render_data JSONB,
  published_at TIMESTAMPTZ,
  platform_video_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. JOBS (processing queue)
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  video_id TEXT NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  result JSONB,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- 5. ROW LEVEL SECURITY
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "Users see own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users see own channels" ON public.channels;
DROP POLICY IF EXISTS "Users see own videos" ON public.videos;
DROP POLICY IF EXISTS "Users see own jobs" ON public.jobs;

CREATE POLICY "Users see own profile" ON public.profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users see own channels" ON public.channels FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see own videos" ON public.videos FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see own jobs" ON public.jobs FOR ALL USING (auth.uid() = user_id);

-- 6. AUTO-CREATE PROFILE ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. INDEXES
CREATE INDEX IF NOT EXISTS idx_channels_user ON public.channels(user_id);
CREATE INDEX IF NOT EXISTS idx_videos_user ON public.videos(user_id);
CREATE INDEX IF NOT EXISTS idx_videos_channel ON public.videos(channel_id);
CREATE INDEX IF NOT EXISTS idx_videos_status ON public.videos(status);
CREATE INDEX IF NOT EXISTS idx_videos_scheduled ON public.videos(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_jobs_video ON public.jobs(video_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);

-- ═══════════════════════════════════════════════════════════
-- DONE! Now add these env vars to Vercel:
--   NEXT_PUBLIC_SUPABASE_URL     → from Supabase Dashboard → Settings → API
--   NEXT_PUBLIC_SUPABASE_ANON_KEY → from Supabase Dashboard → Settings → API
-- ═══════════════════════════════════════════════════════════
