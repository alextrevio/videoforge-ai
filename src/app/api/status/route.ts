import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    version: '5.0.0',
    database: {
      supabase: { configured: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY), label: 'Supabase (Database)' },
    },
    apis: {
      openai:     { configured: !!process.env.OPENAI_API_KEY,     label: 'OpenAI GPT (Guiones + Prompts + Subtítulos)' },
      elevenlabs: { configured: !!process.env.ELEVENLABS_API_KEY, label: 'ElevenLabs (Narración con voz)' },
      fal:        { configured: !!process.env.FAL_KEY,             label: 'fal.ai (Kling Video + Sync LipSync)' },
      shotstack:  { configured: !!process.env.SHOTSTACK_API_KEY,  label: 'Shotstack (Render MP4 + Subtítulos)' },
      pexels:     { configured: !!process.env.PEXELS_API_KEY,     label: 'Pexels (Stock footage)' },
    },
    oauth: {
      google:   { configured: !!process.env.GOOGLE_CLIENT_ID,   label: 'YouTube' },
      tiktok:   { configured: !!process.env.TIKTOK_CLIENT_KEY,  label: 'TikTok' },
      facebook: { configured: !!process.env.FACEBOOK_APP_ID,    label: 'Instagram/Facebook' },
    },
  })
}
