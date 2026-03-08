import { NextRequest, NextResponse } from 'next/server'

// POST /api/generate/concat
// Concatenates clips + burns in viral subtitles using Shotstack
export async function POST(req: NextRequest) {
  try {
    const { clips, title, subtitles, audioBase64, audioDuration } = await req.json()

    const apiKey = process.env.SHOTSTACK_API_KEY
    if (!apiKey) {
      return NextResponse.json({
        videoUrl: clips?.[0]?.videoUrl || null,
        mode: 'no-shotstack',
      })
    }

    const validClips = (clips || []).filter((c: any) => c.videoUrl)
    if (validClips.length === 0) {
      return NextResponse.json({ error: 'No valid video clips' }, { status: 400 })
    }

    // VIDEO TRACK — clips in sequence with smooth transitions
    let currentStart = 0
    const trackClips = validClips.map((clip: any, i: number) => {
      const dur = clip.duration || 5
      const isFirst = i === 0
      const isLast = i === validClips.length - 1
      const entry = {
        asset: { type: 'video', src: clip.videoUrl, volume: 1 },
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
      // Word-level timestamps from ElevenLabs — group into 3-4 word chunks
      let chunkStart = 0
      let chunkWords: string[] = []
      let chunkEmphasis = ''
      
      for (let i = 0; i < subs.length; i++) {
        const w = subs[i]
        if (chunkWords.length === 0) chunkStart = w.start
        chunkWords.push(w.word)
        
        // Every 3-4 words or at punctuation, create a subtitle block
        const isPunct = /[.!?;,]$/.test(w.word)
        if (chunkWords.length >= 4 || isPunct || i === subs.length - 1) {
          const text = chunkWords.join(' ').toUpperCase()
          const longest = chunkWords.reduce((a, b) => a.length > b.length ? a : b, '')
          const end = w.end || w.start + 0.5
          
          if (chunkStart < totalDuration) {
            subtitleClips.push({
              asset: {
                type: 'html',
                html: `<div style="font-family:'Montserrat','Arial Black',sans-serif;font-size:44px;font-weight:900;color:white;text-align:center;text-shadow:3px 3px 8px rgba(0,0,0,0.95),-2px -2px 4px rgba(0,0,0,0.6);line-height:1.15;padding:0 24px;word-wrap:break-word;">${text.replace(longest.toUpperCase(), `<span style="color:#FFD700;font-size:54px;">${longest.toUpperCase()}</span>`)}</div>`,
                width: 540,
                height: 140,
              },
              start: Math.min(chunkStart, totalDuration - 0.3),
              length: Math.min(end - chunkStart + 0.2, totalDuration - chunkStart),
              position: 'bottom',
              offset: { y: 0.12 },
            })
          }
          chunkWords = []
          chunkEmphasis = ''
        }
      }
    } else if (subs.length > 0) {
      // Block-level subtitles (fallback from GPT)
      for (const sub of subs) {
        if (!sub.text || sub.start >= totalDuration) continue
        const text = sub.text.toUpperCase()
        const emphasis = (sub.emphasis || '').toUpperCase()
        subtitleClips.push({
          asset: {
            type: 'html',
            html: `<div style="font-family:'Montserrat','Arial Black',sans-serif;font-size:44px;font-weight:900;color:white;text-align:center;text-shadow:3px 3px 8px rgba(0,0,0,0.95);line-height:1.15;padding:0 24px;">${emphasis && text.includes(emphasis) ? text.replace(emphasis, `<span style="color:#FFD700;font-size:54px;">${emphasis}</span>`) : text}</div>`,
            width: 540,
            height: 140,
          },
          start: Math.min(sub.start, totalDuration - 0.3),
          length: Math.min((sub.end || sub.start + 2.5) - sub.start, totalDuration - sub.start),
          position: 'bottom',
          offset: { y: 0.12 },
        })
      }
    }

    // AUDIO TRACK — voiceover from ElevenLabs
    const audioTrack: any[] = []
    if (audioBase64) {
      audioTrack.push({
        asset: {
          type: 'audio',
          src: `data:audio/mpeg;base64,${audioBase64}`,
          volume: 1,
        },
        start: 0,
        length: Math.min(audioDuration || totalDuration, totalDuration),
      })
    }

    const timeline: any = {
      tracks: [
        // Subtitles on top
        ...(subtitleClips.length > 0 ? [{ clips: subtitleClips }] : []),
        // Video clips
        { clips: trackClips },
        // Voiceover audio
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

    console.log('[Shotstack] Submitting:', validClips.length, 'clips,', subtitleClips.length, 'subtitles,', totalDuration, 'seconds')

    const renderRes = await fetch('https://api.shotstack.io/v1/render', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
      body: JSON.stringify(payload),
    })

    if (!renderRes.ok) {
      const err = await renderRes.text()
      console.error('[Shotstack] Error:', err.slice(0, 300))
      return NextResponse.json({ error: `Shotstack: ${err.slice(0, 200)}` }, { status: 500 })
    }

    const renderData = await renderRes.json()
    return NextResponse.json({
      renderId: renderData.response?.id,
      status: 'queued',
      mode: 'shotstack',
      clipCount: validClips.length,
      subtitleCount: subtitleClips.length,
      totalDuration,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
