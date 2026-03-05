import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    version: '3.1.0',
    database: {
      supabase: { configured: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY), label: 'Supabase (Database)' },
    },
    apis: {
      openai:     { configured: !!process.env.OPENAI_API_KEY,     label: 'OpenAI GPT (Guiones + Subtítulos)' },
      elevenlabs: { configured: !!process.env.ELEVENLABS_API_KEY, label: 'ElevenLabs (Voz)' },
      pexels:     { configured: !!process.env.PEXELS_API_KEY,     label: 'Pexels (Stock footage)' },
      shotstack:  { configured: !!process.env.SHOTSTACK_API_KEY,  label: 'Shotstack (Render MP4)' },
    },
    oauth: {
      google:   { configured: !!process.env.GOOGLE_CLIENT_ID,       label: 'YouTube' },
      tiktok:   { configured: !!process.env.TIKTOK_CLIENT_KEY,      label: 'TikTok' },
      facebook: { configured: !!process.env.FACEBOOK_APP_ID,        label: 'Instagram/Facebook' },
    },
  })
}
