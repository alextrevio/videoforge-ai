'use client'
import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react'
import {
  Channel, VideoItem, AppSettings, AppState, VideoStatus, Platform,
  DEFAULT_SETTINGS, NICHES, PIPELINE_STEPS, genId, nowDate, fmtDur
} from './store'
import { isSupabaseConfigured } from './supabase'
import * as db from './db'

// ═══════════════════════════════════════════════════════
// TITLE GENERATION
// ═══════════════════════════════════════════════════════
const TEMPLATES: Record<string, string[]> = {
  history:['La Historia Oculta de {t}','El Ascenso y Caída de {t}','{t}: Lo que Nunca te Contaron','Los Secretos de {t}','¿Cómo Desapareció {t}?'],
  kids:['Aprende {t} con Canciones','{t} para Niños','Vamos a Aprender {t}','Descubre {t} Jugando','El Mundo de {t}'],
  facts:['10 Datos Increíbles de {t}','¿Sabías Esto de {t}?','La Ciencia de {t}','5 Cosas de {t}','Todo sobre {t}'],
  horror:['El Terror de {t}','{t}: Caso Real','La Leyenda de {t}','El Misterio de {t}','Nadie Sobrevivió a {t}'],
  motivation:['Cómo {t} Cambió Mi Vida','El Secreto de {t}','Mentalidad de {t}','Nunca Renuncies a {t}','El Poder de {t}'],
  tech:['IA y {t}: El Futuro','El Futuro de {t}','Robots que Hacen {t}','{t} ya Existe','5 Innovaciones de {t}'],
  lifestyle:['Mi Rutina de {t}','Cómo Mejorar tu {t}','{t}: Guía Completa','Tips de {t}','Transforma tu {t}'],
  finance:['Cómo Ganar con {t}','{t}: La Verdad','5 Secretos de {t}','Invierte en {t}','{t} para Principiantes'],
  gaming:['Top 10 de {t}','{t}: Review Completo','Secretos de {t}','Guía de {t}','{t} es INCREÍBLE'],
  other:['Todo sobre {t}','{t} Explicado','La Verdad de {t}','Descubre {t}','{t}: Lo que Nadie Sabe'],
}
function generateTitles(idea: string, niche: string, count: number): string[] {
  const tpl = TEMPLATES[niche] || TEMPLATES.other
  const words = idea.split(' ').filter(w => w.length > 3)
  const topics = words.length > 0 ? words : ['el Mundo']
  return Array.from({ length: count }, (_, i) => {
    const t = tpl[i % tpl.length], topic = topics[i % topics.length]
    return t.replace('{t}', topic.charAt(0).toUpperCase() + topic.slice(1)) + (i >= tpl.length ? ` — Pt.${Math.floor(i / tpl.length) + 1}` : '')
  })
}

// ═══════════════════════════════════════════════════════
// SCHEDULE + AUTOPILOT HELPERS
// ═══════════════════════════════════════════════════════
const TIMES = ['08:00','10:00','12:00','14:00','16:00','18:00','20:00']
function scheduleDate(base: string, idx: number, perDay: number) {
  const d = new Date(base); d.setDate(d.getDate() + Math.floor(idx / perDay)); return d.toISOString().split('T')[0]
}
function scheduleTime(idx: number, perDay: number) { return TIMES[idx % perDay] || TIMES[0] }
const STATUS_ORDER: VideoStatus[] = ['script','voiceover','visuals','editing','thumbnail','review','scheduled','published']

const IDEA_SEEDS: Record<string, string[]> = {
  history:['civilizaciones perdidas','batallas épicas','imperios antiguos','inventos que cambiaron todo','misterios históricos'],
  kids:['animales del océano','colores del arcoíris','planetas del sistema solar','dinosaurios','estaciones del año'],
  facts:['el cuerpo humano','el espacio','animales raros','el océano profundo','récords mundiales'],
  horror:['casas embrujadas reales','desapariciones inexplicables','leyendas urbanas','lugares malditos','pueblos fantasma'],
  motivation:['hábitos de éxito','mentalidad ganadora','superar el fracaso','disciplina diaria','emprendimiento'],
  tech:['inteligencia artificial','robots del futuro','gadgets increíbles','ciberseguridad','realidad virtual'],
  lifestyle:['rutinas matutinas','organización del hogar','viajes baratos','recetas rápidas','ejercicio en casa'],
  finance:['inversiones para principiantes','ahorro inteligente','criptomonedas','ingresos pasivos','libertad financiera'],
  gaming:['juegos indie','trucos secretos','speedruns épicos','mejores jefes finales','juegos retro'],
  other:['datos curiosos','cosas que no sabías','misterios sin resolver','top 10','predicciones del futuro'],
}
function pickRandomIdea(niche: string) { const s = IDEA_SEEDS[niche]||IDEA_SEEDS.other; return s[Math.floor(Math.random()*s.length)] }

// ═══════════════════════════════════════════════════════
// CONTEXT TYPE
// ═══════════════════════════════════════════════════════
interface Ctx {
  channels: Channel[]; videos: VideoItem[]; settings: AppSettings; userId: string
  addChannel: (d: Pick<Channel,'name'|'platform'|'niche'|'icon'|'color'> & Partial<Channel>) => Channel
  updateChannel: (id: string, d: Partial<Channel>) => void
  deleteChannel: (id: string) => void
  addVideo: (d: Partial<VideoItem> & { title: string; channelId: string }) => VideoItem
  updateVideo: (id: string, d: Partial<VideoItem>) => void
  deleteVideo: (id: string) => void
  advanceVideo: (id: string) => void
  publishVideo: (id: string) => void
  triggerRender: (videoId: string) => void
  generateVideos: (idea: string, channelId: string, count: number, dur: string, perDay: number, platforms: string[]) => VideoItem[]
  updateSettings: (d: Partial<AppSettings>) => void
  resetAll: () => void
  renderQueue: string[]
  dbMode: 'supabase' | 'local'
}

const AppContext = createContext<Ctx | null>(null)
const LS_KEY = 'videoforge_v3'

function lsLoad(): AppState | null {
  if (typeof window === 'undefined') return null
  try { const r = localStorage.getItem(LS_KEY); return r ? JSON.parse(r) : null } catch { return null }
}
function lsSave(s: AppState) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(LS_KEY, JSON.stringify(s)) } catch {}
}

// ═══════════════════════════════════════════════════════
// PROVIDER
// ═══════════════════════════════════════════════════════
export function AppProvider({ children, userId }: { children: ReactNode; userId?: string }) {
  const uid = userId || 'owner'
  const useDb = isSupabaseConfigured()
  const dbMode = useDb ? 'supabase' as const : 'local' as const

  const [channels, setChannels] = useState<Channel[]>([])
  const [videos, setVideos] = useState<VideoItem[]>([])
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [loaded, setLoaded] = useState(false)
  const [renderQueue, setRenderQueue] = useState<string[]>([])
  const processingRef = useRef(false)

  // ── LOAD DATA ─────────────────────────────────────
  useEffect(() => {
    const loadData = async () => {
      if (useDb) {
        const [chs, vids] = await Promise.all([db.fetchChannels(), db.fetchVideos()])
        setChannels(chs)
        setVideos(vids)
      } else {
        const s = lsLoad()
        if (s) {
          if (s.channels) setChannels(s.channels)
          if (s.videos) setVideos(s.videos)
          if (s.settings) setSettings(prev => ({ ...prev, ...s.settings }))
        }
      }
      setLoaded(true)
    }
    loadData()
  }, [uid, useDb])

  // ── SAVE TO LOCALSTORAGE (fallback only) ──────────
  useEffect(() => {
    if (!loaded || useDb) return
    lsSave({ channels, videos, settings })
  }, [channels, videos, settings, loaded, useDb])

  // ═══════════════════════════════════════════════════
  // AUTO-RENDER PIPELINE
  // ═══════════════════════════════════════════════════
  const videosRef = useRef(videos)
  const channelsRef = useRef(channels)
  const settingsRef = useRef(settings)
  useEffect(() => { videosRef.current = videos }, [videos])
  useEffect(() => { channelsRef.current = channels }, [channels])
  useEffect(() => { settingsRef.current = settings }, [settings])

  useEffect(() => {
    if (!loaded || renderQueue.length === 0 || processingRef.current) return
    const processNext = async () => {
      if (processingRef.current) return
      processingRef.current = true
      const videoId = renderQueue[0]
      const video = videosRef.current.find(v => v.id === videoId)
      const ch = channelsRef.current.find(c => c.id === video?.channelId)
      if (!video || !ch) { setRenderQueue(q => q.slice(1)); processingRef.current = false; return }

      const updateVid = (d: Partial<VideoItem>) => {
        setVideos(p => p.map(v => v.id === videoId ? { ...v, ...d } : v))
        if (useDb) db.patchVideo(videoId, d).catch(() => {})
      }

      try {
        const niche = ch.niche
        const durStr = video.duration.replace(/[^0-9]/g, '') || '60'
        const sRef = settingsRef.current

        // STEP 1: SCRIPT (GPT generates scene-based script)
        updateVid({ status: 'script' as VideoStatus, progress: 10, renderData: { renderStatus: 'generating script...' } })
        let finalScript = video.script
        let scriptScenes: string[] = []
        if (!finalScript || finalScript.length < 20) {
          const r = await fetch('/api/generate/script', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: video.title, description: video.description, niche, duration: durStr, lang: sRef.lang || 'es-MX' }) })
          if (!r.ok) throw new Error(`Script API error: ${r.status}`)
          const d = await r.json()
          if (d.error) throw new Error(d.error)
          finalScript = d.script || video.title
          scriptScenes = d.scenes || []
          console.log('[VideoForge] Script generated:', finalScript.length, 'chars,', scriptScenes.length, 'scenes')
          updateVid({ script: finalScript, progress: 25 })
        }

        // If script didn't return structured scenes, split by paragraphs
        if (scriptScenes.length === 0) {
          scriptScenes = finalScript.replace(/\[.*?\]/g, '').replace(/\(.*?\)/g, '')
            .split(/\n\n+/)
            .map((s: string) => s.trim())
            .filter((s: string) => s.length > 15)
            .slice(0, 4)
        }
        if (scriptScenes.length === 0) scriptScenes = [finalScript.slice(0, 200)]

        // STEP 2: VISUAL STORYBOARD (GPT as creative director — cohesive scenes)
        updateVid({ status: 'visuals' as VideoStatus, progress: 30, renderData: { renderStatus: 'creating visual storyboard...' } })
        let visualPrompts: string[] = scriptScenes.map((s: string) => s.slice(0, 80))
        try {
          const promptRes = await fetch('/api/generate/scene-prompts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scenes: scriptScenes, niche, title: video.title, script: finalScript }) })
          if (promptRes.ok) {
            const promptData = await promptRes.json()
            console.log('[VideoForge] Storyboard:', promptData.mode, '| Concept:', promptData.concept)
            if (promptData.prompts?.length) visualPrompts = promptData.prompts
          }
        } catch {}
        updateVid({ progress: 40 })

        // STEP 3: AI VIDEO (Kling generates each scene as a clip)
        updateVid({ status: 'editing' as VideoStatus, progress: 45, renderData: { renderStatus: 'generating AI video clips...' } })
        let aiClips: any[] = []
        const scenesForVideo = visualPrompts.map((prompt: string) => ({ prompt, duration: 5 }))
        try {
          const aiRes = await fetch('/api/generate/ai-video', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scenes: scenesForVideo, niche, aspectRatio: '9:16' }) })
          if (aiRes.ok) {
            const aiData = await aiRes.json()
            console.log('[VideoForge] AI Video response:', aiData.mode, 'queued:', aiData.queued, 'failed:', aiData.failed, 'errors:', aiData.errors)
            if ((aiData.mode === 'kling-fal' || aiData.mode === 'all-failed') && aiData.clips?.length) {
              // Poll for completion (max 5 minutes)
              const pendingIds = aiData.clips.filter((c: any) => c.requestId).map((c: any) => ({ sceneIndex: c.sceneIndex, requestId: c.requestId }))
              if (pendingIds.length > 0) {
                updateVid({ progress: 55, renderData: { renderStatus: `generating ${pendingIds.length} AI video clips...` } })
                let attempts = 0
                while (attempts < 60) { // 60 * 5s = 5 min max
                  await new Promise(r => setTimeout(r, 5000))
                  attempts++
                  try {
                    const pollRes = await fetch('/api/generate/ai-video/status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ requestIds: pendingIds }) })
                    if (pollRes.ok) {
                      const pollData = await pollRes.json()
                      const completed = pollData.clips?.filter((c: any) => c.status === 'completed') || []
                      updateVid({ progress: 55 + Math.round((completed.length / pendingIds.length) * 10), renderData: { renderStatus: `AI video: ${completed.length}/${pendingIds.length} clips ready` } })
                      if (pollData.allComplete) {
                        aiClips = pollData.clips.filter((c: any) => c.videoUrl)
                        break
                      }
                    }
                  } catch {}
                }
              }
            }
            // Fallback: use Pexels images if no AI clips (any reason: no FAL_KEY, errors, timeout)
            if (aiClips.length === 0) {
              const scenes2 = scriptScenes.map((text: string, i: number) => ({ text: text.slice(0, 30), startSec: i * 5, endSec: (i + 1) * 5 }))
              const mediaRes = await fetch('/api/generate/media', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scenes: scenes2, niche }) })
              if (mediaRes.ok) {
                const mediaData2 = await mediaRes.json()
                aiClips = (mediaData2.media || []).map((m: any) => ({ ...m, videoUrl: null, imageUrl: m.imageUrl }))
              }
            }
          }
        } catch {}
        // Final fallback: if AI video failed completely and no clips at all
        if (aiClips.length === 0) {
          try {
            const scenes2 = scriptScenes.map((text: string, i: number) => ({ text: text.slice(0, 30), startSec: i * 5, endSec: (i + 1) * 5 }))
            const mediaRes = await fetch('/api/generate/media', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scenes: scenes2, niche }) })
            if (mediaRes.ok) {
              const mediaData2 = await mediaRes.json()
              aiClips = (mediaData2.media || []).map((m: any) => ({ ...m, videoUrl: null, imageUrl: m.imageUrl }))
            }
          } catch {}
        }
        updateVid({ progress: 65 })

        // STEP 4: SUBTITLES (from script text)
        updateVid({ status: 'thumbnail' as VideoStatus, progress: 75, renderData: { renderStatus: 'generating subtitles...' } })
        const subRes = await fetch('/api/generate/subtitles', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ script: finalScript, audioUrl: null, duration: durStr }) })
        if (!subRes.ok) throw new Error(`Subtitles API error: ${subRes.status}`)
        const subData = await subRes.json()

        // STEP 5: CONCATENATE INTO FINAL MP4 (Shotstack)
        let finalVideoUrl: string | null = null
        const videoClips = aiClips.filter((c: any) => c.videoUrl)
        if (videoClips.length > 0) {
          updateVid({ status: 'review' as VideoStatus, progress: 80, renderData: { renderStatus: 'rendering final MP4...' } })
          try {
            const concatRes = await fetch('/api/generate/concat', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ clips: videoClips.map((c: any) => ({ videoUrl: c.videoUrl, duration: 5 })), title: video.title })
            })
            if (concatRes.ok) {
              const concatData = await concatRes.json()
              if (concatData.renderId && concatData.mode === 'shotstack') {
                // Poll for completion (max 3 min)
                let concatAttempts = 0
                while (concatAttempts < 36) { // 36 * 5s = 3 min
                  await new Promise(r => setTimeout(r, 5000))
                  concatAttempts++
                  try {
                    const pollRes = await fetch('/api/generate/concat/status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ renderId: concatData.renderId }) })
                    if (pollRes.ok) {
                      const pollData = await pollRes.json()
                      updateVid({ progress: 80 + Math.min(concatAttempts, 10), renderData: { renderStatus: `rendering MP4: ${pollData.status}...` } })
                      if (pollData.status === 'done' && pollData.videoUrl) {
                        finalVideoUrl = pollData.videoUrl
                        break
                      }
                      if (pollData.status === 'failed') break
                    }
                  } catch {}
                }
              } else if (concatData.videoUrl) {
                // No Shotstack — use first clip as preview
                finalVideoUrl = concatData.videoUrl
              }
            }
          } catch {}
        }

        // DONE — mark as review with final video
        updateVid({
          status: 'review' as VideoStatus, progress: finalVideoUrl ? 95 : 85,
          videoUrl: finalVideoUrl || undefined,
          script: finalScript,
          renderData: {
            renderStatus: finalVideoUrl ? 'complete-mp4' : 'complete',
            steps: {
              script: { length: finalScript.length },
              aiVideo: { clipCount: aiClips.length, mode: videoClips.length > 0 ? 'kling' : 'pexels-fallback' },
              subtitles: { mode: subData.mode, count: (subData.subtitles || []).length },
              concat: { mode: finalVideoUrl ? 'shotstack' : 'clips-only', videoUrl: finalVideoUrl },
            },
            composition: { clips: aiClips, subtitles: subData.subtitles, finalVideoUrl }
          }
        })
      } catch (err: any) {
        console.error('[VideoForge] Render error:', err)
        updateVid({ status: 'script' as VideoStatus, progress: 5, renderData: { error: err.message || 'Unknown error', renderStatus: 'failed' } })
      }
      setRenderQueue(q => q.slice(1))
      processingRef.current = false
    }
    const timer = setTimeout(processNext, 500)
    return () => clearTimeout(timer)
  }, [loaded, renderQueue, useDb])

  // ═══════════════════════════════════════════════════
  // AUTO-ADVANCE: review → scheduled → published
  // ═══════════════════════════════════════════════════
  useEffect(() => {
    if (!loaded || !settings.autoAdvance) return
    const iv = setInterval(() => {
      const today = nowDate(), nowTime = new Date().toTimeString().slice(0, 5)
      setVideos(prev => {
        let changed = false
        const next = prev.map(v => {
          const ch = channels.find(c => c.id === v.channelId)
          if (v.status === 'review' && ch?.autopilot) {
            changed = true
            const upd = { ...v, status: 'scheduled' as VideoStatus, progress: 90 }
            if (useDb) db.patchVideo(v.id, { status: 'scheduled', progress: 90 })
            return upd
          }
          if (v.status === 'scheduled' && ch?.autopilot && v.scheduledDate <= today && v.scheduledTime <= nowTime) {
            changed = true
            const upd = { ...v, status: 'published' as VideoStatus, progress: 100, publishedAt: today }
            if (useDb) db.patchVideo(v.id, { status: 'published', progress: 100, publishedAt: today })
            return upd
          }
          return v
        })
        return changed ? next : prev
      })
    }, 8000)
    return () => clearInterval(iv)
  }, [loaded, channels, settings.autoAdvance, useDb])

  // ═══════════════════════════════════════════════════
  // AUTOPILOT: auto-generate + auto-render
  // ═══════════════════════════════════════════════════
  useEffect(() => {
    if (!loaded) return
    const iv = setInterval(() => {
      const today = nowDate()
      const newIds: string[] = []
      setVideos(prev => {
        let newVids: VideoItem[] = []
        channels.forEach(ch => {
          if (!ch.autopilot || !ch.autopilotIdea) return
          const future = prev.filter(v => v.channelId === ch.id && v.scheduledDate >= today && v.status !== 'published')
          const buffer = ch.autopilotPerDay * 3
          if (future.length >= buffer) return
          const need = buffer - future.length
          const idea = pickRandomIdea(ch.niche) + ' ' + ch.autopilotIdea
          const titles = generateTitles(idea, ch.niche, need)
          const lastDate = future.length > 0 ? future.sort((a, b) => b.scheduledDate.localeCompare(a.scheduledDate))[0].scheduledDate : today
          const base = new Date(lastDate); base.setDate(base.getDate() + 1)
          const baseStr = base.toISOString().split('T')[0]
          titles.forEach((title, i) => {
            const vid: VideoItem = { id: genId('vid'), title, description: `${ch.autopilotIdea} — Auto`, tags: [ch.niche], script: '', channelId: ch.id, status: 'script' as VideoStatus, progress: 0, duration: fmtDur(ch.autopilotDuration), scheduledDate: scheduleDate(baseStr, i, ch.autopilotPerDay), scheduledTime: scheduleTime(i, ch.autopilotPerDay), platforms: ch.autopilotPlatforms, createdAt: today }
            newVids.push(vid); newIds.push(vid.id)
          })
        })
        if (newVids.length > 0) {
          if (useDb) db.insertVideoBatch(newVids)
          return [...prev, ...newVids]
        }
        return prev
      })
      if (newIds.length > 0) setRenderQueue(q => [...q, ...newIds])
    }, 30000)
    return () => clearInterval(iv)
  }, [loaded, channels, uid, useDb])

  // ═══════════════════════════════════════════════════
  // CHANNEL CRUD
  // ═══════════════════════════════════════════════════
  const addChannel = useCallback((d: Pick<Channel,'name'|'platform'|'niche'|'icon'|'color'> & Partial<Channel>) => {
    const ch: Channel = {
      id: genId('ch'), name: d.name, platform: d.platform, niche: d.niche,
      icon: d.icon, color: d.color, status: 'active', createdAt: nowDate(),
      autopilot: d.autopilot ?? false, autopilotIdea: d.autopilotIdea ?? '',
      autopilotPerDay: d.autopilotPerDay ?? 3, autopilotDuration: d.autopilotDuration ?? '60',
      autopilotPlatforms: d.autopilotPlatforms ?? [d.platform],
    }
    setChannels(p => [...p, ch])
    if (useDb) db.insertChannel(ch)
    return ch
  }, [uid, useDb])

  const updateChannel = useCallback((id: string, d: Partial<Channel>) => {
    setChannels(p => p.map(c => c.id === id ? { ...c, ...d } : c))
    if (useDb) db.patchChannel(id, d)
  }, [useDb])

  const deleteChannel = useCallback((id: string) => {
    setChannels(p => p.filter(c => c.id !== id))
    setVideos(p => p.filter(v => v.channelId !== id))
    if (useDb) db.removeChannel(id)
  }, [useDb])

  // ═══════════════════════════════════════════════════
  // VIDEO CRUD
  // ═══════════════════════════════════════════════════
  const addVideo = useCallback((d: Partial<VideoItem> & { title: string; channelId: string }) => {
    const v: VideoItem = {
      id: genId('vid'), title: d.title, description: d.description || '', tags: d.tags || [],
      script: d.script || '', channelId: d.channelId, status: d.status || 'script',
      progress: d.progress || 0, duration: d.duration || '1:00',
      scheduledDate: d.scheduledDate || '', scheduledTime: d.scheduledTime || '',
      platforms: d.platforms || settings.defaultPlatforms, createdAt: nowDate(),
    }
    setVideos(p => [...p, v])
    if (useDb) db.insertVideo(v)
    return v
  }, [settings.defaultPlatforms, uid, useDb])

  const updateVideo = useCallback((id: string, d: Partial<VideoItem>) => {
    setVideos(p => p.map(v => v.id === id ? { ...v, ...d } : v))
    if (useDb) db.patchVideo(id, d)
  }, [useDb])

  const deleteVideo = useCallback((id: string) => {
    setVideos(p => p.filter(v => v.id !== id))
    setRenderQueue(q => q.filter(vid => vid !== id))
    if (useDb) db.removeVideo(id)
  }, [useDb])

  const advanceVideo = useCallback((id: string) => {
    setVideos(p => p.map(v => {
      if (v.id !== id) return v
      const idx = STATUS_ORDER.indexOf(v.status)
      if (idx < 0 || idx >= STATUS_ORDER.length - 1) return v
      const ns = STATUS_ORDER[idx + 1]
      const upd = { status: ns, progress: ns === 'published' ? 100 : Math.min(v.progress + 15, 95) }
      if (useDb) db.patchVideo(id, upd)
      return { ...v, ...upd }
    }))
  }, [useDb])

  const publishVideo = useCallback((id: string) => {
    const upd = { status: 'published' as VideoStatus, progress: 100, publishedAt: nowDate() }
    setVideos(p => p.map(v => v.id === id ? { ...v, ...upd } : v))
    if (useDb) db.patchVideo(id, upd)
  }, [useDb])

  const triggerRender = useCallback((videoId: string) => {
    setRenderQueue(q => q.includes(videoId) ? q : [...q, videoId])
  }, [])

  // ═══════════════════════════════════════════════════
  // BATCH GENERATE + AUTO-RENDER
  // ═══════════════════════════════════════════════════
  const generateVideos = useCallback((idea: string, channelId: string, count: number, dur: string, perDay: number, platforms: string[]) => {
    const ch = channels.find(c => c.id === channelId)
    if (!ch) return []
    const titles = generateTitles(idea, ch.niche, count)
    const today = nowDate(), plats = platforms as Platform[]
    const created: VideoItem[] = titles.map((title, i) => ({
      id: genId('vid'), title, description: `${idea} — Video ${i + 1}`, tags: [ch.niche, 'video'],
      script: '', channelId, status: 'script' as VideoStatus, progress: 0,
      duration: fmtDur(dur), scheduledDate: scheduleDate(today, i, perDay),
      scheduledTime: scheduleTime(i, perDay), platforms: plats, createdAt: today,
    }))
    setVideos(p => [...p, ...created])
    if (useDb) db.insertVideoBatch(created)
    setRenderQueue(q => [...q, ...created.map(v => v.id)])
    return created
  }, [channels, uid, useDb])

  const updateSettings = useCallback((d: Partial<AppSettings>) => { setSettings(p => ({ ...p, ...d })) }, [])
  const resetAll = useCallback(() => {
    setChannels([]); setVideos([]); setSettings(DEFAULT_SETTINGS); setRenderQueue([])
    if (!useDb) localStorage.removeItem(LS_KEY)
  }, [useDb])

  return <AppContext.Provider value={{
    channels, videos, settings, userId: uid, renderQueue, dbMode,
    addChannel, updateChannel, deleteChannel,
    addVideo, updateVideo, deleteVideo, advanceVideo, publishVideo, triggerRender,
    generateVideos, updateSettings, resetAll,
  }}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
