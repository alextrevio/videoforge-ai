import { NextRequest, NextResponse } from 'next/server'

// POST /api/publish/facebook
// Publishes Reels to Facebook Page using Graph API
export async function POST(req: NextRequest) {
  try {
    const { title, description, videoUrl, accessToken, pageId } = await req.json()

    if (!accessToken || !pageId) {
      return NextResponse.json({ error: 'Facebook Page access token and Page ID required.' }, { status: 401 })
    }

    // Upload video to Facebook Page
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${pageId}/videos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_url: videoUrl,
          title,
          description,
          access_token: accessToken,
        }),
      }
    )

    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json({ error: `Facebook upload failed: ${err}` }, { status: 500 })
    }

    const result = await res.json()

    return NextResponse.json({
      videoId: result.id,
      platform: 'facebook',
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
