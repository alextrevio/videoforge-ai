// ═══════════════════════════════════════════════════════════
// VideoForge AI — Types & Constants
// ═══════════════════════════════════════════════════════════

export type Platform = 'youtube' | 'tiktok' | 'instagram' | 'facebook'
export type VideoStatus = 'script' | 'voiceover' | 'visuals' | 'editing' | 'thumbnail' | 'review' | 'scheduled' | 'published'

export interface Channel {
  id: string; name: string; platform: Platform; niche: string
  icon: string; color: string; status: 'active' | 'paused'; createdAt: string
  // Autopilot
  autopilot: boolean; autopilotIdea: string; autopilotPerDay: number
  autopilotDuration: string; autopilotPlatforms: Platform[]
}

export interface VideoItem {
  id: string; title: string; description: string; tags: string[]; script: string
  channelId: string; status: VideoStatus; progress: number; duration: string
  scheduledDate: string; scheduledTime: string; platforms: Platform[]
  publishedAt?: string; createdAt: string
  // Render pipeline data
  audioUrl?: string; videoUrl?: string; thumbnailUrl?: string
  renderData?: {
    composition?: any; renderId?: string; renderStatus?: string
    steps?: Record<string, any>; error?: string
  }
}

export interface AppSettings {
  autoAdvance: boolean; defaultDuration: string; defaultPlatforms: Platform[]
  lang: string; voice: string
  openaiKey: string; elevenLabsKey: string; youtubeKey: string
}

export interface AppState { channels: Channel[]; videos: VideoItem[]; settings: AppSettings }

// ── Platforms ────────────────────────────────────────────
export const PLATFORMS: Record<Platform, { label: string; icon: string; color: string }> = {
  youtube:   { label: 'YouTube',   icon: '📺', color: '#FF0000' },
  tiktok:    { label: 'TikTok',    icon: '🎵', color: '#00F2EA' },
  instagram: { label: 'Instagram', icon: '📸', color: '#E1306C' },
  facebook:  { label: 'Facebook',  icon: '📘', color: '#1877F2' },
}

// ── Niches ──────────────────────────────────────────────
export const NICHES = [
  { id:'history',label:'Historia',icon:'📜',color:'#E8A838' },
  { id:'kids',label:'Infantil',icon:'🧸',color:'#4ECDC4' },
  { id:'facts',label:'Curiosidades',icon:'🧠',color:'#A855F7' },
  { id:'horror',label:'Terror',icon:'🌙',color:'#6366F1' },
  { id:'motivation',label:'Motivación',icon:'🔥',color:'#EF4444' },
  { id:'tech',label:'Tecnología',icon:'💻',color:'#06B6D4' },
  { id:'lifestyle',label:'Lifestyle',icon:'✨',color:'#EC4899' },
  { id:'finance',label:'Finanzas',icon:'💰',color:'#22C55E' },
  { id:'gaming',label:'Gaming',icon:'🎮',color:'#8B5CF6' },
  { id:'other',label:'Otro',icon:'📦',color:'#64748B' },
]

// ── Pipeline Steps ──────────────────────────────────────
export const PIPELINE_STEPS: { key: VideoStatus; label: string; icon: string; color: string; desc: string }[] = [
  { key:'script',   label:'Guión',     icon:'📝',color:'#F97316',desc:'IA genera el guión' },
  { key:'voiceover',label:'Narración', icon:'🎙️',color:'#EC4899',desc:'IA genera la voz' },
  { key:'visuals',  label:'Visuales',  icon:'🎬',color:'#8B5CF6',desc:'Animación / imágenes' },
  { key:'editing',  label:'Edición',   icon:'✂️', color:'#3B82F6',desc:'Composición final' },
  { key:'thumbnail',label:'Thumbnail', icon:'🖼️',color:'#06B6D4',desc:'Portada automática' },
  { key:'review',   label:'Revisión',  icon:'👁️', color:'#EAB308',desc:'Listo para aprobar' },
  { key:'scheduled',label:'Programado',icon:'📅',color:'#22C55E',desc:'Esperando fecha' },
  { key:'published',label:'Publicado', icon:'✅',color:'#4ADE80',desc:'En línea' },
]

export const STATUS_MAP: Record<VideoStatus, { bg:string; color:string; label:string; order:number }> = {
  script:   {bg:'rgba(249,115,22,0.12)',color:'#FB923C',label:'📝 Guión',order:0},
  voiceover:{bg:'rgba(236,72,153,0.12)',color:'#F472B6',label:'🎙️ Narración',order:1},
  visuals:  {bg:'rgba(139,92,246,0.12)',color:'#A78BFA',label:'🎬 Visuales',order:2},
  editing:  {bg:'rgba(59,130,246,0.12)',color:'#60A5FA',label:'✂️ Edición',order:3},
  thumbnail:{bg:'rgba(6,182,212,0.12)', color:'#22D3EE',label:'🖼️ Thumb',order:4},
  review:   {bg:'rgba(234,179,8,0.12)', color:'#FACC15',label:'👁️ Revisión',order:5},
  scheduled:{bg:'rgba(34,197,94,0.12)', color:'#4ADE80',label:'📅 Programado',order:6},
  published:{bg:'rgba(34,197,94,0.15)', color:'#4ADE80',label:'✅ Publicado',order:7},
}

// ── Defaults ────────────────────────────────────────────
export const DEFAULT_SETTINGS: AppSettings = {
  autoAdvance:true, defaultDuration:'60', defaultPlatforms:['youtube'],
  lang:'es-MX', voice:'mateo', openaiKey:'', elevenLabsKey:'', youtubeKey:'',
}

// ── Helpers ─────────────────────────────────────────────
export const genId = (p: string) => `${p}_${Date.now()}_${Math.random().toString(36).slice(2,7)}`
export const nowDate = () => new Date().toISOString().split('T')[0]
export const fmtDur = (s: string|number) => { const n=typeof s==='string'?parseInt(s):s; return n>=60?`${Math.floor(n/60)}:${(n%60).toString().padStart(2,'0')}`:`0:${n.toString().padStart(2,'0')}` }
