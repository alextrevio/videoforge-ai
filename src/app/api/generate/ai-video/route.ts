import { NextRequest, NextResponse } from 'next/server'

// POST /api/generate/ai-video
// Generates AI video clips using Kling via fal.ai
// Each scene gets a 5s AI-generated video clip
export async function POST(req: NextRequest) {
  try {
    const { scenes, niche, aspectRatio, duration } = await req.json()
    // scenes: [{ prompt: "cinematic description...", duration: 5 }]

    const falKey = process.env.FAL_KEY
    if (!falKey) {
      // Simulation mode — return placeholder data
      const results = (scenes || []).map((s: any, i: number) => ({
        sceneIndex: i,
        videoUrl: null,
        status: 'simulated',
        prompt: s.prompt,
        message: 'FAL_KEY not configured. Set FAL_KEY in Vercel to enable AI video generation.',
      }))
      return NextResponse.json({ clips: results, mode: 'simulation' })
    }

    const model = 'fal-ai/kling-video/v2.5-turbo/standard/text-to-video'
    const ratio = aspectRatio || '9:16' // vertical for shorts/reels

    // Submit all scenes in parallel
    const submissions = await Promise.all(
      (scenes || []).slice(0, 6).map(async (scene: any, i: number) => {
        try {
          // Submit to fal queue
          const submitRes = await fetch(`https://queue.fal.run/${model}`, {
            method: 'POST',
            headers: {
              'Authorization': `Key ${falKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              prompt: scene.prompt,
              duration: String(scene.duration || 5),
              aspect_ratio: ratio,
              negative_prompt: 'blur, distort, low quality, watermark, text overlay',
              cfg_scale: 0.5,
              audio: true,
            }),
          })

          if (!submitRes.ok) {
            const err = await submitRes.text()
            return { sceneIndex: i, error: `Submit failed: ${err}`, status: 'failed' }
          }

          const submitData = await submitRes.json()
          return {
            sceneIndex: i,
            requestId: submitData.request_id,
            status: 'queued',
            prompt: scene.prompt,
          }
        } catch (err: any) {
          return { sceneIndex: i, error: err.message, status: 'failed' }
        }
      })
    )

    return NextResponse.json({
      clips: submissions,
      mode: 'kling-fal',
      model,
      message: 'Videos submitted to queue. Poll /api/generate/ai-video/status to check progress.',
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
