import { NextRequest, NextResponse } from 'next/server'

// POST /api/generate/voiceover
// Generates audio narration using ElevenLabs
export async function POST(req: NextRequest) {
  try {
    const { script, voice, videoId } = await req.json()

    const apiKey = process.env.ELEVENLABS_API_KEY
    if (!apiKey) {
      return NextResponse.json({
        audioUrl: null,
        duration: 60,
        mode: 'simulation',
        message: 'ElevenLabs no configurado. Set ELEVENLABS_API_KEY en Vercel.',
      })
    }

    // Voice ID mapping
    const voiceMap: Record<string, string> = {
      mateo: 'pNInz6obpgDQGcFmaJgB',   // Adam (neutral male)
      sofia: 'EXAVITQu4vr4xnSDxMaL',    // Sarah (female)
      carlos: 'onwK4e9ZLuTAKqWW03F9',   // Daniel (deep male)
    }
    const voiceId = voiceMap[voice] || voiceMap.mateo

    // Clean script for narration (remove timestamps and stage directions)
    const cleanScript = script
      .replace(/\[.*?\]/g, '')
      .replace(/\(.*?\)/g, '')
      .trim()

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text: cleanScript,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.4,
          use_speaker_boost: true,
        },
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      return NextResponse.json({ error: `ElevenLabs error: ${err}` }, { status: 500 })
    }

    // Return audio as base64 (in production, upload to S3/R2 and return URL)
    const audioBuffer = await response.arrayBuffer()
    const base64 = Buffer.from(audioBuffer).toString('base64')

    return NextResponse.json({
      audioUrl: `data:audio/mpeg;base64,${base64}`,
      duration: Math.round(cleanScript.split(' ').length / 2.5), // estimate
      mode: 'elevenlabs',
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
