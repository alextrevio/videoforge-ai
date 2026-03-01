-- ═══════════════════════════════════════════════════════════
-- VideoForge AI — Supabase Migration (Single User)
-- Run in Supabase Dashboard → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════

-- CHANNELS
CREATE TABLE IF NOT EXISTS public.channels (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'owner',
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- VIDEOS
CREATE TABLE IF NOT EXISTS public.videos (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'owner',
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_videos_channel ON public.videos(channel_id);
CREATE INDEX IF NOT EXISTS idx_videos_status ON public.videos(status);
CREATE INDEX IF NOT EXISTS idx_videos_scheduled ON public.videos(scheduled_date);

-- NO RLS — single user, no auth needed
-- If you want to add auth later, enable RLS and add policies

-- ═══════════════════════════════════════════════════════════
-- DONE! Add to Vercel:
--   NEXT_PUBLIC_SUPABASE_URL      → Supabase → Settings → API
--   NEXT_PUBLIC_SUPABASE_ANON_KEY → Supabase → Settings → API
-- ═══════════════════════════════════════════════════════════
