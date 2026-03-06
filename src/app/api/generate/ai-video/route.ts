import { NextRequest, NextResponse } from 'next/server'

// POST /api/generate/ai-video
// Generates AI video clips using Kling via fal.ai
export async function POST(req: NextRequest) {
  try {
    const { scenes, niche, aspectRatio } = await req.json()

    const falKey = process.env.FAL_KEY
    if (!falKey) {
      return NextResponse.json({
        clips: (scenes || []).map((s: any, i: number) => ({
          sceneIndex: i, videoUrl: null, status: 'simulated', prompt: s.prompt,
        })),
        mode: 'simulation',
      })
    }

    // Use Kling v1 standard — most reliable, cheapest
    const model = 'fal-ai/kling-video/v1/standard/text-to-video'
    const ratio = aspectRatio || '9:16'

    // Submit scenes (max 4 to control cost)
    const limitedScenes = (scenes || []).slice(0, 4)
    const submissions = await Promise.all(
      limitedScenes.map(async (scene: any, i: number) => {
        try {
          const submitRes = await fetch(`https://queue.fal.run/${model}`, {
            method: 'POST',
            headers: {
              'Authorization': `Key ${falKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              prompt: scene.prompt,
              duration: '5',
              aspect_ratio: ratio,
            }),
          })

          if (!submitRes.ok) {
            const errText = await submitRes.text()
            console.error(`[fal.ai] Scene ${i} submit error:`, submitRes.status, errText)
            return { sceneIndex: i, error: `fal.ai ${submitRes.status}: ${errText.slice(0, 200)}`, status: 'failed' }
          }

          const submitData = await submitRes.json()
          console.log(`[fal.ai] Scene ${i} queued:`, submitData.request_id)
          return {
            sceneIndex: i,
            requestId: submitData.request_id,
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
    const failed = submissions.filter(s => s.status === 'failed')

    return NextResponse.json({
      clips: submissions,
      mode: queued.length > 0 ? 'kling-fal' : 'all-failed',
      model,
      queued: queued.length,
      failed: failed.length,
      errors: failed.map(f => f.error),
    })
  } catch (error: any) {
    console.error('[fal.ai] Route error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
