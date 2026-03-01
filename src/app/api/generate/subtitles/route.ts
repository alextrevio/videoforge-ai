import { NextRequest, NextResponse } from 'next/server'

// POST /api/generate/subtitles
// Generates word-level timestamps for subtitles
// Uses OpenAI Whisper when configured, falls back to script-based estimation
export async function POST(req: NextRequest) {
  try {
    const { script, audioUrl, duration } = await req.json()

    const openaiKey = process.env.OPENAI_API_KEY

    // ── Method 1: Whisper transcription (real word-level timestamps) ──
    if (openaiKey && audioUrl && !audioUrl.startsWith('data:')) {
      try {
        // Download audio
        const audioRes = await fetch(audioUrl)
        const audioBlob = await audioRes.blob()

        const formData = new FormData()
        formData.append('file', audioBlob, 'audio.mp3')
        formData.append('model', 'whisper-1')
        formData.append('response_format', 'verbose_json')
        formData.append('timestamp_granularities[]', 'word')
        formData.append('language', 'es')

        const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${openaiKey}` },
          body: formData,
        })

        if (whisperRes.ok) {
          const data = await whisperRes.json()
          const words = (data.words || []).map((w: any) => ({
            word: w.word,
            start: w.start,
            end: w.end,
          }))
          return NextResponse.json({ subtitles: words, mode: 'whisper', language: 'es' })
        }
      } catch (e) {
        // Fall through to estimation
      }
    }

    // ── Method 2: Script-based estimation ──
    // When no Whisper available, generate timestamps from script text
    if (!script) {
      return NextResponse.json({ subtitles: [], mode: 'empty' })
    }

    const durSec = parseInt(duration?.replace(/[^0-9]/g, '') || '40')

    // Clean script: remove timestamps, stage directions, empty lines
    const cleanText = script
      .replace(/\[.*?\]/g, '')
      .replace(/\(.*?\)/g, '')
      .replace(/\n+/g, ' ')
      .trim()

    const words = cleanText.split(/\s+/).filter((w: string) => w.length > 0)
    if (words.length === 0) {
      return NextResponse.json({ subtitles: [], mode: 'empty' })
    }

    // Average words per second (narration speed ~2.5 words/sec for Spanish)
    const wps = words.length / durSec
    const wordDur = 1 / Math.max(wps, 1.5) // seconds per word

    const subtitles = words.map((word: string, i: number) => {
      const start = i * wordDur
      const end = start + wordDur * 0.9 // slight gap between words
      return {
        word: word.replace(/[.,;:!?"""]/g, ''), // clean punctuation for display
        start: Math.round(start * 100) / 100,
        end: Math.round(end * 100) / 100,
      }
    })

    return NextResponse.json({
      subtitles,
      mode: 'estimated',
      stats: {
        wordCount: words.length,
        duration: durSec,
        wordsPerSecond: Math.round(wps * 10) / 10,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
