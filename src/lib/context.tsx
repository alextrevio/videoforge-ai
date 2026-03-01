'use client'
import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react'
import {
  Channel, VideoItem, AppSettings, AppState, VideoStatus,
  DEFAULT_SETTINGS, NICHES, PIPELINE_STEPS, genId, nowDate, fmtDur
} from './store'

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
    const t = tpl[i % tpl.length]
    const topic = topics[i % topics.length]
    const cap = topic.charAt(0).toUpperCase() + topic.slice(1)
    return t.replace('{t}', cap) + (i >= tpl.length ? ` — Pt.${Math.floor(i / tpl.length) + 1}` : '')
  })
}

// ═══════════════════════════════════════════════════════
// SCHEDULE HELPERS
// ═══════════════════════════════════════════════════════
const TIMES = ['08:00','10:00','12:00','14:00','16:00','18:00','20:00']
function scheduleDate(baseDate: string, index: number, perDay: number) {
  const d = new Date(baseDate); d.setDate(d.getDate() + Math.floor(index / perDay))
  return d.toISOString().split('T')[0]
}
function scheduleTime(index: number, perDay: number) { return TIMES[index % perDay] || TIMES[0] }

const STATUS_ORDER: VideoStatus[] = ['script','voiceover','visuals','editing','thumbnail','review','scheduled','published']

// ═══════════════════════════════════════════════════════
// AUTOPILOT IDEAS
// ═══════════════════════════════════════════════════════
const IDEA_SEEDS: Record<string, string[]> = {
  history:['civilizaciones perdidas','batallas épicas','imperios antiguos','inventos que cambiaron todo','misterios históricos','reyes y reinas','revoluciones','descubrimientos arqueológicos','grandes migraciones','culturas olvidadas'],
  kids:['animales del océano','colores del arcoíris','números y formas','planetas del sistema solar','dinosaurios','estaciones del año','instrumentos musicales','frutas y verduras','partes del cuerpo','medios de transporte'],
  facts:['el cuerpo humano','el espacio','animales raros','la tecnología','el océano profundo','los volcanes','el cerebro','récords mundiales','fenómenos naturales','inventos accidentales'],
  horror:['casas embrujadas reales','desapariciones inexplicables','criaturas del bosque','leyendas urbanas','lugares malditos','avistamientos extraños','rituales prohibidos','pueblos fantasma','expediciones perdidas','objetos malditos'],
  motivation:['hábitos de éxito','mentalidad ganadora','superar el fracaso','disciplina diaria','emprendimiento','liderazgo','productividad','metas y sueños','resiliencia','confianza en ti mismo'],
  tech:['inteligencia artificial','robots del futuro','gadgets increíbles','apps revolucionarias','ciberseguridad','realidad virtual','drones','impresión 3D','autos eléctricos','tecnología espacial'],
  lifestyle:['rutinas matutinas','organización del hogar','viajes baratos','recetas rápidas','ejercicio en casa','moda sostenible','meditación','minimalismo','productividad personal','bienestar mental'],
  finance:['inversiones para principiantes','ahorro inteligente','criptomonedas','ingresos pasivos','errores financieros','emprender con poco','impuestos','bienes raíces','libertad financiera','presupuesto personal'],
  gaming:['juegos indie','trucos secretos','speedruns épicos','historia de los videojuegos','mejores jefes finales','juegos retro','esports','juegos cooperativos','easter eggs','juegos gratuitos'],
  other:['datos curiosos','cosas que no sabías','misterios sin resolver','comparaciones increíbles','top 10','antes y después','predicciones del futuro','errores famosos','coincidencias imposibles','experimentos locos'],
}
function pickRandomIdea(niche: string): string {
  const seeds = IDEA_SEEDS[niche] || IDEA_SEEDS.other
  return seeds[Math.floor(Math.random() * seeds.length)]
}

// ═══════════════════════════════════════════════════════
// CONTEXT TYPE
// ═══════════════════════════════════════════════════════
interface Ctx {
  channels: Channel[]; videos: VideoItem[]; settings: AppSettings
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
  renderQueue: string[] // video IDs currently rendering
}

const AppContext = createContext<Ctx | null>(null)
const KEY = 'videoforge_v3'

function load(): AppState | null {
  if (typeof window === 'undefined') return null
  try { const r = localStorage.getItem(KEY); return r ? JSON.parse(r) : null } catch { return null }
}
function save(s: AppState) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(KEY, JSON.stringify(s)) } catch {}
}

// ═══════════════════════════════════════════════════════
// PROVIDER
// ═══════════════════════════════════════════════════════
export function AppProvider({ children }: { children: ReactNode }) {
  const [channels, setChannels] = useState<Channel[]>([])
  const [videos, setVideos] = useState<VideoItem[]>([])
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [loaded, setLoaded] = useState(false)
  const [renderQueue, setRenderQueue] = useState<string[]>([])
  const processingRef = useRef(false)

  // Load
  useEffect(() => {
    const s = load()
    if (s) {
      if (s.channels) setChannels(s.channels)
      if (s.videos) setVideos(s.videos)
      if (s.settings) setSettings(prev => ({ ...prev, ...s.settings }))
    }
    setLoaded(true)
  }, [])

  // Save
  useEffect(() => {
    if (!loaded) return
    save({ channels, videos, settings })
  }, [channels, videos, settings, loaded])

  // ═══════════════════════════════════════════════════
  // AUTO-RENDER PIPELINE
  // Process one video at a time from the render queue
  // Calls /api/render which does: script → voice → media → subtitles → music → compose
  // ═══════════════════════════════════════════════════
  useEffect(() => {
    if (!loaded || renderQueue.length === 0 || processingRef.current) return

    const processNext = async () => {
      if (processingRef.current) return
      processingRef.current = true

      const videoId = renderQueue[0]
      const video = videos.find(v => v.id === videoId)
      const ch = channels.find(c => c.id === video?.channelId)

      if (!video || !ch) {
        setRenderQueue(q => q.slice(1))
        processingRef.current = false
        return
      }

      try {
        // Update status: rendering started
        setVideos(p => p.map(v => v.id === videoId ? {
          ...v, status: 'visuals' as VideoStatus, progress: 10,
          renderData: { ...v.renderData, renderStatus: 'starting' }
        } : v))

        // Call the full render pipeline
        const res = await fetch('/api/render', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            videoId: video.id,
            title: video.title,
            description: video.description,
            script: video.script || '',
            niche: ch.niche,
            duration: video.duration.replace(/[^0-9]/g, ''),
            voice: settings.voice,
            lang: settings.lang,
            platforms: video.platforms,
          }),
        })

        const data = await res.json()

        if (data.error) {
          setVideos(p => p.map(v => v.id === videoId ? {
            ...v, status: 'script' as VideoStatus, progress: 5,
            renderData: { ...v.renderData, error: data.error, renderStatus: 'failed' }
          } : v))
        } else {
          // Success — update with all render results
          setVideos(p => p.map(v => v.id === videoId ? {
            ...v,
            script: data.script || v.script,
            audioUrl: data.composition?.audioUrl || v.audioUrl,
            status: (data.status === 'rendering' ? 'editing' : 'review') as VideoStatus,
            progress: data.status === 'rendering' ? 65 : 85,
            renderData: {
              composition: data.composition,
              renderId: data.renderId,
              renderStatus: data.status,
              steps: data.steps,
            },
          } : v))
        }
      } catch (err: any) {
        setVideos(p => p.map(v => v.id === videoId ? {
          ...v, status: 'script' as VideoStatus, progress: 5,
          renderData: { ...v.renderData, error: err.message, renderStatus: 'failed' }
        } : v))
      }

      // Remove from queue and allow next
      setRenderQueue(q => q.slice(1))
      processingRef.current = false
    }

    // Small delay to batch state updates
    const timer = setTimeout(processNext, 1000)
    return () => clearTimeout(timer)
  }, [loaded, renderQueue, videos, channels, settings])

  // ═══════════════════════════════════════════════════
  // AUTO-ADVANCE: Move videos through review → scheduled → published
  // For autopilot channels, skip review
  // ═══════════════════════════════════════════════════
  useEffect(() => {
    if (!loaded || !settings.autoAdvance) return
    const iv = setInterval(() => {
      const today = nowDate()
      const nowTime = new Date().toTimeString().slice(0, 5)

      setVideos(prev => {
        let changed = false
        const next = prev.map(v => {
          const ch = channels.find(c => c.id === v.channelId)

          // Auto-advance review → scheduled for autopilot channels
          if (v.status === 'review' && ch?.autopilot) {
            changed = true
            return { ...v, status: 'scheduled' as VideoStatus, progress: 90 }
          }

          // Auto-publish scheduled videos when their time arrives
          if (v.status === 'scheduled' && ch?.autopilot) {
            if (v.scheduledDate <= today && v.scheduledTime <= nowTime) {
              changed = true
              return { ...v, status: 'published' as VideoStatus, progress: 100, publishedAt: today }
            }
          }

          return v
        })
        return changed ? next : prev
      })
    }, 8000)
    return () => clearInterval(iv)
  }, [loaded, channels, settings.autoAdvance])

  // ═══════════════════════════════════════════════════
  // AUTOPILOT: Generate new videos + auto-trigger render
  // ═══════════════════════════════════════════════════
  useEffect(() => {
    if (!loaded) return
    const iv = setInterval(() => {
      const today = nowDate()
      const newVideoIds: string[] = []

      setVideos(prev => {
        let newVids: VideoItem[] = []
        channels.forEach(ch => {
          if (!ch.autopilot || !ch.autopilotIdea) return
          const futureVids = prev.filter(v =>
            v.channelId === ch.id && v.scheduledDate >= today && v.status !== 'published'
          )
          const buffer = ch.autopilotPerDay * 3
          if (futureVids.length >= buffer) return
          const need = buffer - futureVids.length
          const idea = pickRandomIdea(ch.niche) + ' ' + ch.autopilotIdea
          const titles = generateTitles(idea, ch.niche, need)
          const lastDate = futureVids.length > 0
            ? futureVids.sort((a, b) => b.scheduledDate.localeCompare(a.scheduledDate))[0].scheduledDate
            : today
          const base = new Date(lastDate); base.setDate(base.getDate() + 1)
          const baseStr = base.toISOString().split('T')[0]
          titles.forEach((title, i) => {
            const vid: VideoItem = {
              id: genId('vid'), title, description: `${ch.autopilotIdea} — Auto`, tags: [ch.niche],
              script: '', channelId: ch.id, status: 'script' as VideoStatus, progress: 0,
              duration: fmtDur(ch.autopilotDuration), scheduledDate: scheduleDate(baseStr, i, ch.autopilotPerDay),
              scheduledTime: scheduleTime(i, ch.autopilotPerDay), platforms: ch.autopilotPlatforms, createdAt: today,
            }
            newVids.push(vid)
            newVideoIds.push(vid.id)
          })
        })
        return newVids.length > 0 ? [...prev, ...newVids] : prev
      })

      // Auto-trigger render for new autopilot videos
      if (newVideoIds.length > 0) {
        setRenderQueue(q => [...q, ...newVideoIds])
      }
    }, 30000)
    return () => clearInterval(iv)
  }, [loaded, channels])

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
    return ch
  }, [])

  const updateChannel = useCallback((id: string, d: Partial<Channel>) => {
    setChannels(p => p.map(c => c.id === id ? { ...c, ...d } : c))
  }, [])

  const deleteChannel = useCallback((id: string) => {
    setChannels(p => p.filter(c => c.id !== id))
    setVideos(p => p.filter(v => v.channelId !== id))
  }, [])

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
    return v
  }, [settings.defaultPlatforms])

  const updateVideo = useCallback((id: string, d: Partial<VideoItem>) => {
    setVideos(p => p.map(v => v.id === id ? { ...v, ...d } : v))
  }, [])

  const deleteVideo = useCallback((id: string) => {
    setVideos(p => p.filter(v => v.id !== id))
    setRenderQueue(q => q.filter(vid => vid !== id))
  }, [])

  const advanceVideo = useCallback((id: string) => {
    setVideos(p => p.map(v => {
      if (v.id !== id) return v
      const idx = STATUS_ORDER.indexOf(v.status)
      if (idx < 0 || idx >= STATUS_ORDER.length - 1) return v
      const ns = STATUS_ORDER[idx + 1]
      return { ...v, status: ns, progress: ns === 'published' ? 100 : Math.min(v.progress + 15, 95) }
    }))
  }, [])

  const publishVideo = useCallback((id: string) => {
    setVideos(p => p.map(v =>
      v.id === id ? { ...v, status: 'published' as VideoStatus, progress: 100, publishedAt: nowDate() } : v
    ))
  }, [])

  // Trigger the full render pipeline for a video
  const triggerRender = useCallback((videoId: string) => {
    setRenderQueue(q => q.includes(videoId) ? q : [...q, videoId])
  }, [])

  // ═══════════════════════════════════════════════════
  // BATCH GENERATE + AUTO-RENDER
  // ═══════════════════════════════════════════════════
  const generateVideos = useCallback((
    idea: string, channelId: string, count: number, dur: string, perDay: number, platforms: string[]
  ) => {
    const ch = channels.find(c => c.id === channelId)
    if (!ch) return []
    const titles = generateTitles(idea, ch.niche, count)
    const today = nowDate()
    const plats = platforms as any[]
    const created: VideoItem[] = []

    titles.forEach((title, i) => {
      const v: VideoItem = {
        id: genId('vid'), title, description: `${idea} — Video ${i + 1}`, tags: [ch.niche, 'video'],
        script: '', channelId, status: 'script' as VideoStatus, progress: 0,
        duration: fmtDur(dur), scheduledDate: scheduleDate(today, i, perDay),
        scheduledTime: scheduleTime(i, perDay), platforms: plats, createdAt: today,
      }
      created.push(v)
    })

    setVideos(p => [...p, ...created])

    // Auto-trigger render for all generated videos
    setRenderQueue(q => [...q, ...created.map(v => v.id)])

    return created
  }, [channels])

  // ═══════════════════════════════════════════════════
  // SETTINGS
  // ═══════════════════════════════════════════════════
  const updateSettings = useCallback((d: Partial<AppSettings>) => {
    setSettings(p => ({ ...p, ...d }))
  }, [])

  const resetAll = useCallback(() => {
    setChannels([]); setVideos([]); setSettings(DEFAULT_SETTINGS); setRenderQueue([])
    localStorage.removeItem(KEY)
  }, [])

  return <AppContext.Provider value={{
    channels, videos, settings, renderQueue,
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
