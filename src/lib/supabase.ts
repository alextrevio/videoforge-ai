import { createClient } from '@supabase/supabase-js'

// ── Supabase Client ─────────────────────────────────────
// Set these in Vercel env vars:
//   NEXT_PUBLIC_SUPABASE_URL
//   NEXT_PUBLIC_SUPABASE_ANON_KEY
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(url, key)
export const isSupabaseConfigured = () => !!(url && key)

// ── Database Types ──────────────────────────────────────
export interface DbUser {
  id: string
  email: string
  name: string
  plan: 'free' | 'pro' | 'enterprise'
  created_at: string
}

export interface DbChannel {
  id: string
  user_id: string
  name: string
  platform: string
  niche: string
  icon: string
  color: string
  status: string
  autopilot: boolean
  autopilot_idea: string
  autopilot_per_day: number
  autopilot_duration: string
  autopilot_platforms: string[]
  // OAuth tokens for publishing
  oauth_token: string | null
  oauth_refresh: string | null
  oauth_expires_at: string | null
  platform_channel_id: string | null
  created_at: string
}

export interface DbVideo {
  id: string
  user_id: string
  channel_id: string
  title: string
  description: string
  tags: string[]
  script: string
  status: string
  progress: number
  duration: string
  scheduled_date: string | null
  scheduled_time: string | null
  platforms: string[]
  // Generated assets
  audio_url: string | null
  video_url: string | null
  thumbnail_url: string | null
  // Publishing
  published_at: string | null
  platform_video_id: string | null
  created_at: string
}

export interface DbJob {
  id: string
  user_id: string
  video_id: string
  type: 'script' | 'voiceover' | 'visuals' | 'editing' | 'thumbnail' | 'publish'
  status: 'pending' | 'processing' | 'completed' | 'failed'
  result: any | null
  error: string | null
  created_at: string
  completed_at: string | null
}

// ── SQL Migration ───────────────────────────────────────
// Run this in Supabase SQL Editor to create all tables:
export const MIGRATION_SQL = `
-- Users (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT DEFAULT '',
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Channels
CREATE TABLE IF NOT EXISTS public.channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Videos
CREATE TABLE IF NOT EXISTS public.videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
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
  published_at TIMESTAMPTZ,
  platform_video_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Jobs (processing queue)
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  result JSONB,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own profile" ON public.profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users see own channels" ON public.channels FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see own videos" ON public.videos FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see own jobs" ON public.jobs FOR ALL USING (auth.uid() = user_id);

-- Auto-create profile on signup
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_channels_user ON public.channels(user_id);
CREATE INDEX IF NOT EXISTS idx_videos_user ON public.videos(user_id);
CREATE INDEX IF NOT EXISTS idx_videos_channel ON public.videos(channel_id);
CREATE INDEX IF NOT EXISTS idx_videos_status ON public.videos(status);
CREATE INDEX IF NOT EXISTS idx_jobs_video ON public.jobs(video_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
`
