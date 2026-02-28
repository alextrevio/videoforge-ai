// ═══════════════════════════════════════════════════════════
// VideoForge AI — Data Types & Store
// Replace with Supabase/Postgres when ready for production
// ═══════════════════════════════════════════════════════════

export interface Channel {
  id: string
  name: string
  niche: string
  icon: string
  subs: number
  videos: number
  views: string
  revenue: number
  rpm: number
  status: 'active' | 'growing' | 'paused'
  color: string
  growth: string
  todayUploads: number
  youtubeChannelId?: string // For YouTube API integration
  createdAt: string
}

export interface VideoItem {
  id: string
  title: string
  description: string
  tags: string[]
  channel: string
  campaignId?: string
  status: 'script' | 'generating' | 'voiceover' | 'compositing' | 'rendering' | 'thumbnail' | 'uploading' | 'complete' | 'error'
  progress: number
  duration: string
  scheduledAt: string
  publishedAt?: string
  views: number
  estimatedViews: string
  script?: string
  voiceoverUrl?: string
  videoUrl?: string
  thumbnailUrl?: string
  youtubeVideoId?: string
  createdAt: string
  error?: string
}

export interface Campaign {
  id: string
  name: string
  channel: string
  niche: string
  idea: string
  totalVideos: number
  completedVideos: number
  videoDuration: string
  videosPerDay: number
  status: 'active' | 'paused' | 'completed'
  options: string[]
  createdAt: string
}

export interface LogEntry {
  id: string
  time: string
  type: 'success' | 'info' | 'warning' | 'error'
  message: string
  channelId?: string
  videoId?: string
}

export interface AppSettings {
  autoUpload: boolean
  autoSchedule: boolean
  autoThumb: boolean
  seoOpt: boolean
  nanoBanana: boolean
  elevenLabs: boolean
  abTest: boolean
  trendAnalysis: boolean
  notifications: boolean
  emailReports: boolean
  slackAlerts: boolean
  resolution: '720' | '1080' | '4k'
  format: 'shorts' | 'landscape' | 'square'
  lang: string
  voice: string
  // API Keys (stored server-side in env vars for production)
  anthropicKey?: string
  elevenLabsKey?: string
  youtubeKey?: string
  nanoBananaKey?: string
}

export interface AppState {
  channels: Channel[]
  videos: VideoItem[]
  campaigns: Campaign[]
  logs: LogEntry[]
  settings: AppSettings
}

// ── Default Data ─────────────────────────────────────────
export const DEFAULT_CHANNELS: Channel[] = [
  { id:"ch1",name:"Historia Épica",niche:"history",icon:"📜",subs:12400,videos:89,views:"1.2M",revenue:2340,rpm:4.2,status:"active",color:"#E8A838",growth:"+12%",todayUploads:3,createdAt:"2025-11-01" },
  { id:"ch2",name:"MundoKids TV",niche:"kids",icon:"🧸",subs:45200,videos:234,views:"8.5M",revenue:12800,rpm:6.8,status:"active",color:"#4ECDC4",growth:"+28%",todayUploads:4,createdAt:"2025-09-15" },
  { id:"ch3",name:"CuriosoMente",niche:"facts",icon:"🧠",subs:8900,videos:56,views:"890K",revenue:980,rpm:3.1,status:"active",color:"#A855F7",growth:"+8%",todayUploads:2,createdAt:"2025-12-10" },
  { id:"ch4",name:"Relatos Nocturnos",niche:"horror",icon:"🌙",subs:3200,videos:23,views:"340K",revenue:420,rpm:2.9,status:"growing",color:"#6366F1",growth:"+45%",todayUploads:2,createdAt:"2026-01-05" },
  { id:"ch5",name:"MotivaciónMax",niche:"motivation",icon:"🔥",subs:18700,videos:145,views:"3.2M",revenue:5600,rpm:5.1,status:"active",color:"#EF4444",growth:"+19%",todayUploads:3,createdAt:"2025-10-20" },
  { id:"ch6",name:"FuturoTech",niche:"tech",icon:"💻",subs:6100,videos:34,views:"520K",revenue:780,rpm:3.5,status:"growing",color:"#06B6D4",growth:"+31%",todayUploads:1,createdAt:"2026-01-15" },
]

export const DEFAULT_VIDEOS: VideoItem[] = [
  { id:"v1",title:"La Caída del Imperio Romano — Parte 3",description:"",tags:["historia","roma","imperio"],channel:"ch1",status:"rendering",progress:78,duration:"1:00",scheduledAt:"Hoy 18:00",views:0,estimatedViews:"12K",createdAt:"2026-02-28" },
  { id:"v2",title:"Colores y Formas para Bebés — Vol.8",description:"",tags:["niños","educativo","colores"],channel:"ch2",status:"uploading",progress:92,duration:"1:00",scheduledAt:"Hoy 19:00",views:0,estimatedViews:"45K",createdAt:"2026-02-28" },
  { id:"v3",title:"10 Datos del Océano que No Sabías",description:"",tags:["ciencia","oceano","datos"],channel:"ch3",status:"generating",progress:34,duration:"1:00",scheduledAt:"Mañana 10:00",views:0,estimatedViews:"8K",createdAt:"2026-02-28" },
  { id:"v4",title:"El Misterio de la Isla Perdida",description:"",tags:["misterio","terror","leyenda"],channel:"ch4",status:"script",progress:12,duration:"1:00",scheduledAt:"Mañana 14:00",views:0,estimatedViews:"5K",createdAt:"2026-02-28" },
  { id:"v5",title:"La Revolución Francesa Explicada",description:"",tags:["historia","francia","revolución"],channel:"ch1",status:"complete",progress:100,duration:"1:00",scheduledAt:"Publicado",views:34200,estimatedViews:"30K",createdAt:"2026-02-27",publishedAt:"2026-02-27" },
  { id:"v6",title:"Aprende los Números Cantando",description:"",tags:["niños","números","canción"],channel:"ch2",status:"voiceover",progress:56,duration:"1:00",scheduledAt:"Mañana 08:00",views:0,estimatedViews:"52K",createdAt:"2026-02-28" },
  { id:"v7",title:"¿Por qué el Cielo es Azul?",description:"",tags:["ciencia","cielo","curiosidad"],channel:"ch3",status:"compositing",progress:67,duration:"1:00",scheduledAt:"Mañana 12:00",views:0,estimatedViews:"11K",createdAt:"2026-02-28" },
  { id:"v8",title:"Animales de la Selva para Niños",description:"",tags:["niños","animales","selva"],channel:"ch2",status:"thumbnail",progress:88,duration:"1:00",scheduledAt:"Hoy 21:00",views:0,estimatedViews:"38K",createdAt:"2026-02-28" },
  { id:"v9",title:"Nunca Renuncies a tus Sueños",description:"",tags:["motivación","éxito","superación"],channel:"ch5",status:"complete",progress:100,duration:"1:00",scheduledAt:"Publicado",views:67800,estimatedViews:"50K",createdAt:"2026-02-27",publishedAt:"2026-02-27" },
  { id:"v10",title:"IA que Cambiará Todo en 2026",description:"",tags:["tecnología","IA","futuro"],channel:"ch6",status:"rendering",progress:71,duration:"1:00",scheduledAt:"Hoy 22:00",views:0,estimatedViews:"15K",createdAt:"2026-02-28" },
  { id:"v11",title:"5 Imperios que Desaparecieron",description:"",tags:["historia","imperios","misterio"],channel:"ch1",status:"generating",progress:45,duration:"1:00",scheduledAt:"Mañana 16:00",views:0,estimatedViews:"18K",createdAt:"2026-02-28" },
  { id:"v12",title:"Canciones Infantiles — Arcoíris",description:"",tags:["niños","canciones","arcoíris"],channel:"ch2",status:"script",progress:5,duration:"1:00",scheduledAt:"Pasado 08:00",views:0,estimatedViews:"60K",createdAt:"2026-02-28" },
  { id:"v13",title:"El Hombre Polilla: Caso Real",description:"",tags:["terror","criptozoología","misterio"],channel:"ch4",status:"voiceover",progress:48,duration:"1:00",scheduledAt:"Mañana 20:00",views:0,estimatedViews:"9K",createdAt:"2026-02-28" },
  { id:"v14",title:"Mentalidad de Tiburón",description:"",tags:["motivación","negocios","mentalidad"],channel:"ch5",status:"compositing",progress:72,duration:"1:00",scheduledAt:"Hoy 23:00",views:0,estimatedViews:"22K",createdAt:"2026-02-28" },
  { id:"v15",title:"Robots que ya Existen en 2026",description:"",tags:["tecnología","robots","futuro"],channel:"ch6",status:"script",progress:8,duration:"1:00",scheduledAt:"Mañana 18:00",views:0,estimatedViews:"20K",createdAt:"2026-02-28" },
]

export const DEFAULT_CAMPAIGNS: Campaign[] = [
  { id:"c1",name:"Serie Civilizaciones Antiguas",channel:"ch1",niche:"history",idea:"Videos sobre civilizaciones antiguas misteriosas",totalVideos:50,completedVideos:34,videoDuration:"45",videosPerDay:3,status:"active",options:["animation","narration","seo"],createdAt:"2026-02-01" },
  { id:"c2",name:"Colores y Formas Vol.1-10",channel:"ch2",niche:"kids",idea:"Serie educativa de colores y formas para bebés",totalVideos:100,completedVideos:89,videoDuration:"60",videosPerDay:4,status:"active",options:["animation","narration","subtitles","music"],createdAt:"2026-01-15" },
  { id:"c3",name:"Datos Increíbles del Mundo",channel:"ch3",niche:"facts",idea:"Curiosidades y datos sorprendentes",totalVideos:30,completedVideos:12,videoDuration:"30",videosPerDay:2,status:"active",options:["animation","narration","seo"],createdAt:"2026-02-10" },
  { id:"c4",name:"Leyendas Urbanas Latam",channel:"ch4",niche:"horror",idea:"Leyendas urbanas de Latinoamérica",totalVideos:20,completedVideos:8,videoDuration:"55",videosPerDay:2,status:"active",options:["animation","narration","music","seo"],createdAt:"2026-02-20" },
  { id:"c5",name:"Motivación Diaria",channel:"ch5",niche:"motivation",idea:"Videos motivacionales diarios",totalVideos:60,completedVideos:45,videoDuration:"45",videosPerDay:3,status:"active",options:["animation","narration","subtitles"],createdAt:"2026-01-20" },
  { id:"c6",name:"Futuro Tecnológico",channel:"ch6",niche:"tech",idea:"Tecnologías que cambiarán el mundo",totalVideos:25,completedVideos:5,videoDuration:"55",videosPerDay:1,status:"paused",options:["animation","narration","seo","trending"],createdAt:"2026-02-25" },
]

export const DEFAULT_LOGS: LogEntry[] = [
  { id:"l1",time:"15:42",type:"success",message:"Video 'Revolución Francesa' subido a Historia Épica" },
  { id:"l2",time:"15:38",type:"info",message:"Generando thumbnail A/B para 'Colores y Formas Vol.8'" },
  { id:"l3",time:"15:35",type:"success",message:"Narración completada — 'Datos del Océano'" },
  { id:"l4",time:"15:30",type:"warning",message:"Cola de renderizado al 85% — escalando workers" },
  { id:"l5",time:"15:28",type:"info",message:"Generación masiva: 'Leyendas Urbanas' — 12 videos" },
  { id:"l6",time:"15:22",type:"success",message:"'Nunca Renuncies' alcanzó 50K vistas en 4h" },
  { id:"l7",time:"15:18",type:"error",message:"Error NanoBanana — reintentando (2/3)" },
  { id:"l8",time:"15:15",type:"info",message:"Claude generó 8 guiones — 'Motivación Diaria'" },
  { id:"l9",time:"15:10",type:"success",message:"15 videos programados en MundoKids TV" },
  { id:"l10",time:"15:05",type:"info",message:"SEO optimizado — 12 títulos actualizados" },
]

export const DEFAULT_SETTINGS: AppSettings = {
  autoUpload: true,
  autoSchedule: true,
  autoThumb: true,
  seoOpt: true,
  nanoBanana: true,
  elevenLabs: true,
  abTest: true,
  trendAnalysis: true,
  notifications: true,
  emailReports: false,
  slackAlerts: true,
  resolution: '1080',
  format: 'shorts',
  lang: 'es-MX',
  voice: 'mateo',
}

export const NICHES = [
  { id:"history",label:"Historia",icon:"📜",desc:"Civilizaciones, guerras",color:"#E8A838" },
  { id:"kids",label:"Infantil",icon:"🧸",desc:"Educativo, canciones",color:"#4ECDC4" },
  { id:"facts",label:"Curiosidades",icon:"🧠",desc:"Ciencia, naturaleza",color:"#A855F7" },
  { id:"horror",label:"Terror",icon:"🌙",desc:"Relatos, leyendas",color:"#6366F1" },
  { id:"motivation",label:"Motivación",icon:"🔥",desc:"Superación, negocios",color:"#EF4444" },
  { id:"tech",label:"Tecnología",icon:"💻",desc:"IA, gadgets, futuro",color:"#06B6D4" },
]

export const NICHE_COLORS: Record<string, string> = {
  history: "#E8A838", kids: "#4ECDC4", facts: "#A855F7",
  horror: "#6366F1", motivation: "#EF4444", tech: "#06B6D4",
}

export const PIPELINE_STEPS = [
  { label:"Ideación",desc:"Guiones IA",icon:"💡",color:"#F97316" },
  { label:"Narración",desc:"ElevenLabs",icon:"🎙️",color:"#EC4899" },
  { label:"Visuales",desc:"NanoBanana",icon:"🎬",color:"#8B5CF6" },
  { label:"Composición",desc:"FFmpeg",icon:"✂️",color:"#3B82F6" },
  { label:"Thumbnail",desc:"IA + A/B",icon:"🖼️",color:"#06B6D4" },
  { label:"SEO",desc:"Tags auto",icon:"🔍",color:"#EAB308" },
  { label:"Upload",desc:"YouTube API",icon:"📤",color:"#22C55E" },
  { label:"Schedule",desc:"Auto-publish",icon:"📅",color:"#F472B6" },
]

export const STATUS_MAP: Record<string, { bg: string; color: string; label: string; order: number }> = {
  script:      { bg:"rgba(59,130,246,0.12)",  color:"#60A5FA", label:"Guión",        order:0 },
  generating:  { bg:"rgba(139,92,246,0.12)",  color:"#A78BFA", label:"Generando",    order:1 },
  voiceover:   { bg:"rgba(236,72,153,0.12)",  color:"#F472B6", label:"Narración",    order:2 },
  compositing: { bg:"rgba(6,182,212,0.12)",   color:"#22D3EE", label:"Composición",  order:3 },
  rendering:   { bg:"rgba(234,179,8,0.12)",   color:"#FACC15", label:"Renderizando", order:4 },
  thumbnail:   { bg:"rgba(249,115,22,0.12)",  color:"#FB923C", label:"Thumbnail",    order:5 },
  uploading:   { bg:"rgba(34,197,94,0.12)",   color:"#4ADE80", label:"Subiendo",     order:6 },
  complete:    { bg:"rgba(34,197,94,0.12)",   color:"#4ADE80", label:"✓ Publicado",  order:7 },
  error:       { bg:"rgba(239,68,68,0.12)",   color:"#F87171", label:"Error",        order:-1 },
}

// ── Helper to generate IDs ──────────────────────────────
export const genId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

// ── Helper to get current time string ───────────────────
export const nowTime = () => {
  const d = new Date()
  return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`
}

export const nowDate = () => new Date().toISOString().split('T')[0]
