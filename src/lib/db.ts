import { supabase, isSupabaseConfigured } from './supabase'
import { Channel, VideoItem, Platform, VideoStatus } from './store'

// ── Single-user data layer ──────────────────────────────
const isDb = () => isSupabaseConfigured()
const OWNER = 'owner'
const db = () => supabase

// ── Channels ────────────────────────────────────────────
export async function fetchChannels(): Promise<Channel[]> {
  if (!isDb()) return []
  const { data } = await db().from('channels')
    .select('*').eq('user_id', OWNER).order('created_at', { ascending: true })
  if (!data) return []
  return data.map((r: any) => ({
    id: r.id, name: r.name, platform: r.platform as Platform,
    niche: r.niche, icon: r.icon, color: r.color,
    status: r.status as 'active'|'paused', createdAt: r.created_at,
    autopilot: r.autopilot, autopilotIdea: r.autopilot_idea,
    autopilotPerDay: r.autopilot_per_day, autopilotDuration: r.autopilot_duration,
    autopilotPlatforms: (r.autopilot_platforms || []) as Platform[],
  }))
}

export async function insertChannel(ch: Channel) {
  if (!isDb()) return
  await db().from('channels').insert({
    id: ch.id, user_id: OWNER, name: ch.name, platform: ch.platform,
    niche: ch.niche, icon: ch.icon, color: ch.color, status: ch.status,
    autopilot: ch.autopilot, autopilot_idea: ch.autopilotIdea,
    autopilot_per_day: ch.autopilotPerDay, autopilot_duration: ch.autopilotDuration,
    autopilot_platforms: ch.autopilotPlatforms,
  })
}

export async function patchChannel(id: string, d: Partial<Channel>) {
  if (!isDb()) return
  const map: any = {}
  if (d.name !== undefined) map.name = d.name
  if (d.status !== undefined) map.status = d.status
  if (d.autopilot !== undefined) map.autopilot = d.autopilot
  if (d.autopilotIdea !== undefined) map.autopilot_idea = d.autopilotIdea
  if (d.autopilotPerDay !== undefined) map.autopilot_per_day = d.autopilotPerDay
  if (d.autopilotDuration !== undefined) map.autopilot_duration = d.autopilotDuration
  if (d.autopilotPlatforms !== undefined) map.autopilot_platforms = d.autopilotPlatforms
  if (Object.keys(map).length > 0) await db().from('channels').update(map).eq('id', id)
}

export async function removeChannel(id: string) {
  if (!isDb()) return
  await db().from('channels').delete().eq('id', id)
}

// ── Videos ──────────────────────────────────────────────
export async function fetchVideos(): Promise<VideoItem[]> {
  if (!isDb()) return []
  const { data } = await db().from('videos')
    .select('*').eq('user_id', OWNER).order('created_at', { ascending: true })
  if (!data) return []
  return data.map((r: any) => ({
    id: r.id, title: r.title, description: r.description || '',
    tags: r.tags || [], script: r.script || '',
    channelId: r.channel_id, status: r.status as VideoStatus,
    progress: r.progress || 0, duration: r.duration || '1:00',
    scheduledDate: r.scheduled_date || '', scheduledTime: r.scheduled_time || '',
    platforms: (r.platforms || []) as Platform[],
    publishedAt: r.published_at || undefined, createdAt: r.created_at,
    audioUrl: r.audio_url || undefined, videoUrl: r.video_url || undefined,
    thumbnailUrl: r.thumbnail_url || undefined, renderData: r.render_data || undefined,
  }))
}

export async function insertVideo(v: VideoItem) {
  if (!isDb()) return
  await db().from('videos').insert({
    id: v.id, user_id: OWNER, channel_id: v.channelId,
    title: v.title, description: v.description, tags: v.tags,
    script: v.script, status: v.status, progress: v.progress,
    duration: v.duration, scheduled_date: v.scheduledDate || null,
    scheduled_time: v.scheduledTime || null, platforms: v.platforms,
    audio_url: v.audioUrl || null, video_url: v.videoUrl || null,
    thumbnail_url: v.thumbnailUrl || null, render_data: v.renderData || null,
  })
}

export async function insertVideoBatch(vids: VideoItem[]) {
  if (!isDb()) return
  const rows = vids.map((v: any) => ({
    id: v.id, user_id: OWNER, channel_id: v.channelId,
    title: v.title, description: v.description, tags: v.tags,
    script: v.script, status: v.status, progress: v.progress,
    duration: v.duration, scheduled_date: v.scheduledDate || null,
    scheduled_time: v.scheduledTime || null, platforms: v.platforms,
    audio_url: v.audioUrl || null, video_url: v.videoUrl || null,
    thumbnail_url: v.thumbnailUrl || null, render_data: v.renderData || null,
  }))
  await db().from('videos').insert(rows)
}

export async function patchVideo(id: string, d: Partial<VideoItem>) {
  if (!isDb()) return
  const map: any = {}
  if (d.title !== undefined) map.title = d.title
  if (d.description !== undefined) map.description = d.description
  if (d.script !== undefined) map.script = d.script
  if (d.status !== undefined) map.status = d.status
  if (d.progress !== undefined) map.progress = d.progress
  if (d.scheduledDate !== undefined) map.scheduled_date = d.scheduledDate || null
  if (d.scheduledTime !== undefined) map.scheduled_time = d.scheduledTime || null
  if (d.publishedAt !== undefined) map.published_at = d.publishedAt
  if (d.audioUrl !== undefined) map.audio_url = d.audioUrl
  if (d.videoUrl !== undefined) map.video_url = d.videoUrl
  if (d.thumbnailUrl !== undefined) map.thumbnail_url = d.thumbnailUrl
  if (d.renderData !== undefined) map.render_data = d.renderData
  if (Object.keys(map).length > 0) await db().from('videos').update(map).eq('id', id)
}

export async function removeVideo(id: string) {
  if (!isDb()) return
  await db().from('videos').delete().eq('id', id)
}
