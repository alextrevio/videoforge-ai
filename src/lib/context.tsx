'use client'
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import {
  Channel, VideoItem, AppSettings, AppState, VideoStatus,
  DEFAULT_SETTINGS, NICHES, PIPELINE_STEPS, genId, nowDate, fmtDur
} from './store'

// ── Title Generation ────────────────────────────────────
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

// ── Schedule Helpers ────────────────────────────────────
const TIMES = ['08:00','10:00','12:00','14:00','16:00','18:00','20:00']
function scheduleDate(baseDate: string, index: number, perDay: number) {
  const d = new Date(baseDate)
  d.setDate(d.getDate() + Math.floor(index / perDay))
  return d.toISOString().split('T')[0]
}
function scheduleTime(index: number, perDay: number) {
  return TIMES[index % perDay] || TIMES[0]
}

// ── Status Order ────────────────────────────────────────
const STATUS_ORDER: VideoStatus[] = ['script','voiceover','visuals','editing','thumbnail','review','scheduled','published']

// ── Idea Generation for Autopilot ───────────────────────
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

// ── Context Type ────────────────────────────────────────
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
  generateVideos: (idea: string, channelId: string, count: number, dur: string, perDay: number, platforms: string[]) => VideoItem[]
  updateSettings: (d: Partial<AppSettings>) => void
  resetAll: () => void
}

const AppContext = createContext<Ctx | null>(null)
const KEY = 'videoforge_v2'

function load(): AppState | null {
  if (typeof window === 'undefined') return null
  try { const r = localStorage.getItem(KEY); return r ? JSON.parse(r) : null } catch { return null }
}
function save(s: AppState) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(KEY, JSON.stringify(s)) } catch {}
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [channels, setChannels] = useState<Channel[]>([])
  const [videos, setVideos] = useState<VideoItem[]>([])
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [loaded, setLoaded] = useState(false)

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

  // Auto-advance pipeline
  useEffect(() => {
    if (!loaded || !settings.autoAdvance) return
    const iv = setInterval(() => {
      setVideos(prev => {
        let changed = false
        const next = prev.map(v => {
          if (v.status === 'published') return v
          // Check if channel has autopilot
          const ch = channels.find(c => c.id === v.channelId)
          const isAutopilot = ch?.autopilot
          // Autopilot: skip review, go all the way to scheduled
          if (isAutopilot) {
            if (v.status === 'scheduled') return v // wait for publish time
            if (Math.random() > 0.65) {
              const idx = STATUS_ORDER.indexOf(v.status)
              if (idx >= 0 && idx < STATUS_ORDER.length - 1) {
                changed = true
                let ns = STATUS_ORDER[idx + 1]
                if (ns === 'review') ns = 'scheduled' // skip review for autopilot
                return { ...v, status: ns, progress: ns === 'scheduled' ? 90 : Math.min(v.progress + 15, 95) }
              }
            }
          } else {
            // Manual: stop at review
            if (v.status === 'review' || v.status === 'scheduled') return v
            if (Math.random() > 0.7) {
              const idx = STATUS_ORDER.indexOf(v.status)
              if (idx >= 0 && idx < 5) {
                changed = true
                const ns = STATUS_ORDER[idx + 1]
                return { ...v, status: ns, progress: Math.min(v.progress + 15, ns === 'review' ? 85 : 95) }
              }
            }
          }
          return v
        })
        return changed ? next : prev
      })
    }, 5000)
    return () => clearInterval(iv)
  }, [loaded, settings.autoAdvance, channels])

  // Autopilot: auto-publish scheduled videos when their date/time arrives
  useEffect(() => {
    if (!loaded) return
    const iv = setInterval(() => {
      const now = new Date()
      const today = now.toISOString().split('T')[0]
      const nowTime = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`
      setVideos(prev => {
        let changed = false
        const next = prev.map(v => {
          if (v.status !== 'scheduled') return v
          const ch = channels.find(c => c.id === v.channelId)
          if (!ch?.autopilot) return v
          // Publish if date <= today and time <= now
          if (v.scheduledDate <= today && v.scheduledTime <= nowTime) {
            changed = true
            return { ...v, status: 'published' as VideoStatus, progress: 100, publishedAt: today }
          }
          return v
        })
        return changed ? next : prev
      })
    }, 10000)
    return () => clearInterval(iv)
  }, [loaded, channels])

  // Autopilot: generate new videos daily for autopilot channels
  useEffect(() => {
    if (!loaded) return
    const iv = setInterval(() => {
      const today = nowDate()
      channels.forEach(ch => {
        if (!ch.autopilot || !ch.autopilotIdea) return
        // Count how many videos are scheduled for today or later
        const futureVids = videos.filter(v =>
          v.channelId === ch.id && v.scheduledDate >= today && v.status !== 'published'
        )
        // If less than perDay * 3 days buffer, generate more
        const buffer = ch.autopilotPerDay * 3
        if (futureVids.length < buffer) {
          const need = buffer - futureVids.length
          const idea = pickRandomIdea(ch.niche) + ' ' + ch.autopilotIdea
          const titles = generateTitles(idea, ch.niche, need)
          // Find the last scheduled date to continue from there
          const lastDate = futureVids.length > 0
            ? futureVids.sort((a,b) => b.scheduledDate.localeCompare(a.scheduledDate))[0].scheduledDate
            : today
          const base = new Date(lastDate)
          base.setDate(base.getDate() + 1)
          const baseStr = base.toISOString().split('T')[0]

          titles.forEach((title, i) => {
            const v: VideoItem = {
              id: genId('vid'), title, description: `${ch.autopilotIdea} — Auto`, tags: [ch.niche],
              script: '', channelId: ch.id, status: 'script' as VideoStatus, progress: 0,
              duration: fmtDur(ch.autopilotDuration), scheduledDate: scheduleDate(baseStr, i, ch.autopilotPerDay),
              scheduledTime: scheduleTime(i, ch.autopilotPerDay), platforms: ch.autopilotPlatforms, createdAt: today,
            }
            setVideos(p => [...p, v])
          })
        }
      })
    }, 20000) // Check every 20s
    return () => clearInterval(iv)
  }, [loaded, channels, videos])

  // ── Channel ───────────────────────────────────────────
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

  // ── Video ─────────────────────────────────────────────
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

  // ── Generate ──────────────────────────────────────────
  const generateVideos = useCallback((
    idea: string, channelId: string, count: number, dur: string, perDay: number, platforms: string[]
  ) => {
    const ch = channels.find(c => c.id === channelId)
    if (!ch) return []
    const titles = generateTitles(idea, ch.niche, count)
    const today = nowDate()
    const plats = platforms as any[]
    return titles.map((title, i) => {
      const v: VideoItem = {
        id: genId('vid'), title, description: `${idea} — Video ${i + 1}`, tags: [ch.niche, 'video'],
        script: '', channelId, status: 'script', progress: Math.floor(Math.random() * 8),
        duration: fmtDur(dur), scheduledDate: scheduleDate(today, i, perDay),
        scheduledTime: scheduleTime(i, perDay), platforms: plats, createdAt: today,
      }
      setVideos(p => [...p, v])
      return v
    })
  }, [channels])

  // ── Settings ──────────────────────────────────────────
  const updateSettings = useCallback((d: Partial<AppSettings>) => {
    setSettings(p => ({ ...p, ...d }))
  }, [])

  const resetAll = useCallback(() => {
    setChannels([]); setVideos([]); setSettings(DEFAULT_SETTINGS)
    localStorage.removeItem(KEY)
  }, [])

  return <AppContext.Provider value={{
    channels, videos, settings,
    addChannel, updateChannel, deleteChannel,
    addVideo, updateVideo, deleteVideo, advanceVideo, publishVideo,
    generateVideos, updateSettings, resetAll,
  }}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
