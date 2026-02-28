import { supabase, isSupabaseConfigured } from './supabase'
import { Channel, VideoItem, AppSettings, Platform, VideoStatus, genId, nowDate, fmtDur } from './store'

// ── Hybrid Data Layer ───────────────────────────────────
// Uses Supabase when configured, falls back to localStorage
// This lets the app work in demo mode without a database

const isDb = () => isSupabaseConfigured()

// ── Auth ────────────────────────────────────────────────
export async function signUp(email: string, password: string, name: string) {
  if (!isDb()) return { user: { id: 'local', email, name }, error: null }
  const { data, error } = await supabase.auth.signUp({
    email, password, options: { data: { name } }
  })
  return { user: data.user, error }
}

export async function signIn(email: string, password: string) {
  if (!isDb()) return { user: { id: 'local', email }, error: null }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  return { user: data.user, error }
}

export async function signOut() {
  if (!isDb()) return
  await supabase.auth.signOut()
}

export async function getUser() {
  if (!isDb()) return null
  const { data } = await supabase.auth.getUser()
  return data.user
}

// ── Channels ────────────────────────────────────────────
export async function fetchChannels(userId: string): Promise<Channel[]> {
  if (!isDb()) return []
  const { data } = await supabase.from('channels')
    .select('*').eq('user_id', userId).order('created_at', { ascending: true })
  if (!data) return []
  return data.map(r => ({
    id: r.id, name: r.name, platform: r.platform as Platform,
    niche: r.niche, icon: r.icon, color: r.color,
    status: r.status as 'active'|'paused', createdAt: r.created_at,
    autopilot: r.autopilot, autopilotIdea: r.autopilot_idea,
    autopilotPerDay: r.autopilot_per_day, autopilotDuration: r.autopilot_duration,
    autopilotPlatforms: (r.autopilot_platforms || []) as Platform[],
  }))
}

export async function insertChannel(userId: string, ch: Channel) {
  if (!isDb()) return
  await supabase.from('channels').insert({
    id: ch.id, user_id: userId, name: ch.name, platform: ch.platform,
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
  if (Object.keys(map).length > 0) await supabase.from('channels').update(map).eq('id', id)
}

export async function removeChannel(id: string) {
  if (!isDb()) return
  await supabase.from('channels').delete().eq('id', id)
}

// ── Videos ──────────────────────────────────────────────
export async function fetchVideos(userId: string): Promise<VideoItem[]> {
  if (!isDb()) return []
  const { data } = await supabase.from('videos')
    .select('*').eq('user_id', userId).order('created_at', { ascending: true })
  if (!data) return []
  return data.map(r => ({
    id: r.id, title: r.title, description: r.description || '',
    tags: r.tags || [], script: r.script || '',
    channelId: r.channel_id, status: r.status as VideoStatus,
    progress: r.progress || 0, duration: r.duration || '1:00',
    scheduledDate: r.scheduled_date || '', scheduledTime: r.scheduled_time || '',
    platforms: (r.platforms || []) as Platform[],
    publishedAt: r.published_at || undefined, createdAt: r.created_at,
  }))
}

export async function insertVideo(userId: string, v: VideoItem) {
  if (!isDb()) return
  await supabase.from('videos').insert({
    id: v.id, user_id: userId, channel_id: v.channelId,
    title: v.title, description: v.description, tags: v.tags,
    script: v.script, status: v.status, progress: v.progress,
    duration: v.duration, scheduled_date: v.scheduledDate || null,
    scheduled_time: v.scheduledTime || null, platforms: v.platforms,
  })
}

export async function insertVideoBatch(userId: string, vids: VideoItem[]) {
  if (!isDb()) return
  const rows = vids.map(v => ({
    id: v.id, user_id: userId, channel_id: v.channelId,
    title: v.title, description: v.description, tags: v.tags,
    script: v.script, status: v.status, progress: v.progress,
    duration: v.duration, scheduled_date: v.scheduledDate || null,
    scheduled_time: v.scheduledTime || null, platforms: v.platforms,
  }))
  await supabase.from('videos').insert(rows)
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
  if (Object.keys(map).length > 0) await supabase.from('videos').update(map).eq('id', id)
}

export async function removeVideo(id: string) {
  if (!isDb()) return
  await supabase.from('videos').delete().eq('id', id)
}

// ── Jobs ────────────────────────────────────────────────
export async function createJob(userId: string, videoId: string, type: string) {
  if (!isDb()) return null
  const { data } = await supabase.from('jobs').insert({
    user_id: userId, video_id: videoId, type, status: 'pending'
  }).select().single()
  return data
}

export async function fetchPendingJobs(): Promise<any[]> {
  if (!isDb()) return []
  const { data } = await supabase.from('jobs')
    .select('*').eq('status', 'pending').order('created_at').limit(10)
  return data || []
}

export async function completeJob(jobId: string, result: any) {
  if (!isDb()) return
  await supabase.from('jobs').update({
    status: 'completed', result, completed_at: new Date().toISOString()
  }).eq('id', jobId)
}

export async function failJob(jobId: string, error: string) {
  if (!isDb()) return
  await supabase.from('jobs').update({ status: 'failed', error }).eq('id', jobId)
}
