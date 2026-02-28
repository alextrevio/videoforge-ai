import { NextRequest, NextResponse } from 'next/server'

// POST /api/publish/tiktok
// Uploads video to TikTok using Content Posting API
export async function POST(req: NextRequest) {
  try {
    const { title, videoUrl, accessToken } = await req.json()

    if (!accessToken) {
      return NextResponse.json({ error: 'TikTok OAuth token required. Connect your account first.' }, { status: 401 })
    }

    // Step 1: Initialize upload — pull from URL
    const initRes = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        post_info: {
          title: title.slice(0, 150),
          privacy_level: 'PUBLIC_TO_EVERYONE',
          disable_duet: false,
          disable_comment: false,
          disable_stitch: false,
        },
        source_info: {
          source: 'PULL_FROM_URL',
          video_url: videoUrl,
        },
      }),
    })

    if (!initRes.ok) {
      const err = await initRes.text()
      return NextResponse.json({ error: `TikTok init failed: ${err}` }, { status: 500 })
    }

    const result = await initRes.json()

    return NextResponse.json({
      publishId: result.data?.publish_id,
      platform: 'tiktok',
      status: 'processing', // TikTok processes asynchronously
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
