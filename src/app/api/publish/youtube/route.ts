import { NextRequest, NextResponse } from 'next/server'

// POST /api/publish/youtube
// Uploads video to YouTube using YouTube Data API v3
export async function POST(req: NextRequest) {
  try {
    const { title, description, tags, videoUrl, thumbnailUrl, accessToken, categoryId } = await req.json()

    if (!accessToken) {
      return NextResponse.json({ error: 'YouTube OAuth token required. Connect your channel first.' }, { status: 401 })
    }

    // Step 1: Initialize resumable upload
    const initRes = await fetch(
      'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          snippet: {
            title,
            description,
            tags: tags || [],
            categoryId: categoryId || '22', // People & Blogs
            defaultLanguage: 'es',
          },
          status: {
            privacyStatus: 'public',
            selfDeclaredMadeForKids: false,
          },
        }),
      }
    )

    if (!initRes.ok) {
      const err = await initRes.text()
      return NextResponse.json({ error: `YouTube init failed: ${err}` }, { status: 500 })
    }

    const uploadUrl = initRes.headers.get('Location')
    if (!uploadUrl) {
      return NextResponse.json({ error: 'No upload URL returned' }, { status: 500 })
    }

    // Step 2: Fetch video file and upload
    const videoRes = await fetch(videoUrl)
    const videoBuffer = await videoRes.arrayBuffer()

    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'video/mp4',
        'Content-Length': videoBuffer.byteLength.toString(),
      },
      body: videoBuffer,
    })

    if (!uploadRes.ok) {
      const err = await uploadRes.text()
      return NextResponse.json({ error: `YouTube upload failed: ${err}` }, { status: 500 })
    }

    const result = await uploadRes.json()

    // Step 3: Set thumbnail if provided
    if (thumbnailUrl && result.id) {
      try {
        const thumbRes = await fetch(thumbnailUrl)
        const thumbBuffer = await thumbRes.arrayBuffer()
        await fetch(
          `https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId=${result.id}&uploadType=media`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'image/jpeg',
            },
            body: thumbBuffer,
          }
        )
      } catch { /* thumbnail is optional */ }
    }

    return NextResponse.json({
      videoId: result.id,
      url: `https://youtube.com/watch?v=${result.id}`,
      platform: 'youtube',
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
