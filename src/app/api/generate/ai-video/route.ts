import { NextRequest, NextResponse } from 'next/server'

// POST /api/generate/ai-video
// Generates a SINGLE AI video clip using Kling via fal.ai
// Called once per scene — the browser handles sequencing
export async function POST(req: NextRequest) {
  try {
    const { prompt, aspectRatio } = await req.json()

    const falKey = process.env.FAL_KEY
    if (!falKey) {
      return NextResponse.json({ videoUrl: null, mode: 'simulation' })
    }

    const model = 'fal-ai/kling-video/v1/standard/text-to-video'

    // Submit to queue
    const submitRes = await fetch(`https://queue.fal.run/${model}`, {
      method: 'POST',
      headers: { 'Authorization': `Key ${falKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, duration: '5', aspect_ratio: aspectRatio || '9:16' }),
    })

    if (!submitRes.ok) {
      const err = await submitRes.text()
      console.error('[fal.ai] Submit error:', submitRes.status, err.slice(0, 200))
      return NextResponse.json({ videoUrl: null, error: err.slice(0, 200), mode: 'error' })
    }

    const submitData = await submitRes.json()
    const statusUrl = submitData.status_url
    const responseUrl = submitData.response_url
    console.log('[fal.ai] Queued:', submitData.request_id)

    // Poll until complete (max 3 min within this serverless function)
    // Vercel Hobby has 60s timeout, so we poll for max 55s
    const startTime = Date.now()
    const maxWait = 55000 // 55 seconds

    while (Date.now() - startTime < maxWait) {
      await new Promise(r => setTimeout(r, 3000)) // wait 3s between polls

      try {
        const statusRes = await fetch(statusUrl, {
          headers: { 'Authorization': `Key ${falKey}` },
        })
        if (!statusRes.ok) continue

        const statusData = await statusRes.json()
        console.log('[fal.ai] Status:', statusData.status)

        if (statusData.status === 'COMPLETED') {
          // Fetch result
          const resultRes = await fetch(responseUrl, {
            headers: { 'Authorization': `Key ${falKey}` },
          })
          if (resultRes.ok) {
            const result = await resultRes.json()
            const videoUrl = result.video?.url || null
            console.log('[fal.ai] Video URL:', videoUrl?.slice(0, 80))
            return NextResponse.json({ videoUrl, mode: 'kling' })
          }
        }

        if (statusData.status === 'FAILED') {
          return NextResponse.json({ videoUrl: null, error: 'Kling generation failed', mode: 'error' })
        }
      } catch {}
    }

    // Timeout — return what we have
    return NextResponse.json({ videoUrl: null, mode: 'timeout', requestId: submitData.request_id })
  } catch (error: any) {
    console.error('[fal.ai] Error:', error.message)
    return NextResponse.json({ videoUrl: null, error: error.message, mode: 'error' })
  }
}
