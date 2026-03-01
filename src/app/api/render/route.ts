import { NextRequest, NextResponse } from 'next/server'

// POST /api/render
// Full video render pipeline:
// 1. Script → 2. Subtitles → 3. Media → 4. Voiceover → 5. Compose → 6. Upload
// This is the main endpoint the frontend calls to produce a complete video
export async function POST(req: NextRequest) {
  try {
    const { videoId, title, description, script, niche, duration, voice, lang, platforms } = await req.json()
    const baseUrl = new URL(req.url).origin
    const durSec = parseInt(duration?.replace(/[^0-9]/g, '') || '40')
    const results: Record<string, any> = { videoId, steps: {} }

    // ── Step 1: Generate script if not provided ──
    let finalScript = script
    if (!finalScript || finalScript.length < 20) {
      const scriptRes = await fetch(`${baseUrl}/api/generate/script`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, niche, duration: String(durSec), lang: lang || 'es-MX' }),
      })
      const scriptData = await scriptRes.json()
      finalScript = scriptData.script || `${title}. ${description}`
      results.steps.script = { mode: scriptData.mode, length: finalScript.length }
    }

    // ── Step 2: Generate subtitles (word-level timestamps) ──
    const subRes = await fetch(`${baseUrl}/api/generate/subtitles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ script: finalScript, duration: String(durSec) }),
    })
    const subData = await subRes.json()
    const subtitles = subData.subtitles || []
    results.steps.subtitles = { count: subtitles.length, mode: subData.mode }

    // ── Step 3: Split script into scenes ──
    const sentences = finalScript
      .replace(/\[.*?\]/g, '')
      .split(/(?<=[.!?])\s+/)
      .filter((s: string) => s.trim().length > 10)
    
    const maxScenes = Math.min(Math.ceil(durSec / 5), 8) // ~5 sec per scene, max 8
    const sceneDur = durSec / Math.min(sentences.length, maxScenes)
    
    const scenes = sentences.slice(0, maxScenes).map((text: string, i: number) => ({
      text: text.trim(),
      startSec: i * sceneDur,
      endSec: (i + 1) * sceneDur,
    }))
    results.steps.scenes = { count: scenes.length, duration: sceneDur }

    // ── Step 4: Fetch stock media for each scene ──
    const mediaRes = await fetch(`${baseUrl}/api/generate/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenes, niche }),
    })
    const mediaData = await mediaRes.json()
    const media = mediaData.media || []

    // Merge media into scenes
    const enrichedScenes = scenes.map((scene: any, i: number) => ({
      ...scene,
      imageUrl: media[i]?.imageUrl || null,
      bgColor: null,
    }))
    results.steps.media = { mode: mediaData.mode, found: media.filter((m: any) => m.imageUrl).length }

    // ── Step 5: Generate voiceover ──
    const voRes = await fetch(`${baseUrl}/api/generate/voiceover`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ script: finalScript, voice: voice || 'mateo', videoId }),
    })
    const voData = await voRes.json()
    results.steps.voiceover = { mode: voData.mode, hasAudio: !!voData.audioUrl }

    // If Whisper is available and we got real audio, re-generate subtitles with real timestamps
    if (voData.audioUrl && voData.mode === 'elevenlabs' && process.env.OPENAI_API_KEY) {
      const realSubRes = await fetch(`${baseUrl}/api/generate/subtitles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script: finalScript, audioUrl: voData.audioUrl, duration: String(durSec) }),
      })
      const realSubData = await realSubRes.json()
      if (realSubData.subtitles?.length > 0) {
        results.steps.subtitles = { count: realSubData.subtitles.length, mode: realSubData.mode }
        // Use Whisper subtitles instead
        Object.assign(subtitles, realSubData.subtitles)
      }
    }

    // ── Step 6: Compose video ──
    // Niche color palettes
    const NICHE_COLORS: Record<string, { accent: string; bg: [string, string] }> = {
      history: { accent: '#E8A838', bg: ['#1a0a00', '#2a1500'] },
      kids: { accent: '#4ECDC4', bg: ['#001a1a', '#002a2a'] },
      facts: { accent: '#A855F7', bg: ['#0a001a', '#150030'] },
      horror: { accent: '#6366F1', bg: ['#0a0a0a', '#15001a'] },
      motivation: { accent: '#EF4444', bg: ['#1a0500', '#2a0800'] },
      tech: { accent: '#06B6D4', bg: ['#000a1a', '#001530'] },
      lifestyle: { accent: '#EC4899', bg: ['#1a0010', '#2a0018'] },
      finance: { accent: '#22C55E', bg: ['#001a0a', '#002a12'] },
      gaming: { accent: '#8B5CF6', bg: ['#10001a', '#1a0030'] },
      other: { accent: '#F97316', bg: ['#0a0a12', '#12122a'] },
    }
    const palette = NICHE_COLORS[niche] || NICHE_COLORS.other

    const compositionData = {
      scenes: enrichedScenes,
      subtitles,
      audioUrl: voData.audioUrl || null,
      title,
      niche,
      accentColor: palette.accent,
      bgGradient: palette.bg,
      fps: 30,
      durationInFrames: durSec * 30,
      durationSec: durSec,
    }

    // Try Shotstack for rendering
    const shotKey = process.env.SHOTSTACK_API_KEY
    if (shotKey) {
      const renderRes = await fetch(`${baseUrl}/api/generate/video`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId, title, script: finalScript,
          audioUrl: voData.audioUrl, duration: String(durSec), niche,
        }),
      })
      const renderData = await renderRes.json()
      results.steps.render = { mode: 'shotstack', renderId: renderData.renderId }
      results.status = 'rendering'
      results.renderId = renderData.renderId
    } else {
      // No render engine — store composition data for client-side preview
      results.steps.render = { mode: 'preview-only' }
      results.status = 'preview'
    }

    results.composition = compositionData
    results.script = finalScript

    return NextResponse.json(results)
  } catch (error: any) {
    return NextResponse.json({ error: error.message, status: 'failed' }, { status: 500 })
  }
}
