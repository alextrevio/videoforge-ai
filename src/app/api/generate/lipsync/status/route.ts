import { NextRequest, NextResponse } from 'next/server'

// POST /api/generate/lipsync/status
// Polls lip-sync status using URLs from submit response
export async function POST(req: NextRequest) {
  try {
    const { statusUrl, responseUrl } = await req.json()

    const falKey = process.env.FAL_KEY
    if (!falKey || !statusUrl) {
      return NextResponse.json({ status: 'error' })
    }

    const statusRes = await fetch(statusUrl, {
      headers: { 'Authorization': `Key ${falKey}` },
    })

    if (!statusRes.ok) {
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
        console.log('[LipSync] COMPLETED:', videoUrl?.slice(0, 80))
        return NextResponse.json({ status: 'completed', videoUrl })
      }
    }

    if (statusData.status === 'FAILED') {
      console.error('[LipSync] FAILED')
      return NextResponse.json({ status: 'failed' })
    }

    return NextResponse.json({ status: (statusData.status || 'processing').toLowerCase() })
  } catch {
    return NextResponse.json({ status: 'processing' })
  }
}
