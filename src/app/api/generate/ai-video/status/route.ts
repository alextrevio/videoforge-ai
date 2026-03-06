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

    const results = await Promise.all(
      (requestIds || []).map(async (item: any) => {
        try {
          // fal.ai status endpoint — use GET with request_id in URL
          const statusRes = await fetch(
            `https://queue.fal.run/requests/${item.requestId}/status`,
            {
              method: 'GET',
              headers: { 'Authorization': `Key ${falKey}` },
            }
          )

          if (!statusRes.ok) {
            const errText = await statusRes.text()
            console.error(`[fal.ai] Status check failed for ${item.requestId}:`, statusRes.status, errText.slice(0, 200))
            return { sceneIndex: item.sceneIndex, requestId: item.requestId, status: 'processing' }
          }

          const statusData = await statusRes.json()
          console.log(`[fal.ai] Scene ${item.sceneIndex} status:`, statusData.status)

          if (statusData.status === 'COMPLETED') {
            // Fetch the result
            const resultRes = await fetch(
              `https://queue.fal.run/requests/${item.requestId}`,
              {
                method: 'GET',
                headers: { 'Authorization': `Key ${falKey}` },
              }
            )
            if (resultRes.ok) {
              const resultData = await resultRes.json()
              console.log(`[fal.ai] Scene ${item.sceneIndex} video URL:`, resultData.video?.url?.slice(0, 80))
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
            status: (statusData.status || 'in_queue').toLowerCase(),
          }
        } catch (err: any) {
          console.error(`[fal.ai] Status exception:`, err.message)
          return { sceneIndex: item.sceneIndex, requestId: item.requestId, status: 'processing' }
        }
      })
    )

    const allComplete = results.every((r: any) => r.status === 'completed' || r.status === 'error')

    return NextResponse.json({ clips: results, allComplete })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
