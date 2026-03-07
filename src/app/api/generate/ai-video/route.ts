import { NextRequest, NextResponse } from 'next/server'

// POST /api/generate/ai-video
// Submits ONE scene to Kling queue — returns immediately with request info
// Browser polls /api/generate/ai-video/status for results
export async function POST(req: NextRequest) {
  try {
    const { prompt, aspectRatio, duration } = await req.json()

    const falKey = process.env.FAL_KEY
    if (!falKey) {
      return NextResponse.json({ videoUrl: null, mode: 'simulation' })
    }

    const model = 'fal-ai/kling-video/v1/standard/text-to-video'

    const submitRes = await fetch(`https://queue.fal.run/${model}`, {
      method: 'POST',
      headers: { 'Authorization': `Key ${falKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, duration: duration || '5', aspect_ratio: aspectRatio || '9:16' }),
    })

    if (!submitRes.ok) {
      const err = await submitRes.text()
      console.error('[fal.ai] Submit error:', submitRes.status, err.slice(0, 300))
      return NextResponse.json({ videoUrl: null, error: err.slice(0, 300), mode: 'submit-error' })
    }

    const data = await submitRes.json()
    console.log('[fal.ai] Queued:', data.request_id, '| status_url:', data.status_url?.slice(0, 80))

    return NextResponse.json({
      requestId: data.request_id,
      statusUrl: data.status_url,
      responseUrl: data.response_url,
      mode: 'queued',
    })
  } catch (error: any) {
    console.error('[fal.ai] Submit exception:', error.message)
    return NextResponse.json({ videoUrl: null, error: error.message, mode: 'error' })
  }
}
