import { NextRequest, NextResponse } from 'next/server'

// POST /api/generate/concat
// Concatenates clips + burns in viral subtitles using Shotstack
export async function POST(req: NextRequest) {
  try {
    const { clips, title, subtitles } = await req.json()

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

    // SUBTITLE TRACK — viral-style burned into video
    const subtitleClips = (subtitles || []).filter((s: any) => s.text && s.start < totalDuration).map((sub: any) => {
      const text = sub.text.toUpperCase()
      const emphasis = (sub.emphasis || '').toUpperCase()
      
      return {
        asset: {
          type: 'html',
          html: `<div style="font-family: 'Montserrat', 'Arial Black', sans-serif; font-size: 42px; font-weight: 900; color: white; text-align: center; text-shadow: 3px 3px 6px rgba(0,0,0,0.9), -1px -1px 3px rgba(0,0,0,0.5); line-height: 1.2; padding: 0 20px; word-wrap: break-word;">
            ${emphasis && text.includes(emphasis) 
              ? text.replace(emphasis, `<span style="color: #FFD700; font-size: 52px;">${emphasis}</span>`)
              : text
            }
          </div>`,
          width: 540,
          height: 120,
        },
        start: Math.min(sub.start, totalDuration - 0.5),
        length: Math.min((sub.end || sub.start + 2.5) - sub.start, totalDuration - sub.start),
        position: 'bottom',
        offset: { y: 0.15 },
      }
    })

    const timeline: any = {
      tracks: [
        // Subtitles on top
        ...(subtitleClips.length > 0 ? [{ clips: subtitleClips }] : []),
        // Video clips
        { clips: trackClips },
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
