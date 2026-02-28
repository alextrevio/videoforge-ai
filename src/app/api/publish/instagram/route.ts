import { NextRequest, NextResponse } from 'next/server'

// POST /api/publish/instagram
// Publishes Reels to Instagram using Instagram Graph API
export async function POST(req: NextRequest) {
  try {
    const { caption, videoUrl, accessToken, igUserId } = await req.json()

    if (!accessToken || !igUserId) {
      return NextResponse.json({ error: 'Instagram OAuth token and user ID required.' }, { status: 401 })
    }

    // Step 1: Create media container for Reels
    const containerRes = await fetch(
      `https://graph.facebook.com/v19.0/${igUserId}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          media_type: 'REELS',
          video_url: videoUrl,
          caption,
          access_token: accessToken,
          share_to_feed: true,
        }),
      }
    )

    if (!containerRes.ok) {
      const err = await containerRes.text()
      return NextResponse.json({ error: `Instagram container failed: ${err}` }, { status: 500 })
    }

    const { id: containerId } = await containerRes.json()

    // Step 2: Wait for processing then publish
    // Instagram processes video asynchronously — poll status
    let ready = false
    let attempts = 0
    while (!ready && attempts < 30) {
      await new Promise(r => setTimeout(r, 2000))
      const statusRes = await fetch(
        `https://graph.facebook.com/v19.0/${containerId}?fields=status_code&access_token=${accessToken}`
      )
      const status = await statusRes.json()
      if (status.status_code === 'FINISHED') ready = true
      else if (status.status_code === 'ERROR') {
        return NextResponse.json({ error: 'Instagram processing failed' }, { status: 500 })
      }
      attempts++
    }

    if (!ready) {
      return NextResponse.json({ error: 'Instagram processing timeout' }, { status: 504 })
    }

    // Step 3: Publish
    const publishRes = await fetch(
      `https://graph.facebook.com/v19.0/${igUserId}/media_publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creation_id: containerId,
          access_token: accessToken,
        }),
      }
    )

    const result = await publishRes.json()

    return NextResponse.json({
      mediaId: result.id,
      platform: 'instagram',
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// ── Facebook Reels (same Graph API, different endpoint) ──
// POST /api/publish/facebook — handled by the same pattern
// For Facebook: use page access token + page ID instead of IG user ID
