import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60

// Voice IDs by niche mood (ElevenLabs premade voices)
const NICHE_VOICES: Record<string, string> = {
  infantil: 'EXAVITQu4vr4xnSDxMaL',    // Sarah — warm, friendly
  historia: 'onwK4e9ZLuTAKqWW03F9',     // Daniel — authoritative
  curiosidades: 'pFZP5JQG7iQjIQuC4Bku',  // Lily — energetic
  terror: 'N2lVS1w4EtoT3dr4eOWO',       // Callum — deep, dramatic
  motivacion: 'TX3LPaxmHKxFdv7VOQHJ',   // Liam — powerful
  tecnologia: 'iP95p4xoKVk53GoZ742B',   // Chris — clear, modern
  lifestyle: 'XB0fDUnXU5powFXDhCwa',     // Charlotte — relaxed
  finanzas: 'onwK4e9ZLuTAKqWW03F9',     // Daniel — trustworthy
  gaming: 'pFZP5JQG7iQjIQuC4Bku',       // Lily — excited
}

// POST /api/generate/voiceover
// Generates TTS audio with word-level timestamps using ElevenLabs
export async function POST(req: NextRequest) {
  try {
    const { script, niche, lang } = await req.json()

    const apiKey = process.env.ELEVENLABS_API_KEY
    if (!apiKey) {
      return NextResponse.json({ audioUrl: null, wordTimestamps: [], mode: 'no-key' })
    }

    if (!script || script.length < 10) {
      return NextResponse.json({ audioUrl: null, wordTimestamps: [], mode: 'empty' })
    }

    // Clean script: remove stage directions, sound cues
    const cleanScript = script
      .replace(/\[.*?\]/g, '')
      .replace(/\(.*?\)/g, '')
      .replace(/\*.*?\*/g, '')
      .replace(/Escena \d+:/g, '')
      .replace(/NARRACIÓN:|DIÁLOGO:|VISUAL:|SONIDO:|EMOCIÓN:/gi, '')
      .replace(/\n{2,}/g, '. ')
      .replace(/\s{2,}/g, ' ')
      .trim()
      .slice(0, 3000) // ElevenLabs limit

    const voiceId = NICHE_VOICES[niche?.toLowerCase()] || 'EXAVITQu4vr4xnSDxMaL'

    // Use the with-timestamps endpoint for word-level timing
    const ttsRes = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify({
          text: cleanScript,
          model_id: 'eleven_multilingual_v2',
          language_code: lang === 'en' ? 'en' : 'es',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.4,
            use_speaker_boost: true,
          },
        }),
      }
    )

    if (!ttsRes.ok) {
      const err = await ttsRes.text()
      console.error('[ElevenLabs] Error:', ttsRes.status, err.slice(0, 300))
      return NextResponse.json({ audioUrl: null, error: err.slice(0, 200), mode: 'error' })
    }

    const ttsData = await ttsRes.json()

    // Response has: audio_base64, alignment (characters, character_start_times_seconds, character_end_times_seconds)
    const audioBase64 = ttsData.audio_base64
    const alignment = ttsData.alignment || {}

    // Build word timestamps from character alignment
    const chars = alignment.characters || []
    const startTimes = alignment.character_start_times_seconds || []
    const endTimes = alignment.character_end_times_seconds || []

    const wordTimestamps: any[] = []
    let currentWord = ''
    let wordStart = 0

    for (let i = 0; i < chars.length; i++) {
      if (chars[i] === ' ' || chars[i] === '\n' || i === chars.length - 1) {
        if (i === chars.length - 1 && chars[i] !== ' ') currentWord += chars[i]
        if (currentWord.trim().length > 0) {
          wordTimestamps.push({
            word: currentWord.trim(),
            start: wordStart,
            end: endTimes[i] || wordStart + 0.3,
          })
        }
        currentWord = ''
        wordStart = startTimes[i + 1] || endTimes[i] || 0
      } else {
        if (currentWord.length === 0) wordStart = startTimes[i] || 0
        currentWord += chars[i]
      }
    }

    // Convert base64 audio to a data URL (will be used by Shotstack)
    const audioDataUrl = `data:audio/mpeg;base64,${audioBase64}`

    // Calculate total audio duration
    const audioDuration = endTimes.length > 0 ? endTimes[endTimes.length - 1] : 0

    console.log('[ElevenLabs] Generated:', Math.round(audioDuration), 'seconds,', wordTimestamps.length, 'words')

    return NextResponse.json({
      audioBase64,
      audioDataUrl,
      audioDuration,
      wordTimestamps,
      wordCount: wordTimestamps.length,
      mode: 'elevenlabs',
    })
  } catch (error: any) {
    console.error('[ElevenLabs] Exception:', error.message)
    return NextResponse.json({ audioUrl: null, error: error.message, mode: 'error' })
  }
}
