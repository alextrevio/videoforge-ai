import { NextRequest, NextResponse } from 'next/server'

// POST /api/generate/video
// Composes final video from audio + visuals
// Uses Shotstack API when configured, simulation fallback
export async function POST(req: NextRequest) {
  try {
    const { videoId, title, script, audioUrl, duration, niche } = await req.json()
    
    const shotKey = process.env.SHOTSTACK_API_KEY
    
    if (!shotKey) {
      // Simulation: return placeholder
      return NextResponse.json({
        videoUrl: null,
        renderId: null,
        status: 'simulated',
        mode: 'simulation',
        message: 'Set SHOTSTACK_API_KEY for real video composition',
      })
    }

    // Parse duration seconds
    const durSec = parseInt(duration?.replace(/[^0-9]/g, '') || '60')

    // Split script into scenes (by timestamps or paragraphs)
    const scenes = script
      .split(/\n\n+|\[[\d:]+/)
      .filter((s: string) => s.trim().length > 20)
      .slice(0, 8) // Max 8 scenes

    const sceneDuration = durSec / Math.max(scenes.length, 1)

    // Build Shotstack timeline
    const clips = scenes.map((text: string, i: number) => ({
      asset: {
        type: 'html',
        html: `<div style="width:1080px;height:1920px;background:linear-gradient(135deg,#0a0a0f,#1a1a2e);display:flex;align-items:center;justify-content:center;padding:80px;">
          <div style="text-align:center;">
            <p style="color:#fff;font-family:sans-serif;font-size:48px;font-weight:800;line-height:1.3;text-shadow:0 4px 20px rgba(0,0,0,0.8);">${text.trim().slice(0, 200)}</p>
          </div>
        </div>`,
        width: 1080,
        height: 1920,
      },
      start: i * sceneDuration,
      length: sceneDuration,
      transition: { in: 'fade', out: 'fade' },
    }))

    // Add audio track
    const tracks: any[] = [{ clips }]
    if (audioUrl && !audioUrl.startsWith('data:')) {
      tracks.push({
        clips: [{
          asset: { type: 'audio', src: audioUrl },
          start: 0,
          length: durSec,
        }]
      })
    }

    // Submit render to Shotstack
    const renderRes = await fetch('https://api.shotstack.io/edit/v1/render', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': shotKey,
      },
      body: JSON.stringify({
        timeline: {
          background: '#0a0a0f',
          tracks,
        },
        output: {
          format: 'mp4',
          resolution: 'hd', // 1080x1920 for shorts/reels
          aspectRatio: '9:16',
          fps: 30,
        },
      }),
    })

    if (!renderRes.ok) {
      const err = await renderRes.text()
      return NextResponse.json({ error: `Shotstack render failed: ${err}` }, { status: 500 })
    }

    const renderData = await renderRes.json()
    
    return NextResponse.json({
      renderId: renderData.response?.id,
      videoUrl: null, // Will be available when render completes
      status: 'rendering',
      mode: 'shotstack',
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// GET /api/generate/video?renderId=xxx
// Check render status
export async function GET(req: NextRequest) {
  const renderId = req.nextUrl.searchParams.get('renderId')
  const shotKey = process.env.SHOTSTACK_API_KEY

  if (!renderId || !shotKey) {
    return NextResponse.json({ status: 'unknown' })
  }

  try {
    const res = await fetch(`https://api.shotstack.io/edit/v1/render/${renderId}`, {
      headers: { 'x-api-key': shotKey },
    })
    const data = await res.json()
    
    return NextResponse.json({
      status: data.response?.status, // queued, fetching, rendering, saving, done, failed
      videoUrl: data.response?.url || null,
      progress: data.response?.status === 'done' ? 100 : 
                data.response?.status === 'rendering' ? 60 : 30,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
