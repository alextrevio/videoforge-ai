import { NextRequest, NextResponse } from 'next/server'

// POST /api/generate/concat
// Concatenates clips + voiceover + viral subtitles via Shotstack
export async function POST(req: NextRequest) {
  try {
    const { clips, title, subtitles, audioUrl, audioDuration, productionMode } = await req.json()

    const apiKey = process.env.SHOTSTACK_API_KEY
    if (!apiKey) {
      return NextResponse.json({ videoUrl: clips?.[0]?.videoUrl || null, mode: 'no-shotstack' })
    }

    const validClips = (clips || []).filter((c: any) => c.videoUrl)
    if (validClips.length === 0) {
      return NextResponse.json({ error: 'No valid video clips' }, { status: 400 })
    }

    const isCharacterMode = productionMode === 'character-lipsync'

    // VIDEO TRACK — clips in sequence
    let currentStart = 0
    const trackClips = validClips.map((clip: any, i: number) => {
      const dur = clip.duration || 5
      const isFirst = i === 0
      const isLast = i === validClips.length - 1
      const entry: any = {
        asset: { 
          type: 'video', 
          src: clip.videoUrl,
          // Mute original audio for narrator modes (AI video has random sounds)
          // Keep audio for lip-sync modes (the lip-synced clip has the voice)
          volume: isCharacterMode ? 1 : 0,
        },
        start: currentStart,
        length: dur,
        transition: {
          in: isFirst ? 'fade' : 'carouselLeft',
          out: isLast ? 'fade' : 'carouselLeft',
        },
      }
      currentStart += dur
      return entry
    })
    const totalDuration = currentStart

    // SUBTITLE TRACK — word-by-word viral style
    const subtitleClips: any[] = []
    const subs = subtitles || []
    
    if (subs.length > 0 && subs[0].word) {
      // Word-level timestamps from ElevenLabs
      let chunkStart = 0
      let chunkWords: string[] = []
      
      for (let i = 0; i < subs.length; i++) {
        const w = subs[i]
        if (chunkWords.length === 0) chunkStart = w.start
        chunkWords.push(w.word)
        
        const isPunct = /[.!?;,]$/.test(w.word)
        if (chunkWords.length >= 3 || isPunct || i === subs.length - 1) {
          const text = chunkWords.join(' ').toUpperCase()
          const longest = chunkWords.reduce((a, b) => a.length > b.length ? a : b, '')
          const end = w.end || w.start + 0.5
          
          if (chunkStart < totalDuration && chunkStart >= 0) {
            subtitleClips.push({
              asset: {
                type: 'html',
                html: `<div style="font-family:'Montserrat','Arial Black',sans-serif;font-size:48px;font-weight:900;color:white;text-align:center;text-shadow:4px 4px 10px rgba(0,0,0,0.95),-2px -2px 6px rgba(0,0,0,0.7);line-height:1.1;padding:0 30px;word-wrap:break-word;letter-spacing:1px;">${text.replace(longest.toUpperCase(), `<span style="color:#FFD700;font-size:58px;text-shadow:4px 4px 12px rgba(255,215,0,0.4);">${longest.toUpperCase()}</span>`)}</div>`,
                width: 580,
                height: 160,
              },
              start: Math.max(0, Math.min(chunkStart, totalDuration - 0.3)),
              length: Math.max(0.3, Math.min(end - chunkStart + 0.15, totalDuration - chunkStart)),
              position: 'bottom',
              offset: { y: 0.1 },
            })
          }
          chunkWords = []
        }
      }
    } else if (subs.length > 0 && subs[0].text) {
      // Block-level subtitles (GPT fallback)
      for (const sub of subs) {
        if (!sub.text || sub.start >= totalDuration) continue
        const text = sub.text.toUpperCase()
        const emphasis = (sub.emphasis || '').toUpperCase()
        subtitleClips.push({
          asset: {
            type: 'html',
            html: `<div style="font-family:'Montserrat','Arial Black',sans-serif;font-size:48px;font-weight:900;color:white;text-align:center;text-shadow:4px 4px 10px rgba(0,0,0,0.95);line-height:1.1;padding:0 30px;letter-spacing:1px;">${emphasis && text.includes(emphasis) ? text.replace(emphasis, `<span style="color:#FFD700;font-size:58px;">${emphasis}</span>`) : text}</div>`,
            width: 580,
            height: 160,
          },
          start: Math.max(0, Math.min(sub.start, totalDuration - 0.3)),
          length: Math.max(0.3, Math.min((sub.end || sub.start + 2) - sub.start, totalDuration - sub.start)),
          position: 'bottom',
          offset: { y: 0.1 },
        })
      }
    }

    // AUDIO TRACK — voiceover (only for narrator modes, lip-sync already has audio in video)
    const audioTrack: any[] = []
    if (audioUrl && !isCharacterMode) {
      audioTrack.push({
        asset: {
          type: 'audio',
          src: audioUrl,
          volume: 1,
        },
        start: 0,
        length: Math.min(audioDuration || totalDuration, totalDuration),
      })
    }

    const timeline: any = {
      tracks: [
        // Layer 1 (top): Subtitles
        ...(subtitleClips.length > 0 ? [{ clips: subtitleClips }] : []),
        // Layer 2: Video clips
        { clips: trackClips },
        // Layer 3 (bottom): Voiceover audio (narrator modes only)
        ...(audioTrack.length > 0 ? [{ clips: audioTrack }] : []),
      ],
    }

    const payload = {
      timeline,
      output: {
        format: 'mp4',
        resolution: 'hd',
        aspectRatio: '9:16',
        fps: 30,
      },
    }

    console.log('[Shotstack] Render:', validClips.length, 'clips,', subtitleClips.length, 'subs,', audioTrack.length > 0 ? 'with audio' : 'no audio,', Math.round(totalDuration), 's,', productionMode)

    const renderRes = await fetch('https://api.shotstack.io/v1/render', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
      body: JSON.stringify(payload),
    })

    if (!renderRes.ok) {
      const err = await renderRes.text()
      console.error('[Shotstack] Error:', err.slice(0, 400))
      return NextResponse.json({ error: `Shotstack: ${err.slice(0, 200)}` }, { status: 500 })
    }

    const renderData = await renderRes.json()
    return NextResponse.json({
      renderId: renderData.response?.id,
      status: 'queued',
      mode: 'shotstack',
      clipCount: validClips.length,
      subtitleCount: subtitleClips.length,
      hasAudio: audioTrack.length > 0,
      totalDuration,
    })
  } catch (error: any) {
    console.error('[Shotstack] Exception:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
