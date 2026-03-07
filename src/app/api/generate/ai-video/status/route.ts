import { NextRequest, NextResponse } from 'next/server'

// POST /api/generate/ai-video/status
// Checks status of ONE fal.ai request using the URLs from submit
export async function POST(req: NextRequest) {
  try {
    const { statusUrl, responseUrl } = await req.json()

    const falKey = process.env.FAL_KEY
    if (!falKey || !statusUrl) {
      return NextResponse.json({ status: 'error', error: 'Missing FAL_KEY or statusUrl' })
    }

    const statusRes = await fetch(statusUrl, {
      headers: { 'Authorization': `Key ${falKey}` },
    })

    if (!statusRes.ok) {
      const err = await statusRes.text()
      console.error('[fal.ai] Status check error:', statusRes.status, err.slice(0, 200))
      return NextResponse.json({ status: 'processing' })
    }

    const statusData = await statusRes.json()

    if (statusData.status === 'COMPLETED' && responseUrl) {
      const resultRes = await fetch(responseUrl, {
        headers: { 'Authorization': `Key ${falKey}` },
      })
      if (resultRes.ok) {
        const result = await resultRes.json()
        const videoUrl = result.video?.url || null
        console.log('[fal.ai] COMPLETED! Video:', videoUrl?.slice(0, 100))
        return NextResponse.json({ status: 'completed', videoUrl })
      }
    }

    if (statusData.status === 'FAILED') {
      console.error('[fal.ai] Generation FAILED')
      return NextResponse.json({ status: 'failed' })
    }

    return NextResponse.json({ status: (statusData.status || 'processing').toLowerCase() })
  } catch (error: any) {
    return NextResponse.json({ status: 'processing' })
  }
}
