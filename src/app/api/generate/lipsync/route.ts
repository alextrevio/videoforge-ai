import { NextRequest, NextResponse } from 'next/server'

// POST /api/generate/lipsync
// Applies lip-sync to a video clip using Sync Lipsync via fal.ai
// Takes: videoUrl (from Kling) + audioUrl (from ElevenLabs upload)
// Returns: requestId + polling URLs
export async function POST(req: NextRequest) {
  try {
    const { videoUrl, audioUrl } = await req.json()

    const falKey = process.env.FAL_KEY
    if (!falKey || !videoUrl || !audioUrl) {
      return NextResponse.json({ videoUrl, mode: 'passthrough' })
    }

    const model = 'fal-ai/sync-lipsync'

    const submitRes = await fetch(`https://queue.fal.run/${model}`, {
      method: 'POST',
      headers: { 'Authorization': `Key ${falKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        video_url: videoUrl,
        audio_url: audioUrl,
        sync_mode: 'cut_off',
      }),
    })

    if (!submitRes.ok) {
      const err = await submitRes.text()
      console.error('[LipSync] Submit error:', submitRes.status, err.slice(0, 300))
      return NextResponse.json({ videoUrl, mode: 'error', error: err.slice(0, 200) })
    }

    const data = await submitRes.json()
    console.log('[LipSync] Queued:', data.request_id)

    return NextResponse.json({
      requestId: data.request_id,
      statusUrl: data.status_url,
      responseUrl: data.response_url,
      originalVideoUrl: videoUrl,
      mode: 'queued',
    })
  } catch (error: any) {
    console.error('[LipSync] Exception:', error.message)
    return NextResponse.json({ videoUrl: '', mode: 'error', error: error.message })
  }
}
