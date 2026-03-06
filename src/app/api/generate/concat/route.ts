import { NextRequest, NextResponse } from 'next/server'

// POST /api/generate/concat
// Concatenates video clips into a single MP4 using Shotstack API
export async function POST(req: NextRequest) {
  try {
    const { clips, title, subtitles } = await req.json()
    // clips: [{ videoUrl: "https://...", duration: 5 }, ...]

    const apiKey = process.env.SHOTSTACK_API_KEY
    if (!apiKey) {
      return NextResponse.json({
        error: null,
        videoUrl: clips?.[0]?.videoUrl || null,
        mode: 'no-shotstack',
        message: 'SHOTSTACK_API_KEY not configured. Clips available individually.',
      })
    }

    // Filter only clips with valid video URLs
    const validClips = (clips || []).filter((c: any) => c.videoUrl)
    if (validClips.length === 0) {
      return NextResponse.json({ error: 'No valid video clips to concatenate' }, { status: 400 })
    }

    // Build Shotstack timeline — each clip plays sequentially
    let currentStart = 0
    const trackClips = validClips.map((clip: any) => {
      const dur = clip.duration || 5
      const entry = {
        asset: {
          type: 'video',
          src: clip.videoUrl,
          volume: 1,
        },
        start: currentStart,
        length: dur,
        transition: {
          in: currentStart === 0 ? 'fade' : 'fadeSlow',
          out: 'fadeSlow',
        },
      }
      currentStart += dur
      return entry
    })

    // Optional: add title card at the beginning
    const titleTrack = title ? [{
      asset: {
        type: 'title',
        text: title,
        style: 'minimal',
        size: 'small',
      },
      start: 0,
      length: 3,
      transition: { in: 'fade', out: 'fade' },
    }] : []

    const timeline: any = {
      tracks: [
        // Title overlay (on top)
        ...(titleTrack.length > 0 ? [{ clips: titleTrack }] : []),
        // Video clips (main track)
        { clips: trackClips },
      ],
    }

    const payload = {
      timeline,
      output: {
        format: 'mp4',
        resolution: 'hd', // 1080p
        aspectRatio: '9:16', // vertical for shorts
        fps: 30,
      },
    }

    // Submit render to Shotstack
    const renderRes = await fetch('https://api.shotstack.io/v1/render', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify(payload),
    })

    if (!renderRes.ok) {
      const err = await renderRes.text()
      return NextResponse.json({ error: `Shotstack error: ${err}` }, { status: 500 })
    }

    const renderData = await renderRes.json()
    const renderId = renderData.response?.id

    return NextResponse.json({
      renderId,
      status: 'queued',
      mode: 'shotstack',
      clipCount: validClips.length,
      totalDuration: currentStart,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
