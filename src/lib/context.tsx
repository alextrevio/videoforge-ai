'use client'
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import {
  Channel, VideoItem, Campaign, LogEntry, AppSettings, AppState,
  DEFAULT_CHANNELS, DEFAULT_VIDEOS, DEFAULT_CAMPAIGNS, DEFAULT_LOGS, DEFAULT_SETTINGS,
  genId, nowTime, nowDate, NICHE_COLORS
} from './store'

interface AppContextType {
  // State
  channels: Channel[]
  videos: VideoItem[]
  campaigns: Campaign[]
  logs: LogEntry[]
  settings: AppSettings
  // Channel CRUD
  addChannel: (ch: Omit<Channel, 'id' | 'createdAt' | 'subs' | 'videos' | 'views' | 'revenue' | 'rpm' | 'growth' | 'todayUploads'>) => Channel
  updateChannel: (id: string, data: Partial<Channel>) => void
  deleteChannel: (id: string) => void
  // Video CRUD
  addVideo: (v: Partial<VideoItem> & { title: string; channel: string }) => VideoItem
  updateVideo: (id: string, data: Partial<VideoItem>) => void
  deleteVideo: (id: string) => void
  advanceVideo: (id: string) => void
  // Campaign CRUD
  addCampaign: (c: Omit<Campaign, 'id' | 'createdAt' | 'completedVideos' | 'status'>) => Campaign
  updateCampaign: (id: string, data: Partial<Campaign>) => void
  deleteCampaign: (id: string) => void
  toggleCampaignStatus: (id: string) => void
  // Generate videos from idea
  generateFromIdea: (idea: string, channelId: string, count: number, duration: string, perDay: number, options: string[]) => VideoItem[]
  // Logs
  addLog: (type: LogEntry['type'], message: string, channelId?: string, videoId?: string) => void
  clearLogs: () => void
  // Settings
  updateSettings: (data: Partial<AppSettings>) => void
  // Computed
  totalRevenue: number
  totalVideos: number
  totalSubs: number
  activeJobs: number
}

const AppContext = createContext<AppContextType | null>(null)

const STORAGE_KEY = 'videoforge_state'

function loadState(): AppState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return null
}

function saveState(state: AppState) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {}
}

// ── Video title generation from idea ────────────────────
const TITLE_TEMPLATES: Record<string, string[]> = {
  history: [
    "La Historia Oculta de {topic}", "El Ascenso y Caída de {topic}", "{topic}: Lo que Nunca te Contaron",
    "Los Secretos de {topic}", "¿Cómo Desapareció {topic}?", "{topic} — La Verdad Revelada",
    "5 Misterios de {topic}", "El Legado Perdido de {topic}", "{topic}: Hechos Impactantes",
    "La Época Dorada de {topic}"
  ],
  kids: [
    "Aprende {topic} con Canciones", "{topic} para Niños — Divertido y Fácil", "Vamos a Aprender {topic}",
    "Los Colores de {topic}", "{topic} — Episodio Especial", "Cantemos sobre {topic}",
    "Descubre {topic} Jugando", "{topic} para Bebés", "Aventura de {topic}", "El Mundo de {topic}"
  ],
  facts: [
    "10 Datos Increíbles sobre {topic}", "¿Sabías Esto de {topic}?", "{topic}: Lo que Nadie Sabe",
    "La Ciencia Detrás de {topic}", "5 Cosas Imposibles sobre {topic}", "{topic} te Va a Sorprender",
    "El Misterio Científico de {topic}", "Todo sobre {topic} en 1 Minuto", "¿Por qué {topic}?",
    "Datos Locos de {topic}"
  ],
  horror: [
    "El Terror de {topic}", "{topic}: Caso Real Sin Resolver", "La Leyenda Oscura de {topic}",
    "No Duermas Después de Ver {topic}", "{topic} — Relato Escalofriante", "El Misterio de {topic}",
    "Casos Paranormales: {topic}", "{topic} a las 3AM", "La Verdad Aterradora de {topic}",
    "Nadie Sobrevivió a {topic}"
  ],
  motivation: [
    "Cómo {topic} Cambió Mi Vida", "{topic}: El Secreto del Éxito", "Mentalidad de {topic}",
    "Nunca Renuncies a {topic}", "El Poder de {topic}", "{topic} — Motivación Extrema",
    "Transforma tu Vida con {topic}", "Los Millonarios Hacen {topic}", "Disciplina: {topic}",
    "De Cero a {topic}"
  ],
  tech: [
    "IA y {topic}: El Futuro es Ahora", "{topic} que Cambiará Todo en 2026", "La Tecnología Detrás de {topic}",
    "Robots que Hacen {topic}", "{topic}: Revolución Digital", "El Futuro de {topic}",
    "5 Innovaciones de {topic}", "{topic} ya Existe y No lo Sabías", "Cómo {topic} Reemplazará Empleos",
    "{topic} — Tecnología Imposible"
  ],
}

function generateTitles(idea: string, niche: string, count: number): string[] {
  const templates = TITLE_TEMPLATES[niche] || TITLE_TEMPLATES.facts
  const words = idea.split(' ').filter(w => w.length > 3)
  const topics = words.length > 0 ? words : ['el Mundo', 'la Vida', 'el Universo']
  const titles: string[] = []

  for (let i = 0; i < count; i++) {
    const tmpl = templates[i % templates.length]
    const topic = topics[i % topics.length]
    const capitalized = topic.charAt(0).toUpperCase() + topic.slice(1)
    titles.push(tmpl.replace('{topic}', capitalized) + (i >= templates.length ? ` — Parte ${Math.floor(i / templates.length) + 1}` : ''))
  }
  return titles
}

const SCHEDULE_TIMES = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00']
const SCHEDULE_DAYS = ['Hoy', 'Mañana', 'Pasado', 'En 3 días', 'En 4 días', 'En 5 días', 'En 6 días', 'En 7 días']

function generateSchedule(index: number, perDay: number): string {
  const dayIndex = Math.floor(index / perDay)
  const timeIndex = index % perDay
  const day = SCHEDULE_DAYS[Math.min(dayIndex, SCHEDULE_DAYS.length - 1)]
  const time = SCHEDULE_TIMES[timeIndex % SCHEDULE_TIMES.length]
  return `${day} ${time}`
}

// ── Status advancement order ────────────────────────────
const STATUS_ORDER: VideoItem['status'][] = [
  'script', 'generating', 'voiceover', 'compositing', 'rendering', 'thumbnail', 'uploading', 'complete'
]

// ═══════════════════════════════════════════════════════════
// PROVIDER
// ═══════════════════════════════════════════════════════════
export function AppProvider({ children }: { children: ReactNode }) {
  const [channels, setChannels] = useState<Channel[]>(DEFAULT_CHANNELS)
  const [videos, setVideos] = useState<VideoItem[]>(DEFAULT_VIDEOS)
  const [campaigns, setCampaigns] = useState<Campaign[]>(DEFAULT_CAMPAIGNS)
  const [logs, setLogs] = useState<LogEntry[]>(DEFAULT_LOGS)
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [loaded, setLoaded] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    const saved = loadState()
    if (saved) {
      if (saved.channels?.length) setChannels(saved.channels)
      if (saved.videos?.length) setVideos(saved.videos)
      if (saved.campaigns?.length) setCampaigns(saved.campaigns)
      if (saved.logs?.length) setLogs(saved.logs)
      if (saved.settings) setSettings(saved.settings)
    }
    setLoaded(true)
  }, [])

  // Auto-advance pipeline simulation (videos progress through stages)
  useEffect(() => {
    if (!loaded) return
    const iv = setInterval(() => {
      setVideos(prev => {
        let changed = false
        const next = prev.map(v => {
          if (v.status === 'complete' || v.status === 'error') return v
          // Random chance to advance (simulates processing)
          if (Math.random() > 0.92) {
            const order: VideoItem['status'][] = ['script','generating','voiceover','compositing','rendering','thumbnail','uploading','complete']
            const idx = order.indexOf(v.status)
            if (idx >= 0 && idx < order.length - 1) {
              changed = true
              const next = order[idx + 1]
              return { ...v, status: next, progress: next === 'complete' ? 100 : Math.min(v.progress + 20, 95) }
            }
          }
          return v
        })
        return changed ? next : prev
      })
    }, 8000)
    return () => clearInterval(iv)
  }, [loaded])

  // Save to localStorage on any change
  useEffect(() => {
    if (!loaded) return
    saveState({ channels, videos, campaigns, logs, settings })
  }, [channels, videos, campaigns, logs, settings, loaded])

  // ── Logs ──────────────────────────────────────────────
  const addLog = useCallback((type: LogEntry['type'], message: string, channelId?: string, videoId?: string) => {
    const entry: LogEntry = { id: genId('log'), time: nowTime(), type, message, channelId, videoId }
    setLogs(prev => [entry, ...prev].slice(0, 100))
  }, [])

  const clearLogs = useCallback(() => setLogs([]), [])

  // ── Channels ──────────────────────────────────────────
  const addChannel = useCallback((data: Omit<Channel, 'id' | 'createdAt' | 'subs' | 'videos' | 'views' | 'revenue' | 'rpm' | 'growth' | 'todayUploads'>) => {
    const ch: Channel = {
      ...data, id: genId('ch'), subs: 0, videos: 0, views: "0",
      revenue: 0, rpm: 0, growth: "Nuevo", todayUploads: 0, createdAt: nowDate()
    }
    setChannels(prev => [...prev, ch])
    addLog('success', `Canal "${ch.name}" creado exitosamente`)
    return ch
  }, [addLog])

  const updateChannel = useCallback((id: string, data: Partial<Channel>) => {
    setChannels(prev => prev.map(c => c.id === id ? { ...c, ...data } : c))
  }, [])

  const deleteChannel = useCallback((id: string) => {
    const ch = channels.find(c => c.id === id)
    setChannels(prev => prev.filter(c => c.id !== id))
    setVideos(prev => prev.filter(v => v.channel !== id))
    setCampaigns(prev => prev.filter(c => c.channel !== id))
    if (ch) addLog('info', `Canal "${ch.name}" eliminado`)
  }, [channels, addLog])

  // ── Videos ────────────────────────────────────────────
  const addVideo = useCallback((data: Partial<VideoItem> & { title: string; channel: string }) => {
    const vid: VideoItem = {
      id: genId('vid'),
      title: data.title,
      description: data.description || '',
      tags: data.tags || [],
      channel: data.channel,
      campaignId: data.campaignId,
      status: data.status || 'script',
      progress: data.progress || 0,
      duration: data.duration || '0:45',
      scheduledAt: data.scheduledAt || 'Sin programar',
      views: 0,
      estimatedViews: data.estimatedViews || '10K',
      createdAt: nowDate(),
    }
    setVideos(prev => [...prev, vid])
    return vid
  }, [])

  const updateVideo = useCallback((id: string, data: Partial<VideoItem>) => {
    setVideos(prev => prev.map(v => v.id === id ? { ...v, ...data } : v))
  }, [])

  const deleteVideo = useCallback((id: string) => {
    setVideos(prev => prev.filter(v => v.id !== id))
    addLog('info', `Video eliminado del pipeline`)
  }, [addLog])

  const advanceVideo = useCallback((id: string) => {
    setVideos(prev => prev.map(v => {
      if (v.id !== id) return v
      const currentIdx = STATUS_ORDER.indexOf(v.status)
      if (currentIdx === -1 || currentIdx >= STATUS_ORDER.length - 1) return v
      const nextStatus = STATUS_ORDER[currentIdx + 1]
      const nextProgress = nextStatus === 'complete' ? 100 : Math.min(v.progress + 15, 95)
      return { ...v, status: nextStatus, progress: nextProgress }
    }))
    const vid = videos.find(v => v.id === id)
    if (vid) {
      const nextIdx = STATUS_ORDER.indexOf(vid.status) + 1
      if (nextIdx < STATUS_ORDER.length) {
        addLog('success', `"${vid.title}" avanzó a: ${STATUS_ORDER[nextIdx]}`)
      }
    }
  }, [videos, addLog])

  // ── Campaigns ─────────────────────────────────────────
  const addCampaign = useCallback((data: Omit<Campaign, 'id' | 'createdAt' | 'completedVideos' | 'status'>) => {
    const camp: Campaign = {
      ...data, id: genId('camp'), completedVideos: 0, status: 'active', createdAt: nowDate()
    }
    setCampaigns(prev => [...prev, camp])
    addLog('success', `Campaña "${camp.name}" creada con ${camp.totalVideos} videos`)
    return camp
  }, [addLog])

  const updateCampaign = useCallback((id: string, data: Partial<Campaign>) => {
    setCampaigns(prev => prev.map(c => c.id === id ? { ...c, ...data } : c))
  }, [])

  const deleteCampaign = useCallback((id: string) => {
    const camp = campaigns.find(c => c.id === id)
    setCampaigns(prev => prev.filter(c => c.id !== id))
    if (camp) addLog('info', `Campaña "${camp.name}" eliminada`)
  }, [campaigns, addLog])

  const toggleCampaignStatus = useCallback((id: string) => {
    setCampaigns(prev => prev.map(c => {
      if (c.id !== id) return c
      const newStatus = c.status === 'active' ? 'paused' : 'active'
      return { ...c, status: newStatus }
    }))
    const camp = campaigns.find(c => c.id === id)
    if (camp) {
      const action = camp.status === 'active' ? 'pausada' : 'reanudada'
      addLog('info', `Campaña "${camp.name}" ${action}`)
    }
  }, [campaigns, addLog])

  // ── Generate from Idea ────────────────────────────────
  const generateFromIdea = useCallback((
    idea: string, channelId: string, count: number, duration: string, perDay: number, options: string[]
  ): VideoItem[] => {
    const ch = channels.find(c => c.id === channelId)
    if (!ch) return []

    // Create campaign
    const camp = addCampaign({
      name: idea.slice(0, 50) + (idea.length > 50 ? '...' : ''),
      channel: channelId,
      niche: ch.niche,
      idea,
      totalVideos: count,
      videoDuration: duration,
      videosPerDay: perDay,
      options,
    })

    // Generate video titles
    const titles = generateTitles(idea, ch.niche, count)
    const durStr = `0:${duration.padStart(2, '0')}`

    const newVideos = titles.map((title, i) => {
      const vid = addVideo({
        title,
        channel: channelId,
        campaignId: camp.id,
        status: 'script',
        progress: Math.floor(Math.random() * 10),
        duration: durStr,
        scheduledAt: generateSchedule(i, perDay),
        estimatedViews: `${Math.floor(Math.random() * 50 + 5)}K`,
      })
      return vid
    })

    addLog('success', `Generación masiva iniciada: ${count} videos para "${ch.name}"`, channelId)
    addLog('info', `Claude generando guiones para "${idea.slice(0, 40)}..."`)

    // Simulate pipeline advancement for first few videos
    setTimeout(() => {
      setVideos(prev => prev.map(v => {
        if (v.campaignId === camp.id && v.status === 'script') {
          const rand = Math.random()
          if (rand > 0.7) return { ...v, status: 'generating' as const, progress: Math.floor(Math.random() * 40 + 20) }
          if (rand > 0.4) return { ...v, progress: Math.floor(Math.random() * 15 + 5) }
        }
        return v
      }))
    }, 1500)

    return newVideos
  }, [channels, addCampaign, addVideo, addLog])

  // ── Settings ──────────────────────────────────────────
  const updateSettings = useCallback((data: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...data }))
  }, [])

  // ── Computed ──────────────────────────────────────────
  const totalRevenue = channels.reduce((s, c) => s + c.revenue, 0)
  const totalVideos = channels.reduce((s, c) => s + c.videos, 0) + videos.length
  const totalSubs = channels.reduce((s, c) => s + c.subs, 0)
  const activeJobs = videos.filter(v => v.status !== 'complete' && v.status !== 'error').length

  const value: AppContextType = {
    channels, videos, campaigns, logs, settings,
    addChannel, updateChannel, deleteChannel,
    addVideo, updateVideo, deleteVideo, advanceVideo,
    addCampaign, updateCampaign, deleteCampaign, toggleCampaignStatus,
    generateFromIdea, addLog, clearLogs, updateSettings,
    totalRevenue, totalVideos, totalSubs, activeJobs,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
