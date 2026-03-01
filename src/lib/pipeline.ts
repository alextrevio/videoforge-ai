// ── Pipeline Engine ─────────────────────────────────────
// Connects frontend pipeline stages to real API routes
// Each function advances a video to the next stage by calling the API

import { VideoItem, VideoStatus } from './store'

type StageResult = {
  success: boolean
  data?: any
  error?: string
  nextStatus: VideoStatus
  progress: number
}

// ── Stage: Script Generation ────────────────────────────
export async function runScript(video: VideoItem, niche: string, lang: string): Promise<StageResult> {
  try {
    const res = await fetch('/api/generate/script', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: video.title,
        description: video.description,
        niche,
        duration: video.duration.replace(/[^0-9]/g, ''),
        lang,
      }),
    })
    const data = await res.json()
    if (data.error) return { success: false, error: data.error, nextStatus: 'script', progress: 5 }
    return {
      success: true,
      data: { script: data.script, tags: data.tags, hook: data.hook, cta: data.cta },
      nextStatus: 'voiceover',
      progress: 15,
    }
  } catch (e: any) {
    return { success: false, error: e.message, nextStatus: 'script', progress: 5 }
  }
}

// ── Stage: Voiceover ────────────────────────────────────
export async function runVoiceover(video: VideoItem, voice: string): Promise<StageResult> {
  try {
    const res = await fetch('/api/generate/voiceover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        script: video.script,
        voice,
        videoId: video.id,
      }),
    })
    const data = await res.json()
    if (data.error) return { success: false, error: data.error, nextStatus: 'voiceover', progress: 20 }
    return {
      success: true,
      data: { audioUrl: data.audioUrl },
      nextStatus: 'visuals',
      progress: 35,
    }
  } catch (e: any) {
    return { success: false, error: e.message, nextStatus: 'voiceover', progress: 20 }
  }
}

// ── Stage: Video Composition ────────────────────────────
export async function runVisuals(video: VideoItem, audioUrl: string | null): Promise<StageResult> {
  try {
    const res = await fetch('/api/generate/video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        videoId: video.id,
        title: video.title,
        script: video.script,
        audioUrl,
        duration: video.duration.replace(/[^0-9]/g, ''),
        niche: video.tags?.[0] || 'other',
      }),
    })
    const data = await res.json()
    if (data.error) return { success: false, error: data.error, nextStatus: 'visuals', progress: 40 }
    return {
      success: true,
      data: { renderId: data.renderId, videoUrl: data.videoUrl },
      nextStatus: 'editing',
      progress: 55,
    }
  } catch (e: any) {
    return { success: false, error: e.message, nextStatus: 'visuals', progress: 40 }
  }
}

// ── Stage: Editing (check render status) ────────────────
export async function runEditing(renderId: string | null): Promise<StageResult> {
  if (!renderId) {
    // No render to check — auto-advance (simulation mode)
    return { success: true, data: {}, nextStatus: 'thumbnail', progress: 70 }
  }
  try {
    const res = await fetch(`/api/generate/video?renderId=${renderId}`)
    const data = await res.json()
    if (data.status === 'done') {
      return {
        success: true,
        data: { videoUrl: data.videoUrl },
        nextStatus: 'thumbnail',
        progress: 70,
      }
    }
    if (data.status === 'failed') {
      return { success: false, error: 'Video render failed', nextStatus: 'editing', progress: 55 }
    }
    // Still rendering
    return { success: true, data: { rendering: true }, nextStatus: 'editing', progress: data.progress || 60 }
  } catch (e: any) {
    return { success: false, error: e.message, nextStatus: 'editing', progress: 55 }
  }
}

// ── Stage: Thumbnail ────────────────────────────────────
export async function runThumbnail(video: VideoItem, niche: string): Promise<StageResult> {
  try {
    const res = await fetch('/api/generate/thumbnail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: video.title,
        niche,
      }),
    })
    const data = await res.json()
    return {
      success: true,
      data: { thumbnailConcept: data.concept },
      nextStatus: 'review',
      progress: 85,
    }
  } catch (e: any) {
    return { success: false, error: e.message, nextStatus: 'thumbnail', progress: 75 }
  }
}

// ── Stage: Publish ──────────────────────────────────────
export async function runPublish(
  video: VideoItem,
  platform: string,
  accessToken: string | null,
  platformMeta?: { igUserId?: string; pageId?: string }
): Promise<StageResult> {
  if (!accessToken) {
    return { success: false, error: 'OAuth token not configured for this channel', nextStatus: 'scheduled', progress: 90 }
  }

  try {
    let endpoint = ''
    let body: any = {}

    switch (platform) {
      case 'youtube':
        endpoint = '/api/publish/youtube'
        body = {
          title: video.title,
          description: video.description,
          tags: video.tags,
          videoUrl: (video as any).videoUrl,
          thumbnailUrl: (video as any).thumbnailUrl,
          accessToken,
        }
        break
      case 'tiktok':
        endpoint = '/api/publish/tiktok'
        body = { title: video.title, videoUrl: (video as any).videoUrl, accessToken }
        break
      case 'instagram':
        endpoint = '/api/publish/instagram'
        body = {
          caption: `${video.title}\n\n${video.description}\n\n${video.tags?.map((t: string) => `#${t}`).join(' ')}`,
          videoUrl: (video as any).videoUrl,
          accessToken,
          igUserId: platformMeta?.igUserId,
        }
        break
      case 'facebook':
        endpoint = '/api/publish/facebook'
        body = {
          title: video.title,
          description: video.description,
          videoUrl: (video as any).videoUrl,
          accessToken,
          pageId: platformMeta?.pageId,
        }
        break
    }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (data.error) return { success: false, error: data.error, nextStatus: 'scheduled', progress: 90 }
    return {
      success: true,
      data: { platformVideoId: data.videoId || data.publishId || data.mediaId },
      nextStatus: 'published',
      progress: 100,
    }
  } catch (e: any) {
    return { success: false, error: e.message, nextStatus: 'scheduled', progress: 90 }
  }
}
