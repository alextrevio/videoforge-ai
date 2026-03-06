import { NextRequest, NextResponse } from 'next/server'

// POST /api/generate/ai-video
export async function POST(req: NextRequest) {
  try {
    const { scenes, niche, aspectRatio } = await req.json()

    const falKey = process.env.FAL_KEY
    if (!falKey) {
      return NextResponse.json({
        clips: (scenes || []).map((s: any, i: number) => ({ sceneIndex: i, videoUrl: null, status: 'simulated' })),
        mode: 'simulation',
      })
    }

    const model = 'fal-ai/kling-video/v1/standard/text-to-video'
    const ratio = aspectRatio || '9:16'
    const limitedScenes = (scenes || []).slice(0, 4)

    const submissions = await Promise.all(
      limitedScenes.map(async (scene: any, i: number) => {
        try {
          const submitRes = await fetch(`https://queue.fal.run/${model}`, {
            method: 'POST',
            headers: { 'Authorization': `Key ${falKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: scene.prompt, duration: '5', aspect_ratio: ratio }),
          })

          if (!submitRes.ok) {
            const errText = await submitRes.text()
            console.error(`[fal.ai] Scene ${i} submit error:`, submitRes.status, errText.slice(0, 200))
            return { sceneIndex: i, error: errText.slice(0, 200), status: 'failed' }
          }

          const data = await submitRes.json()
          console.log(`[fal.ai] Scene ${i} queued:`, data.request_id)
          // Save the status_url and response_url from the response
          return {
            sceneIndex: i,
            requestId: data.request_id,
            statusUrl: data.status_url,
            responseUrl: data.response_url,
            status: 'queued',
            prompt: scene.prompt,
          }
        } catch (err: any) {
          console.error(`[fal.ai] Scene ${i} exception:`, err.message)
          return { sceneIndex: i, error: err.message, status: 'failed' }
        }
      })
    )

    const queued = submissions.filter(s => s.status === 'queued')
    return NextResponse.json({
      clips: submissions,
      mode: queued.length > 0 ? 'kling-fal' : 'all-failed',
      queued: queued.length,
      failed: submissions.length - queued.length,
      errors: submissions.filter(s => s.status === 'failed').map(f => f.error),
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
