import { NextRequest, NextResponse } from 'next/server'

// POST /api/generate/ai-video/status
// Uses the status_url and response_url from submit response
export async function POST(req: NextRequest) {
  try {
    const { requestIds } = await req.json()
    // requestIds: [{ sceneIndex, requestId, statusUrl, responseUrl }]

    const falKey = process.env.FAL_KEY
    if (!falKey) {
      return NextResponse.json({ error: 'FAL_KEY not configured' }, { status: 400 })
    }

    const results = await Promise.all(
      (requestIds || []).map(async (item: any) => {
        try {
          // Use the status_url directly from submit response
          const statusUrl = item.statusUrl
          if (!statusUrl) {
            return { sceneIndex: item.sceneIndex, requestId: item.requestId, status: 'error', error: 'No status URL' }
          }

          const statusRes = await fetch(statusUrl, {
            method: 'GET',
            headers: { 'Authorization': `Key ${falKey}` },
          })

          if (!statusRes.ok) {
            const errText = await statusRes.text()
            console.error(`[fal.ai] Status error ${item.sceneIndex}:`, statusRes.status, errText.slice(0, 100))
            return { sceneIndex: item.sceneIndex, requestId: item.requestId, status: 'processing' }
          }

          const statusData = await statusRes.json()
          console.log(`[fal.ai] Scene ${item.sceneIndex} status:`, statusData.status)

          if (statusData.status === 'COMPLETED') {
            // Fetch result using response_url
            const responseUrl = item.responseUrl
            if (responseUrl) {
              const resultRes = await fetch(responseUrl, {
                method: 'GET',
                headers: { 'Authorization': `Key ${falKey}` },
              })
              if (resultRes.ok) {
                const resultData = await resultRes.json()
                const videoUrl = resultData.video?.url || null
                console.log(`[fal.ai] Scene ${item.sceneIndex} completed:`, videoUrl?.slice(0, 80))
                return { sceneIndex: item.sceneIndex, requestId: item.requestId, status: 'completed', videoUrl }
              }
            }
          }

          if (statusData.status === 'FAILED') {
            return { sceneIndex: item.sceneIndex, requestId: item.requestId, status: 'error', error: 'Generation failed' }
          }

          return { sceneIndex: item.sceneIndex, requestId: item.requestId, status: (statusData.status || 'in_queue').toLowerCase() }
        } catch (err: any) {
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
