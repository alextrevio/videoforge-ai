import { NextRequest, NextResponse } from 'next/server'

// POST /api/publish
// Publishes a video to the selected platform
// Requires OAuth tokens stored on the channel
export async function POST(req: NextRequest) {
  try {
    const { platform, title, description, tags, videoUrl, thumbnailUrl, oauthToken, platformChannelId } = await req.json()

    if (!oauthToken) {
      return NextResponse.json({
        success: false,
        mode: 'simulation',
        message: `Conecta tu cuenta de ${platform} en Canales para publicar automáticamente.`,
        platformVideoId: null,
      })
    }

    switch (platform) {
      case 'youtube':
        return await publishYouTube({ title, description, tags, videoUrl, thumbnailUrl, oauthToken, platformChannelId })
      case 'tiktok':
        return await publishTikTok({ title, description, videoUrl, oauthToken })
      case 'instagram':
        return await publishInstagram({ title, description, videoUrl, thumbnailUrl, oauthToken })
      case 'facebook':
        return await publishFacebook({ title, description, videoUrl, oauthToken, platformChannelId })
      default:
        return NextResponse.json({ success: false, error: `Plataforma "${platform}" no soportada` }, { status: 400 })
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// ── YouTube ─────────────────────────────────────────────
async function publishYouTube(p: any) {
  // Step 1: Initialize resumable upload
  const initRes = await fetch(
    'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${p.oauthToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        snippet: {
          title: p.title,
          description: p.description,
          tags: p.tags,
          categoryId: '22', // People & Blogs
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
    return NextResponse.json({ success: false, error: `YouTube init error: ${err}` }, { status: 500 })
  }

  const uploadUrl = initRes.headers.get('location')
  if (!uploadUrl) {
    return NextResponse.json({ success: false, error: 'No upload URL returned' }, { status: 500 })
  }

  // Step 2: Fetch video file and upload
  const videoRes = await fetch(p.videoUrl)
  const videoBlob = await videoRes.blob()

  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'video/mp4' },
    body: videoBlob,
  })

  if (!uploadRes.ok) {
    const err = await uploadRes.text()
    return NextResponse.json({ success: false, error: `YouTube upload error: ${err}` }, { status: 500 })
  }

  const data = await uploadRes.json()
  return NextResponse.json({
    success: true,
    mode: 'youtube',
    platformVideoId: data.id,
    url: `https://youtube.com/watch?v=${data.id}`,
  })
}

// ── TikTok ──────────────────────────────────────────────
async function publishTikTok(p: any) {
  // TikTok Content Posting API v2
  // Step 1: Initialize upload
  const initRes = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${p.oauthToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      post_info: {
        title: p.title.slice(0, 150),
        privacy_level: 'PUBLIC_TO_EVERYONE',
        disable_duet: false,
        disable_comment: false,
        disable_stitch: false,
      },
      source_info: {
        source: 'PULL_FROM_URL',
        video_url: p.videoUrl,
      },
    }),
  })

  if (!initRes.ok) {
    const err = await initRes.text()
    return NextResponse.json({ success: false, error: `TikTok error: ${err}` }, { status: 500 })
  }

  const data = await initRes.json()
  return NextResponse.json({
    success: true,
    mode: 'tiktok',
    platformVideoId: data.data?.publish_id || null,
  })
}

// ── Instagram (Reels via Graph API) ─────────────────────
async function publishInstagram(p: any) {
  // Step 1: Create media container
  const containerRes = await fetch(
    `https://graph.facebook.com/v18.0/me/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        media_type: 'REELS',
        video_url: p.videoUrl,
        caption: `${p.title}\n\n${p.description}`,
        access_token: p.oauthToken,
      }),
    }
  )

  if (!containerRes.ok) {
    const err = await containerRes.text()
    return NextResponse.json({ success: false, error: `Instagram error: ${err}` }, { status: 500 })
  }

  const container = await containerRes.json()

  // Step 2: Publish
  const publishRes = await fetch(
    `https://graph.facebook.com/v18.0/me/media_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creation_id: container.id,
        access_token: p.oauthToken,
      }),
    }
  )

  const pub = await publishRes.json()
  return NextResponse.json({
    success: true,
    mode: 'instagram',
    platformVideoId: pub.id,
  })
}

// ── Facebook ────────────────────────────────────────────
async function publishFacebook(p: any) {
  const res = await fetch(
    `https://graph.facebook.com/v18.0/${p.platformChannelId || 'me'}/videos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        file_url: p.videoUrl,
        title: p.title,
        description: p.description,
        access_token: p.oauthToken,
      }),
    }
  )

  if (!res.ok) {
    const err = await res.text()
    return NextResponse.json({ success: false, error: `Facebook error: ${err}` }, { status: 500 })
  }

  const data = await res.json()
  return NextResponse.json({
    success: true,
    mode: 'facebook',
    platformVideoId: data.id,
  })
}
