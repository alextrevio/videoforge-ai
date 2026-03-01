import { NextRequest, NextResponse } from 'next/server'

// Transition pool for auto-assignment
const TRANSITIONS = ['zoom-in', 'slide-left', 'flash', 'zoom-out', 'slide-right', 'glitch', 'zoom-in', 'slide-left']

// Royalty-free music URLs by mood (Pixabay/Mixkit style CDN)
// In production, host these in Supabase Storage
const MUSIC_BY_NICHE: Record<string, string> = {
  history: 'https://cdn.pixabay.com/audio/2024/11/29/audio_e4f02db1b2.mp3',
  kids: 'https://cdn.pixabay.com/audio/2024/09/18/audio_c3ccff8088.mp3',
  facts: 'https://cdn.pixabay.com/audio/2024/02/14/audio_8e153f12e5.mp3',
  horror: 'https://cdn.pixabay.com/audio/2024/10/06/audio_1d7e235584.mp3',
  motivation: 'https://cdn.pixabay.com/audio/2024/05/16/audio_166b243548.mp3',
  tech: 'https://cdn.pixabay.com/audio/2024/02/14/audio_8e153f12e5.mp3',
  lifestyle: 'https://cdn.pixabay.com/audio/2024/09/18/audio_c3ccff8088.mp3',
  finance: 'https://cdn.pixabay.com/audio/2024/05/16/audio_166b243548.mp3',
  gaming: 'https://cdn.pixabay.com/audio/2024/11/29/audio_e4f02db1b2.mp3',
  other: 'https://cdn.pixabay.com/audio/2024/02/14/audio_8e153f12e5.mp3',
}

// Niche color palettes
const NICHE_PALETTE: Record<string, { accent: string; bg: [string, string] }> = {
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

// Emphasis keywords — words that get dramatic zoom + emoji + shake
const EMPHASIS_WORDS = new Set([
  // Spanish — impacto
  'increíble','impactante','secreto','peligro','mortal','millones','billones',
  'nunca','siempre','jamás','prohibido','misterio','imposible','terrible',
  'brutal','épico','apocalipsis','destrucción','muerte','asesinato',
  'brillante','genio','legendario','histórico','insólito','sorprendente',
  'catastrófico','devastador','extraordinario','fenomenal','colosal',
  'aterrador','escalofriante','macabro','siniestro','maldito','oscuro',
  'poderoso','invencible','indestructible','letal','tóxico','radiactivo',
  'explosión','guerra','batalla','conquista','imperio','revolución',
  'fortuna','tesoro','riqueza','diamante','oro','platino',
  'descubrimiento','revelación','conspiración','verdad','mentira',
  'gigante','enorme','masivo','diminuto','microscópico','invisible',
  'velocidad','relámpago','instante','eterno','infinito',
  'primero','último','único','mejor','peor','mayor','menor',
  // English — impact
  'incredible','shocking','secret','danger','deadly','millions','billions',
  'never','always','forbidden','mystery','impossible','brutal','epic',
  'amazing','legendary','insane','crazy','unbelievable','mind-blowing',
  'catastrophic','devastating','extraordinary','phenomenal','colossal',
  'terrifying','sinister','cursed','dark','powerful','invincible',
  'lethal','toxic','radioactive','explosion','war','battle','empire',
  'fortune','treasure','diamond','gold','discovery','conspiracy',
  'giant','massive','tiny','invisible','lightning','eternal','infinite',
  'first','last','only','best','worst','biggest','smallest',
])

export async function POST(req: NextRequest) {
  try {
    const { videoId, title, description, script, niche, duration, voice, lang } = await req.json()
    const baseUrl = new URL(req.url).origin
    const durSec = parseInt(duration?.replace(/[^0-9]/g, '') || '40')
    const results: Record<string, any> = { videoId, steps: {} }
    const palette = NICHE_PALETTE[niche] || NICHE_PALETTE.other

    // ═══════════════════════════════════════════════════
    // STEP 1: SCRIPT
    // ═══════════════════════════════════════════════════
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
    } else {
      results.steps.script = { mode: 'provided', length: finalScript.length }
    }

    // ═══════════════════════════════════════════════════
    // STEP 2: EXTRACT HOOK (first sentence for first 2 sec)
    // ═══════════════════════════════════════════════════
    const cleanText = finalScript.replace(/\[.*?\]/g, '').replace(/\(.*?\)/g, '').trim()
    const firstSentence = cleanText.split(/[.!?]/)[0]?.trim() || title
    const hookText = firstSentence.length > 40 ? firstSentence.slice(0, 40) + '...' : firstSentence
    results.steps.hook = { text: hookText }

    // ═══════════════════════════════════════════════════
    // STEP 3: SPLIT INTO SCENES (every 3-5 sec)
    // ═══════════════════════════════════════════════════
    const sentences = cleanText
      .split(/(?<=[.!?])\s+/)
      .filter((s: string) => s.trim().length > 8)

    // Target: ~3 seconds per scene for rapid feel
    const targetSceneDur = 3
    const maxScenes = Math.min(Math.ceil(durSec / targetSceneDur), 12)
    const actualScenes = Math.min(sentences.length, maxScenes)
    const sceneDur = durSec / actualScenes

    // Leave 2 sec for hook
    const contentStart = 2
    const contentDur = durSec - contentStart

    const scenes = sentences.slice(0, actualScenes).map((text: string, i: number) => ({
      text: text.trim(),
      startSec: contentStart + (i * (contentDur / actualScenes)),
      endSec: contentStart + ((i + 1) * (contentDur / actualScenes)),
      transition: TRANSITIONS[i % TRANSITIONS.length],
    }))
    results.steps.scenes = { count: scenes.length, avgDuration: Math.round(sceneDur * 10) / 10 }

    // ═══════════════════════════════════════════════════
    // STEP 4: FETCH B-ROLL MEDIA (multiple images per scene)
    // ═══════════════════════════════════════════════════
    // Request 2-3 images per scene for rapid B-roll cuts
    const expandedScenes = scenes.flatMap((s: any, i: number) => {
      const subDur = (s.endSec - s.startSec) / 2 // 2 clips per scene
      return [
        { text: s.text.split(' ').slice(0, 4).join(' '), startSec: s.startSec, endSec: s.startSec + subDur },
        { text: s.text.split(' ').slice(4, 8).join(' ') || niche, startSec: s.startSec + subDur, endSec: s.endSec },
      ]
    })

    const mediaRes = await fetch(`${baseUrl}/api/generate/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenes: expandedScenes, niche }),
    })
    const mediaData = await mediaRes.json()
    const media = mediaData.media || []

    // Assign media to scenes: main image + B-roll clips
    const enrichedScenes = scenes.map((scene: any, i: number) => {
      const mainMedia = media[i * 2]
      const bRollMedia = media[i * 2 + 1]
      return {
        ...scene,
        imageUrl: mainMedia?.imageUrl || null,
        bRoll: bRollMedia?.imageUrl ? [{
          url: bRollMedia.imageUrl,
          type: 'image' as const,
          startSec: scene.startSec + (scene.endSec - scene.startSec) / 2,
          endSec: scene.endSec,
        }] : [],
      }
    })
    results.steps.media = {
      mode: mediaData.mode,
      mainImages: media.filter((m: any, i: number) => i % 2 === 0 && m.imageUrl).length,
      bRollClips: media.filter((m: any, i: number) => i % 2 === 1 && m.imageUrl).length,
    }

    // ═══════════════════════════════════════════════════
    // STEP 5: VOICEOVER
    // ═══════════════════════════════════════════════════
    const voRes = await fetch(`${baseUrl}/api/generate/voiceover`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ script: finalScript, voice: voice || 'mateo', videoId }),
    })
    const voData = await voRes.json()
    results.steps.voiceover = { mode: voData.mode, hasAudio: !!voData.audioUrl }

    // ═══════════════════════════════════════════════════
    // STEP 6: SUBTITLES WITH EMPHASIS
    // ═══════════════════════════════════════════════════
    const subRes = await fetch(`${baseUrl}/api/generate/subtitles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        script: finalScript,
        audioUrl: voData.mode === 'elevenlabs' ? voData.audioUrl : null,
        duration: String(durSec),
      }),
    })
    const subData = await subRes.json()

    // Mark emphasis words
    const subtitles = (subData.subtitles || []).map((w: any) => ({
      ...w,
      // Offset subtitles by hook duration
      start: w.start + contentStart,
      end: w.end + contentStart,
      emphasis: EMPHASIS_WORDS.has(w.word.toLowerCase()),
    }))
    results.steps.subtitles = {
      count: subtitles.length,
      mode: subData.mode,
      emphasisCount: subtitles.filter((w: any) => w.emphasis).length,
    }

    // ═══════════════════════════════════════════════════
    // STEP 7: MUSIC TRACK
    // ═══════════════════════════════════════════════════
    const musicUrl = MUSIC_BY_NICHE[niche] || MUSIC_BY_NICHE.other
    results.steps.music = { niche, hasMusic: true }

    // ═══════════════════════════════════════════════════
    // STEP 8: CTA TEXT
    // ═══════════════════════════════════════════════════
    const CTA_BY_NICHE: Record<string, string> = {
      history: '¿Qué civilización quieres conocer?',
      kids: '¡Dale like si quieres más!',
      facts: '¿Sabías esto? ¡Comparte!',
      horror: '¿Te atreves a ver el siguiente?',
      motivation: '¡Tú puedes! Suscríbete',
      tech: 'El futuro es ahora',
      lifestyle: '✨ Sígueme para más tips',
      finance: '💰 Suscríbete y aprende',
      gaming: '🎮 ¡Más en el siguiente video!',
      other: '¡Suscríbete para más!',
    }
    const ctaText = CTA_BY_NICHE[niche] || CTA_BY_NICHE.other
    results.steps.cta = { text: ctaText }

    // ═══════════════════════════════════════════════════
    // STEP 9: COMPOSE
    // ═══════════════════════════════════════════════════
    const compositionData = {
      scenes: enrichedScenes,
      subtitles,
      audioUrl: voData.audioUrl || null,
      musicUrl,
      musicVolume: 0.12,
      title,
      hookText,
      ctaText,
      niche,
      accentColor: palette.accent,
      bgGradient: palette.bg,
      fps: 30,
      durationInFrames: durSec * 30,
      durationSec: durSec,
    }

    // Try Shotstack render
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
      results.steps.render = { mode: 'preview' }
      results.status = 'preview'
    }

    results.composition = compositionData
    results.script = finalScript

    return NextResponse.json(results)
  } catch (error: any) {
    return NextResponse.json({ error: error.message, status: 'failed' }, { status: 500 })
  }
}
