import { NextRequest, NextResponse } from 'next/server'

// POST /api/generate/concat/status
// Polls Shotstack for render status
export async function POST(req: NextRequest) {
  try {
    const { renderId } = await req.json()

    const apiKey = process.env.SHOTSTACK_API_KEY
    if (!apiKey || !renderId) {
      return NextResponse.json({ error: 'Missing SHOTSTACK_API_KEY or renderId' }, { status: 400 })
    }

    const res = await fetch(`https://api.shotstack.io/v1/render/${renderId}`, {
      headers: { 'x-api-key': apiKey },
    })

    if (!res.ok) {
      return NextResponse.json({ error: `Shotstack status error: ${res.status}` }, { status: 500 })
    }

    const data = await res.json()
    const status = data.response?.status
    const videoUrl = data.response?.url || null

    return NextResponse.json({
      renderId,
      status, // queued, fetching, rendering, saving, done, failed
      videoUrl, // MP4 URL when done
      duration: data.response?.duration,
      renderTime: data.response?.renderTime,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
