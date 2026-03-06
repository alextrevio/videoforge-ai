import { NextRequest, NextResponse } from 'next/server'

// POST /api/generate/ai-video/status
// Polls fal.ai queue for video generation status
export async function POST(req: NextRequest) {
  try {
    const { requestIds } = await req.json()

    const falKey = process.env.FAL_KEY
    if (!falKey) {
      return NextResponse.json({ error: 'FAL_KEY not configured' }, { status: 400 })
    }

    const model = 'fal-ai/kling-video/v1/standard/text-to-video'

    const results = await Promise.all(
      (requestIds || []).map(async (item: any) => {
        try {
          const statusRes = await fetch(
            `https://queue.fal.run/${model}/requests/${item.requestId}/status`,
            { headers: { 'Authorization': `Key ${falKey}` } }
          )

          if (!statusRes.ok) {
            const errText = await statusRes.text()
            console.error(`[fal.ai] Status error for ${item.requestId}:`, errText)
            return { sceneIndex: item.sceneIndex, requestId: item.requestId, status: 'error', error: errText.slice(0, 200) }
          }

          const statusData = await statusRes.json()

          if (statusData.status === 'COMPLETED') {
            // Fetch result
            const resultRes = await fetch(
              `https://queue.fal.run/${model}/requests/${item.requestId}`,
              { headers: { 'Authorization': `Key ${falKey}` } }
            )
            if (resultRes.ok) {
              const resultData = await resultRes.json()
              console.log(`[fal.ai] Scene ${item.sceneIndex} completed:`, resultData.video?.url?.slice(0, 80))
              return {
                sceneIndex: item.sceneIndex,
                requestId: item.requestId,
                status: 'completed',
                videoUrl: resultData.video?.url || null,
              }
            }
          }

          if (statusData.status === 'FAILED') {
            console.error(`[fal.ai] Scene ${item.sceneIndex} FAILED`)
            return { sceneIndex: item.sceneIndex, requestId: item.requestId, status: 'error', error: 'Generation failed' }
          }

          return {
            sceneIndex: item.sceneIndex,
            requestId: item.requestId,
            status: (statusData.status || 'processing').toLowerCase(),
          }
        } catch (err: any) {
          return { sceneIndex: item.sceneIndex, requestId: item.requestId, status: 'error', error: err.message }
        }
      })
    )

    const allComplete = results.every((r: any) => r.status === 'completed' || r.status === 'error')

    return NextResponse.json({ clips: results, allComplete })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
