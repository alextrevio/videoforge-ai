'use client'
import React, { useState, useEffect, useMemo } from 'react'
import { useApp } from '@/lib/context'
import { STATUS_MAP, NICHES, PIPELINE_STEPS, NICHE_COLORS } from '@/lib/store'
import type { VideoItem, Channel } from '@/lib/store'

/* ═══════════════════════════════════════════════════════════
   VIDEOFORGE AI — ENTERPRISE PLATFORM
   ═══════════════════════════════════════════════════════════ */

// ── ICONS ─────────────────────────────────────────────────
const I: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {
  Zap: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  Play: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  Pause: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>,
  Plus: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Video: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/></svg>,
  Upload: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>,
  Settings: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  Bar: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>,
  Clock: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Check: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  X: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Right: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
  Globe: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  Layers: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
  Spark: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3L12 3z"/></svg>,
  YT: (p) => <svg {...p} viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.5 15.6V8.4L15.8 12l-6.3 3.6z"/></svg>,
  Trend: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  Eye: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  Dollar: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  Repeat: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>,
  Menu: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  Loader: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>,
  Users: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Bell: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  Search: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Target: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  Calendar: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  Activity: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  Terminal: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>,
  Link: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  Cpu: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/></svg>,
  Wand: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 4 0-2"/><path d="m15 16 0-2"/><path d="m8 9 2 0"/><path d="m20 9 2 0"/><path d="m17.8 11.8 1.2 1.2"/><path d="m17.8 6.2 1.2-1.2"/><path d="m3 21 9-9"/><path d="m12.2 6.2-1.2-1.2"/></svg>,
  Server: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>,
  Edit: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Trash: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  ArrowUp: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>,
}

const sz = (s: number) => ({ width: s, height: s, style: { flexShrink: 0 } as React.CSSProperties })

const LOG_COLORS: Record<string, string> = { success:"#4ADE80", info:"#60A5FA", warning:"#FACC15", error:"#F87171" }

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════
export default function VideoForgeApp() {
  const app = useApp()
  const { channels, videos, campaigns, logs, settings: appSettings,
    addChannel, updateChannel, deleteChannel,
    addVideo, updateVideo, deleteVideo, advanceVideo,
    addCampaign, updateCampaign, deleteCampaign, toggleCampaignStatus,
    generateFromIdea, addLog, clearLogs, updateSettings,
    totalRevenue, totalVideos, totalSubs, activeJobs
  } = app

  const [view, setView] = useState("dashboard")
  const [modal, setModal] = useState<string|null>(null)
  const [mobNav, setMobNav] = useState(false)
  const [selNiche, setSelNiche] = useState<string|null>(null)
  const [genIdea, setGenIdea] = useState("")
  const [genChan, setGenChan] = useState(channels[1]?.id || "ch2")
  const [genCount, setGenCount] = useState(20)
  const [genDur, setGenDur] = useState("45")
  const [genPerDay, setGenPerDay] = useState("3")
  const [genOpts, setGenOpts] = useState(["animation","narration","subtitles","thumbnail","seo"])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterChannel, setFilterChannel] = useState("all")
  const [liveProgress, setLiveProgress] = useState<Record<string,number>>({})
  const [detailVideo, setDetailVideo] = useState<VideoItem|null>(null)
  const [settingsTab, setSettingsTab] = useState("integrations")
  const [campaignName, setCampaignName] = useState("")
  const [campaignIdea, setCampaignIdea] = useState("")
  const [newChName, setNewChName] = useState("")
  const [newChNiche, setNewChNiche] = useState("")
  const [newChIcon, setNewChIcon] = useState("📺")
  const [editCampId, setEditCampId] = useState<string|null>(null)
  const [editVideoTitle, setEditVideoTitle] = useState("")
  const [editVideoDesc, setEditVideoDesc] = useState("")
  // Modal campaign form
  const [mcVideos, setMcVideos] = useState("20")
  const [mcDur, setMcDur] = useState("45")
  const [mcChan, setMcChan] = useState(channels[0]?.id || "ch1")
  const [mcPerDay, setMcPerDay] = useState("3")

  useEffect(() => {
    const iv = setInterval(() => {
      setLiveProgress(prev => {
        const next = { ...prev }
        videos.forEach(v => {
          if (v.status !== "complete" && v.status !== "error") {
            next[v.id] = Math.min((next[v.id] || v.progress) + Math.random() * 0.4, 99.5)
          }
        })
        return next
      })
    }, 2500)
    return () => clearInterval(iv)
  }, [videos])

  const toggleOpt = (o: string) => setGenOpts(p => p.includes(o) ? p.filter(x => x !== o) : [...p, o])
  const toggleSetting = (k: string) => updateSettings({ [k]: !(appSettings as any)[k] })

  const filteredVideos = useMemo(() => {
    let v = [...videos]
    if (filterStatus !== "all") v = v.filter(x => x.status === filterStatus)
    if (filterChannel !== "all") v = v.filter(x => x.channel === filterChannel)
    if (search) v = v.filter(x => x.title.toLowerCase().includes(search.toLowerCase()))
    return v
  }, [filterStatus, filterChannel, search, videos])

  const doGen = () => {
    if (!genIdea.trim()) return
    setLoading(true)
    setTimeout(() => {
      generateFromIdea(genIdea, genChan, genCount, genDur, parseInt(genPerDay), genOpts)
      setLoading(false)
      setGenIdea("")
      showToast(`${genCount} videos generados exitosamente`)
    }, 1500)
  }

  const doCampaign = () => {
    if (!campaignName.trim()) return
    setLoading(true)
    setTimeout(() => {
      const ch = channels.find(c => c.id === mcChan)
      generateFromIdea(
        campaignIdea || campaignName,
        mcChan,
        parseInt(mcVideos),
        mcDur,
        parseInt(mcPerDay),
        genOpts
      )
      setLoading(false)
      setModal(null)
      setCampaignName("")
      setCampaignIdea("")
      setSelNiche(null)
      showToast(`Campaña lanzada con ${mcVideos} videos`)
    }, 1500)
  }

  const doAddChannel = () => {
    if (!newChName.trim() || !newChNiche) return
    const niche = NICHES.find(n => n.id === newChNiche)
    addChannel({
      name: newChName,
      niche: newChNiche,
      icon: newChIcon || niche?.icon || "📺",
      status: 'growing',
      color: niche?.color || "#666",
    })
    setNewChName("")
    setNewChNiche("")
    setNewChIcon("📺")
    setModal(null)
    showToast(`Canal "${newChName}" creado`)
  }

  const doSaveEditCampaign = () => {
    if (!editCampId || !campaignName.trim()) return
    updateCampaign(editCampId, {
      name: campaignName,
      idea: campaignIdea,
      niche: selNiche || undefined,
      totalVideos: parseInt(mcVideos),
      videoDuration: mcDur,
      channel: mcChan,
      videosPerDay: parseInt(mcPerDay),
    })
    addLog('info', `Campaña "${campaignName}" actualizada`)
    setEditCampId(null)
    setCampaignName("")
    setCampaignIdea("")
    setModal(null)
    showToast('Campaña actualizada')
  }

  const doSaveEditVideo = () => {
    if (!detailVideo) return
    updateVideo(detailVideo.id, { title: editVideoTitle, description: editVideoDesc })
    addLog('info', `Video "${editVideoTitle}" actualizado`)
    setDetailVideo(null)
    setModal(null)
    showToast('Video actualizado')
  }

  const settings = appSettings

  // Toast notifications
  const [toasts, setToasts] = useState<{id:string,msg:string,type:string}[]>([])
  const showToast = (msg: string, type='success') => {
    const id = Date.now().toString()
    setToasts(p => [...p, {id,msg,type}])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000)
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return
      if (e.key === 'Escape') { setModal(null); setDetailVideo(null) }
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'g') { e.preventDefault(); setView('generate') }
        if (e.key === 'p') { e.preventDefault(); setView('pipeline') }
        if (e.key === 'n') { e.preventDefault(); setModal('campaign') }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const getChannel = (id: string) => channels.find(c => c.id === id) || channels[0]
  const fmt = (n: number) => n >= 1e6 ? (n/1e6).toFixed(1)+"M" : n >= 1e3 ? (n/1e3).toFixed(1)+"K" : String(n)

  const STEPS = PIPELINE_STEPS

  const NAV = [
    { id:"dashboard",label:"Dashboard",icon:I.Bar },
    { id:"pipeline",label:"Pipeline",icon:I.Layers,badge:activeJobs },
    { id:"generate",label:"Generador IA",icon:I.Spark },
    { id:"campaigns",label:"Campañas",icon:I.Target },
    { id:"channels",label:"Canales",icon:I.YT },
    { id:"schedule",label:"Programación",icon:I.Calendar },
    { id:"analytics",label:"Analíticas",icon:I.Trend },
    { id:"logs",label:"Actividad",icon:I.Activity },
    { id:"settings",label:"Configuración",icon:I.Settings },
  ]

  const TITLES: Record<string,string> = {
    dashboard:"Command Center", pipeline:"Video Pipeline", generate:"Generador IA",
    campaigns:"Campañas", channels:"Gestión de Canales", schedule:"Programación",
    analytics:"Analíticas & Revenue", logs:"Activity Log", settings:"Configuración",
  }

  // ── DASHBOARD ─────────────────────────────────────────
  const renderDashboard = () => (
    <>
      <div className="vf-stats">{[
        { icon:I.Video, label:"Total Videos", value:totalVideos, change:"+23 esta semana", color:"#F97316", bg:"rgba(249,115,22,0.1)" },
        { icon:I.Eye, label:"Vistas Totales", value:"14.8M", change:"+340K hoy", color:"#3B82F6", bg:"rgba(59,130,246,0.1)" },
        { icon:I.Dollar, label:"Revenue", value:`$${totalRevenue.toLocaleString()}`, change:"+$2,100/sem", color:"#22C55E", bg:"rgba(34,197,94,0.1)" },
        { icon:I.Users, label:"Suscriptores", value:fmt(totalSubs), change:"+1,247/sem", color:"#8B5CF6", bg:"rgba(139,92,246,0.1)" },
        { icon:I.Cpu, label:"Jobs Activos", value:activeJobs, change:`${channels.length} canales`, color:"#EC4899", bg:"rgba(236,72,153,0.1)" },
      ].map((s,i) => (
        <div className="vf-stat" key={i}>
          <div className="vf-stat-top"><div className="vf-stat-icon" style={{ background:s.bg }}><s.icon {...sz(18)} style={{ color:s.color }} /></div><span className="vf-stat-ch"><I.ArrowUp {...sz(10)} /> {s.change}</span></div>
          <div className="vf-stat-val">{s.value}</div>
          <div className="vf-stat-lbl">{s.label}</div>
        </div>
      ))}</div>

      <div className="vf-gen-hero">
        <div className="vf-gen-bg" />
        <div className="vf-gen-ct">
          <div className="vf-gen-top">
            <div><h3 className="vf-gen-title"><I.Spark {...sz(20)} style={{ color:"#F97316" }} /> Generación Rápida</h3><p className="vf-t2" style={{ fontSize:12,marginTop:4 }}>Escribe una idea y genera contenido para cualquier canal</p></div>
            <div className="vf-pulse"><div className="vf-pulse-dot" /><span>Engine Activo</span></div>
          </div>
          <div className="vf-gen-row">
            <input className="vf-gen-in" value={genIdea} onChange={e => setGenIdea(e.target.value)} placeholder="Tu idea... ej: 'Los 10 inventos más locos de la historia'" onKeyDown={e => e.key==="Enter" && doGen()} />
            <select className="vf-gen-sel" value={genChan} onChange={e => setGenChan(e.target.value)}>{channels.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}</select>
            <button className="vf-btn vf-btn-glow" onClick={doGen} disabled={loading||!genIdea.trim()}>{loading ? <><I.Loader {...sz(16)} className="vf-spin" /> ...</> : <><I.Zap {...sz(16)} /> Generar</>}</button>
          </div>
          <div className="vf-tags">{[
            {id:"animation",l:"Animación",e:"🎬"},{id:"narration",l:"Narración IA",e:"🎙️"},{id:"subtitles",l:"Subtítulos",e:"💬"},
            {id:"music",l:"Música",e:"🎵"},{id:"thumbnail",l:"Thumbnail",e:"🖼️"},{id:"seo",l:"SEO",e:"🔍"},
          ].map(t => <button key={t.id} className={`vf-tag ${genOpts.includes(t.id)?"on":""}`} onClick={() => toggleOpt(t.id)}>{t.e} {t.l}</button>)}</div>
        </div>
      </div>

      <div className="vf-grid2">
        <div className="vf-card">
          <div className="vf-card-h"><span className="vf-card-t"><I.Layers {...sz(16)} style={{ color:"var(--acc)" }} /> Pipeline</span><button className="vf-btn vf-btn-sm vf-btn-ghost" onClick={() => setView("pipeline")}>Ver todo <I.Right {...sz(12)} /></button></div>
          <div className="vf-card-b">{videos.filter(v => v.status !== "complete").slice(0,6).map(v => {
            const ch = getChannel(v.channel), st = STATUS_MAP[v.status], pr = liveProgress[v.id]||v.progress
            return (<div className="vf-row" key={v.id} onClick={() => setDetailVideo(v)}>
              <div className="vf-thumb" style={{ background:`linear-gradient(135deg,${ch.color}15,${ch.color}30)` }}><I.Play {...sz(12)} style={{ color:ch.color }} /></div>
              <div className="vf-row-info"><div className="vf-row-title">{v.title}</div><div className="vf-row-meta">{ch.icon} {ch.name} · {v.duration} · {v.scheduledAt}</div></div>
              <div className="vf-bar-w"><div className="vf-bar-f" style={{ width:`${pr}%`, background:pr>=100?"var(--ok)":"linear-gradient(90deg,var(--acc),var(--acc2))" }} /></div>
              <span className="vf-badge" style={{ background:st.bg,color:st.color }}>{st.label}</span>
            </div>)
          })}</div>
        </div>
        <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
          <div className="vf-card">
            <div className="vf-card-h"><span className="vf-card-t"><I.YT {...sz(16)} style={{ color:"#FF0000" }} /> Canales</span><button className="vf-btn vf-btn-sm vf-btn-ghost" onClick={() => setModal("newchannel")}><I.Plus {...sz(12)} /> Nuevo</button></div>
            <div className="vf-card-b">{channels.map(ch => (
              <div className="vf-ch-row" key={ch.id}>
                <div className="vf-ch-av" style={{ background:`${ch.color}18` }}>{ch.icon}</div>
                <div className="vf-ch-info"><div className="vf-ch-name">{ch.name}</div><div className="vf-ch-stats">{ch.subs.toLocaleString()} subs · {ch.videos} vids</div></div>
                <div style={{ textAlign:"right" }}><div style={{ fontSize:14,fontWeight:700,color:"#4ADE80",fontFamily:"'JetBrains Mono',monospace" }}>${ch.revenue.toLocaleString()}</div><div style={{ fontSize:11,color:ch.color }}>{ch.growth}</div></div>
              </div>
            ))}</div>
          </div>
          <div className="vf-card" style={{ flex:1 }}>
            <div className="vf-card-h"><span className="vf-card-t"><I.Activity {...sz(16)} style={{ color:"#4ADE80" }} /> Actividad</span></div>
            <div className="vf-card-b" style={{ maxHeight:200,overflowY:"auto" }}>{logs.slice(0,6).map((l,i) => (
              <div className="vf-log-r" key={i}><span className="vf-log-dot" style={{ background:LOG_COLORS[l.type] }} /><span className="vf-log-t">{l.time}</span><span className="vf-log-m">{l.message}</span></div>
            ))}</div>
          </div>
        </div>
      </div>

      <div className="vf-sys">{[
        {l:"Claude API",s:settings.anthropicKey?"online":"no key",e:"🤖"},{l:"ElevenLabs",s:settings.elevenLabsKey&&settings.elevenLabs?"online":settings.elevenLabs?"no key":"off",e:"🎙️"},{l:"NanoBanana",s:settings.nanoBananaKey&&settings.nanoBanana?"online":settings.nanoBanana?"no key":"off",e:"🎬"},
        {l:"YouTube API",s:settings.youtubeKey?"online":"no key",e:"📺"},{l:"FFmpeg",s:"ready",e:"⚙️"},{l:"Jobs",s:`${activeJobs} activos`,e:"📋"},{l:"Videos",s:`${videos.length} total`,e:"💾"},
      ].map((s,i) => <div className="vf-sys-i" key={i}><span>{s.e}</span><span className="vf-sys-l">{s.l}</span><span className="vf-sys-s" style={{ color:s.s==="online"||s.s==="ready"?"#4ADE80":s.s==="off"?"#F87171":"#FACC15" }}>{s.s==="online"?"● ":s.s==="ready"?"● ":""}{s.s}</span></div>)}</div>
    </>
  )

  // ── PIPELINE ──────────────────────────────────────────
  const renderPipeline = () => (
    <>
      <div className="vf-toolbar">
        <div className="vf-search-w"><I.Search {...sz(14)} style={{ color:"var(--t3)" }} /><input className="vf-search-i" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar videos..." /></div>
        <select className="vf-sel" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}><option value="all">Todos</option>{Object.entries(STATUS_MAP).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}</select>
        <select className="vf-sel" value={filterChannel} onChange={e => setFilterChannel(e.target.value)}><option value="all">Canales</option>{channels.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}</select>
        <div style={{ flex:1 }} /><span className="vf-t3" style={{ fontSize:12 }}>{filteredVideos.length} videos</span>
        <button className="vf-btn vf-btn-glow" onClick={() => setModal("campaign")}><I.Plus {...sz(14)} /> Nueva Campaña</button>
      </div>
      <div className="vf-card">
        <div className="vf-card-b">{filteredVideos.length > 0 ? filteredVideos.map(v => {
          const ch=getChannel(v.channel), st=STATUS_MAP[v.status], pr=liveProgress[v.id]||v.progress
          return (<div className="vf-row" key={v.id} onClick={() => setDetailVideo(v)}>
            <div className="vf-thumb" style={{ background:`linear-gradient(135deg,${ch.color}15,${ch.color}30)` }}>{v.status==="complete"?<I.Check {...sz(12)} style={{ color:"#4ADE80" }} />:<I.Play {...sz(12)} style={{ color:ch.color }} />}</div>
            <div className="vf-row-info" style={{ flex:3 }}><div className="vf-row-title">{v.title}</div><div className="vf-row-meta">{ch.icon} {ch.name} · {v.duration}</div></div>
            <div className="vf-bar-w" style={{ width:100 }}><div className="vf-bar-f" style={{ width:`${pr}%`, background:pr>=100?"var(--ok)":"linear-gradient(90deg,var(--acc),var(--acc2))" }} /></div>
            <span className="vf-mono vf-t3" style={{ fontSize:11,width:32 }}>{Math.round(pr)}%</span>
            <span className="vf-badge" style={{ background:st.bg,color:st.color }}>{st.label}</span>
            <span className="vf-t2" style={{ fontSize:12,minWidth:80 }}>{v.scheduledAt}</span>
            <span className="vf-mono" style={{ fontSize:12,color:"var(--acc)" }}>{v.estimatedViews}</span>
          </div>)
        }) : <div style={{ textAlign:"center",padding:40,color:"var(--t3)" }}>No hay videos {filterStatus !== "all" || filterChannel !== "all" ? "con esos filtros" : "en el pipeline"}. Usa el Generador IA para crear contenido.</div>}</div>
      </div>
    </>
  )

  // ── GENERATOR ─────────────────────────────────────────
  const renderGenerate = () => (
    <>
      <div className="vf-gen-hero">
        <div className="vf-gen-bg" /><div className="vf-gen-ct">
          <h2 style={{ fontSize:20,fontWeight:800,display:"flex",alignItems:"center",gap:10,marginBottom:8 }}><I.Spark {...sz(24)} style={{ color:"#F97316" }} /> Motor de Generación Masiva</h2>
          <p className="vf-t2" style={{ marginBottom:20,lineHeight:1.7,fontSize:13 }}>Describe una idea → el sistema genera guiones, narración, animaciones, edición, thumbnails, SEO y sube los videos programados.</p>
          <div className="vf-form-g"><label className="vf-label">Idea / Prompt Principal</label><textarea className="vf-ta" rows={4} value={genIdea} onChange={e => setGenIdea(e.target.value)} placeholder="Ej: 'Serie de 50 videos sobre civilizaciones antiguas misteriosas. 45 seg, animación documental, narración dramática, música épica.'" /></div>
          <div className="vf-form-grid4">
            <div className="vf-form-g"><label className="vf-label">Canal</label><select className="vf-input" value={genChan} onChange={e => { if(e.target.value==="new"){setModal("newchannel")}else{setGenChan(e.target.value)} }}>{channels.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}<option value="new">+ Nuevo canal</option></select></div>
            <div className="vf-form-g"><label className="vf-label">Videos</label><select className="vf-input" value={genCount} onChange={e => setGenCount(Number(e.target.value))}>{[5,10,20,50,100].map(n => <option key={n} value={n}>{n} videos</option>)}</select></div>
            <div className="vf-form-g"><label className="vf-label">Duración</label><select className="vf-input" value={genDur} onChange={e => setGenDur(e.target.value)}><option value="15">15 seg</option><option value="30">30 seg</option><option value="45">45 seg</option><option value="60">1 min</option></select></div>
            <div className="vf-form-g"><label className="vf-label">Videos/día</label><select className="vf-input" value={genPerDay} onChange={e => setGenPerDay(e.target.value)}>{[1,2,3,4,5].map(n => <option key={n} value={String(n)}>{n}/día</option>)}</select></div>
          </div>
          <label className="vf-label" style={{ marginBottom:8 }}>Opciones</label>
          <div className="vf-tags" style={{ marginBottom:20 }}>{[
            {id:"animation",l:"Animación NanoBanana",e:"🎬"},{id:"narration",l:"Narración ElevenLabs",e:"🎙️"},{id:"subtitles",l:"Subtítulos",e:"💬"},
            {id:"music",l:"Música Libre",e:"🎵"},{id:"thumbnail",l:"Thumbnail IA",e:"🖼️"},{id:"seo",l:"SEO + Tags",e:"🔍"},
            {id:"trending",l:"Trending Analysis",e:"📈"},{id:"ab",l:"A/B Thumbnails",e:"🧪"},{id:"hooks",l:"Hook Optimization",e:"🪝"},{id:"multilang",l:"Multi-idioma",e:"🌐"},
          ].map(t => <button key={t.id} className={`vf-tag ${genOpts.includes(t.id)?"on":""}`} onClick={() => toggleOpt(t.id)}>{t.e} {t.l}</button>)}</div>
          <button className="vf-btn vf-btn-glow vf-btn-xl" onClick={doGen} disabled={loading||!genIdea.trim()}>{loading ? <><I.Loader {...sz(18)} className="vf-spin" /> Generando {genCount} videos...</> : <><I.Zap {...sz(18)} /> Iniciar Generación — {genCount} Videos</>}</button>
        </div>
      </div>
      <div className="vf-card" style={{ marginTop:20 }}>
        <div className="vf-card-h"><span className="vf-card-t"><I.Repeat {...sz(16)} style={{ color:"var(--acc2)" }} /> Pipeline Automático</span></div>
        <div className="vf-card-b"><div className="vf-steps">{STEPS.map((s,i) => (
          <div key={i} className="vf-step" style={{ borderColor:`${s.color}30`,background:`${s.color}08` }}>
            <div style={{ fontSize:28,marginBottom:6 }}>{s.icon}</div><div style={{ fontSize:12,fontWeight:700 }}>{s.label}</div><div className="vf-t3" style={{ fontSize:10 }}>{s.desc}</div>
            {i<STEPS.length-1 && <div className="vf-step-arr"><I.Right {...sz(12)} /></div>}
          </div>
        ))}</div></div>
      </div>
    </>
  )

  // ── CAMPAIGNS ─────────────────────────────────────────
  const renderCampaigns = () => (
    <>
      <div className="vf-toolbar"><h3 style={{ fontSize:15,fontWeight:700 }}>Campañas Activas</h3><div style={{ flex:1 }} /><button className="vf-btn vf-btn-glow" onClick={() => setModal("campaign")}><I.Plus {...sz(14)} /> Nueva</button></div>
      {campaigns.length === 0 ? <div className="vf-card"><div className="vf-card-b" style={{ textAlign:"center",padding:40,color:"var(--t3)" }}>No hay campañas. Crea una para generar videos en masa.</div></div> : <div className="vf-camp-grid">{campaigns.map(c => {
        const ch=getChannel(c.channel), pct=Math.round(c.completedVideos/c.totalVideos*100)
        return (<div className="vf-camp" key={c.id}>
          <div className="vf-camp-head"><div className="vf-ch-av" style={{ background:`${ch.color}18`,width:36,height:36 }}>{ch.icon}</div><div style={{ flex:1 }}><div style={{ fontSize:14,fontWeight:700 }}>{c.name}</div><div className="vf-t3" style={{ fontSize:11 }}>{ch.name} · {c.createdAt}</div></div>
            <span className="vf-badge" style={{ background:c.status==="active"?"rgba(34,197,94,0.12)":"rgba(234,179,8,0.12)",color:c.status==="active"?"#4ADE80":"#FACC15" }}>{c.status==="active"?"● Activa":"⏸ Pausada"}</span></div>
          <div className="vf-camp-prog"><div className="vf-camp-bar"><div style={{ width:`${pct}%`,height:"100%",background:ch.color,borderRadius:3 }} /></div><div style={{ display:"flex",justifyContent:"space-between",marginTop:6 }}><span className="vf-mono vf-t2" style={{ fontSize:11 }}>{c.completedVideos}/{c.totalVideos} videos</span><span className="vf-mono" style={{ fontSize:11,color:ch.color }}>{pct}%</span></div></div>
          <div style={{ display:"flex",gap:6,marginTop:10 }}>
            {c.status==="active"?<button className="vf-btn vf-btn-sm vf-btn-ghost" onClick={() => toggleCampaignStatus(c.id)}><I.Pause {...sz(12)} /> Pausar</button>:<button className="vf-btn vf-btn-sm vf-btn-glow" onClick={() => toggleCampaignStatus(c.id)}><I.Play {...sz(12)} /> Reanudar</button>}
            <button className="vf-btn vf-btn-sm vf-btn-ghost" onClick={() => { setCampaignName(c.name); setCampaignIdea(c.idea||""); setMcVideos(String(c.totalVideos)); setMcDur(c.videoDuration||"45"); setMcChan(c.channel); setMcPerDay(String(c.videosPerDay||3)); setSelNiche(c.niche||null); setEditCampId(c.id); setModal("editcampaign") }}><I.Edit {...sz(12)} /> Editar</button>
            <button className="vf-btn vf-btn-sm vf-btn-ghost" style={{ color:"#F87171" }} onClick={() => deleteCampaign(c.id)}><I.Trash {...sz(12)} /></button>
          </div>
        </div>)
      })}</div>}
    </>
  )

  // ── CHANNELS ──────────────────────────────────────────
  const renderChannels = () => (
    <>
      <div className="vf-toolbar"><h3 style={{ fontSize:15,fontWeight:700 }}>Canales YouTube</h3><div style={{ flex:1 }} /><button className="vf-btn vf-btn-glow" onClick={() => setModal("newchannel")}><I.Plus {...sz(14)} /> Conectar Canal</button></div>
      {channels.length === 0 && <div className="vf-card"><div className="vf-card-b" style={{ textAlign:"center",padding:40,color:"var(--t3)" }}>No hay canales. Crea uno para empezar.</div></div>}
      <div className="vf-ch-grid">{channels.map(ch => (
        <div className="vf-ch-full" key={ch.id}>
          <div className="vf-ch-banner" style={{ background:`linear-gradient(135deg,${ch.color}20,${ch.color}40)` }}><span style={{ fontSize:44 }}>{ch.icon}</span></div>
          <div className="vf-ch-body">
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"start",marginBottom:12 }}><div><h4 style={{ fontSize:15,fontWeight:700 }}>{ch.name}</h4><span className="vf-t3" style={{ fontSize:11 }}>{NICHES.find(n => n.id===ch.niche)?.label}</span></div>
              <span className="vf-badge" style={{ background:ch.status==="active"?"rgba(34,197,94,0.12)":"rgba(234,179,8,0.12)",color:ch.status==="active"?"#4ADE80":"#FACC15" }}>{ch.status==="active"?"● Activo":"📈 Creciendo"}</span></div>
            <div className="vf-ch-metrics">{[
              {v:ch.subs.toLocaleString(),l:"Subs"},{v:String(ch.videos),l:"Videos"},{v:ch.views,l:"Vistas"},
              {v:`$${ch.revenue.toLocaleString()}`,l:"Revenue",c:"#4ADE80"},{v:ch.growth,l:"Growth",c:ch.color}
            ].map((m,i) => <div key={i} className="vf-ch-m"><span className="vf-ch-mv" style={m.c ? { color:m.c } : {}}>{m.v}</span><span className="vf-ch-ml">{m.l}</span></div>)}</div>
            <div style={{ display:"flex",gap:6,marginTop:12 }}>
              <button className="vf-btn vf-btn-sm vf-btn-ghost" style={{ flex:1 }} onClick={() => setView("analytics")}><I.Bar {...sz(12)} /> Stats</button>
              <button className="vf-btn vf-btn-sm vf-btn-ghost" style={{ flex:1 }} onClick={() => setView("settings")}><I.Settings {...sz(12)} /> Config</button>
              <button className="vf-btn vf-btn-sm vf-btn-glow" style={{ flex:1 }} onClick={() => { setGenChan(ch.id); setView("generate") }}><I.Spark {...sz(12)} /> Generar</button>
            </div>
            <div style={{ marginTop:8,display:"flex",justifyContent:"flex-end" }}>
              <button className="vf-btn vf-btn-sm vf-btn-ghost" style={{ color:"#F87171",fontSize:10 }} onClick={() => { if(confirm(`¿Eliminar "${ch.name}"? Se borrarán todos sus videos y campañas.`)) deleteChannel(ch.id) }}><I.Trash {...sz(10)} /> Eliminar</button>
            </div>
          </div>
        </div>
      ))}</div>
    </>
  )

  // ── SCHEDULE ──────────────────────────────────────────
  const renderSchedule = () => {
    const days = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"]
    // Deterministic schedule: assign videos to days based on their index
    const schedByDay = useMemo(() => {
      const m: Record<number, string[]> = {}
      const pending = videos.filter(v => v.status !== 'complete')
      pending.forEach((v, i) => {
        const dayIdx = Math.floor(i / 3) % 31
        if (!m[dayIdx]) m[dayIdx] = []
        const ch = getChannel(v.channel)
        m[dayIdx].push(ch.color)
      })
      return m
    }, [videos])
    const doAutoSchedule = () => {
      addLog('success', `${videos.filter(v => v.status !== 'complete').length} videos auto-programados para las próximas 2 semanas`)
    }
    return (<>
      <div className="vf-toolbar"><h3 style={{ fontSize:15,fontWeight:700 }}>Marzo 2026</h3><div style={{ flex:1 }} /><button className="vf-btn vf-btn-glow" onClick={doAutoSchedule}><I.Repeat {...sz(14)} /> Auto-programar</button></div>
      <div className="vf-card"><div className="vf-card-b">
        <div className="vf-sched-h">{days.map(d => <div key={d} className="vf-sched-dl">{d}</div>)}</div>
        <div className="vf-sched-g">{Array.from({length:35},(_,i) => {
          const d=i-1, ok=d>=0&&d<31, colors=ok?(schedByDay[d]||[]):[]
          return <div className={`vf-sched-c ${ok?"":"dim"}`} key={i}>{ok && <><span className="vf-sched-n">{d+1}</span><div className="vf-sched-dots">{colors.map((c,j) => <span key={j} className="vf-sched-dot" style={{ background:c }} />)}</div></>}</div>
        })}</div>
        <div className="vf-sched-leg">{channels.map(c => <div key={c.id} className="vf-sched-li"><span className="vf-sched-dot" style={{ background:c.color }} />{c.icon} {c.name} · {c.todayUploads}/día</div>)}</div>
      </div></div>
    </>)
  }

  // ── ANALYTICS ─────────────────────────────────────────
  const renderAnalytics = () => {
    const completedVids = videos.filter(v => v.status === 'complete')
    const totalVws = completedVids.reduce((s,v) => s + v.views, 0)
    const topVids = [...videos].sort((a,b) => b.views - a.views).slice(0,6)
    return (
    <>
      <div className="vf-stats">{[
        {l:"Vistas Totales",v:fmt(totalVws),ch:`${completedVids.length} publicados`,c:"#3B82F6"},{l:"En Pipeline",v:String(activeJobs),ch:`${channels.length} canales`,c:"#8B5CF6"},
        {l:"Nuevos Subs",v:fmt(totalSubs),ch:"+247/sem",c:"#22C55E"},{l:"Revenue Total",v:`$${totalRevenue.toLocaleString()}`,ch:"+$2.1K/sem",c:"#F97316"},{l:"Videos Totales",v:String(totalVideos),ch:`${campaigns.length} campañas`,c:"#EC4899"},
      ].map((s,i) => <div className="vf-stat" key={i}><div className="vf-stat-val" style={{ color:s.c,fontSize:22 }}>{s.v}</div><div className="vf-stat-lbl">{s.l}</div><span className="vf-stat-ch" style={{ marginTop:4 }}><I.ArrowUp {...sz(10)} /> {s.ch}</span></div>)}</div>
      <div className="vf-grid2">
        <div className="vf-card">
          <div className="vf-card-h"><span className="vf-card-t"><I.Dollar {...sz(16)} style={{ color:"var(--ok)" }} /> Revenue por Canal</span></div>
          <div className="vf-card-b">{channels.length > 0 ? [...channels].sort((a,b) => b.revenue-a.revenue).map(ch => {
            const mx=Math.max(...channels.map(c => c.revenue), 1)
            return (<div className="vf-an-row" key={ch.id}><div className="vf-an-lbl"><span>{ch.icon}</span><span>{ch.name}</span></div><div className="vf-an-track"><div className="vf-an-fill" style={{ width:`${ch.revenue/mx*100}%`,background:ch.color }} /></div><span className="vf-mono" style={{ color:"#4ADE80",fontSize:13,minWidth:70,textAlign:"right" }}>${ch.revenue.toLocaleString()}</span></div>)
          }) : <div style={{ textAlign:"center",padding:20,color:"var(--t3)" }}>Sin datos</div>}</div>
        </div>
        <div className="vf-card">
          <div className="vf-card-h"><span className="vf-card-t"><I.Eye {...sz(16)} style={{ color:"#3B82F6" }} /> Top Videos</span></div>
          <div className="vf-card-b">{topVids.length > 0 ? topVids.map((v,i) => {
            const ch=getChannel(v.channel)
            return <div className="vf-row" key={v.id}><span className="vf-mono vf-t3" style={{ width:22,fontSize:13,fontWeight:700 }}>#{i+1}</span><div className="vf-row-info"><div className="vf-row-title">{v.title}</div><div className="vf-row-meta">{ch.icon} {ch.name}</div></div><span className="vf-mono" style={{ fontSize:13,fontWeight:700 }}>{v.views > 0 ? fmt(v.views) : v.estimatedViews}</span><span className="vf-badge" style={{ background:v.status==="complete"?"rgba(34,197,94,0.12)":"rgba(59,130,246,0.12)",color:v.status==="complete"?"#4ADE80":"#60A5FA" }}>{v.status==="complete"?"Publicado":STATUS_MAP[v.status]?.label}</span></div>
          }) : <div style={{ textAlign:"center",padding:20,color:"var(--t3)" }}>Sin videos aún</div>}</div>
        </div>
      </div>
    </>)
  }

  // ── LOGS ──────────────────────────────────────────────
  const renderLogs = () => (
    <div className="vf-card"><div className="vf-card-h"><span className="vf-card-t"><I.Terminal {...sz(16)} style={{ color:"#4ADE80" }} /> Activity Log</span><div style={{ display:"flex",alignItems:"center",gap:10 }}><div className="vf-pulse"><div className="vf-pulse-dot" /><span>Live</span></div><button className="vf-btn vf-btn-sm vf-btn-ghost" onClick={clearLogs}><I.Trash {...sz(10)} /> Limpiar</button></div></div>
      <div className="vf-card-b vf-terminal">{logs.length > 0 ? logs.map((l,i) => <div className="vf-log-line" key={l.id || i}><span className="vf-log-tf">[{l.time}]</span><span style={{ color:LOG_COLORS[l.type] }}>[{l.type.toUpperCase()}]</span><span>{l.message}</span></div>) : <div style={{ color:"var(--t3)",textAlign:"center",padding:20 }}>Sin actividad registrada</div>}<div className="vf-cursor">█</div></div>
    </div>
  )

  // ── SETTINGS ──────────────────────────────────────────
  const renderSettings = () => {
    const tabs = [{id:"integrations",l:"Integraciones",i:I.Link},{id:"generation",l:"Generación",i:I.Wand},{id:"youtube",l:"YouTube",i:I.YT},{id:"apikeys",l:"API Keys",i:I.Cpu},{id:"system",l:"Sistema",i:I.Server}]
    const doReset = () => { if(confirm("¿Resetear todos los datos a los valores por defecto? Esta acción no se puede deshacer.")) { localStorage.removeItem("videoforge_state"); window.location.reload() } }
    return (<>
      <div className="vf-stabs">{tabs.map(t => <button key={t.id} className={`vf-stab ${settingsTab===t.id?"on":""}`} onClick={() => setSettingsTab(t.id)}><t.i {...sz(14)} /> {t.l}</button>)}</div>
      <div className="vf-card"><div className="vf-card-b">
        {settingsTab==="integrations" && [{k:"nanoBanana",n:"NanoBanana",d:"Motor de animación visual",e:"🎬"},{k:"elevenLabs",n:"ElevenLabs",d:"TTS voces ultra-realistas",e:"🎙️"},{n:"Claude API",d:"Ideación y guiones",e:"🤖"},{n:"YouTube API v3",d:"Upload y scheduling",e:"📺"},{n:"FFmpeg Workers",d:"Composición video/audio",e:"⚙️"}].map((s,i) => (
          <div className="vf-set-row" key={i}><span style={{ fontSize:22 }}>{s.e}</span><div style={{ flex:1 }}><div style={{ fontSize:13,fontWeight:600 }}>{s.n}</div><div className="vf-t3" style={{ fontSize:11 }}>{s.d}</div></div>
            <span style={{ fontSize:11,fontWeight:600,color: s.k ? ((settings as any)[s.k] ? "#4ADE80" : "#F87171") : "#4ADE80" }}>{s.k ? ((settings as any)[s.k] ? "● Activo" : "○ Inactivo") : "● Conectado"}</span>
            {s.k && <div className={`vf-toggle ${(settings as any)[s.k]?"on":""}`} onClick={() => toggleSetting(s.k!)}><div className="vf-toggle-k" /></div>}
          </div>
        ))}
        {settingsTab==="generation" && <>
          {[{l:"Resolución",k:"resolution",opts:[["720","720p"],["1080","1080p FHD"],["4k","4K"]]},{l:"Formato",k:"format",opts:[["shorts","Shorts 9:16"],["landscape","16:9"],["square","1:1"]]},{l:"Idioma",k:"lang",opts:[["es-MX","Español MX"],["en-US","English"],["pt-BR","Português"]]},{l:"Voz",k:"voice",opts:[["mateo","Mateo"],["sofia","Sofía"],["carlos","Carlos"]]}].map((s,i) => (
            <div className="vf-set-row" key={i}><div style={{ flex:1 }}><div style={{ fontSize:13,fontWeight:600 }}>{s.l}</div></div><select className="vf-sel" style={{ width:180 }} value={(settings as any)[s.k]} onChange={e => updateSettings({[s.k]:e.target.value})}>{s.opts.map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></div>
          ))}
          {[{k:"abTest",l:"A/B Thumbnails"},{k:"trendAnalysis",l:"Trending Analysis"}].map(s => (
            <div className="vf-set-row" key={s.k}><div style={{ flex:1,fontSize:13,fontWeight:600 }}>{s.l}</div><div className={`vf-toggle ${(settings as any)[s.k]?"on":""}`} onClick={() => toggleSetting(s.k)}><div className="vf-toggle-k" /></div></div>
          ))}
        </>}
        {settingsTab==="youtube" && [{k:"autoUpload",l:"Auto-Upload"},{k:"autoSchedule",l:"Auto-Schedule (3-5 videos/día)"},{k:"autoThumb",l:"Auto-Thumbnails"},{k:"seoOpt",l:"SEO Optimization"}].map(s => (
          <div className="vf-set-row" key={s.k}><div style={{ flex:1,fontSize:13,fontWeight:600 }}>{s.l}</div><div className={`vf-toggle ${(settings as any)[s.k]?"on":""}`} onClick={() => toggleSetting(s.k)}><div className="vf-toggle-k" /></div></div>
        ))}
        {settingsTab==="apikeys" && <>
          {[{k:"anthropicKey",l:"Anthropic API Key",p:"sk-ant-...",e:"🤖"},{k:"elevenLabsKey",l:"ElevenLabs API Key",p:"xi-...",e:"🎙️"},{k:"youtubeKey",l:"YouTube Data API Key",p:"AIza...",e:"📺"},{k:"nanoBananaKey",l:"NanoBanana API Key",p:"nb-...",e:"🎬"}].map(s => (
            <div className="vf-set-row" key={s.k} style={{ flexWrap:"wrap" }}><span style={{ fontSize:18 }}>{s.e}</span><div style={{ flex:1,minWidth:120 }}><div style={{ fontSize:13,fontWeight:600 }}>{s.l}</div></div>
              <input className="vf-input" style={{ width:280,fontSize:11,fontFamily:"'JetBrains Mono',monospace" }} type="password" placeholder={s.p} value={(settings as any)[s.k] || ""} onChange={e => updateSettings({[s.k]:e.target.value})} />
              <span style={{ fontSize:10,color:(settings as any)[s.k]?"#4ADE80":"var(--t3)" }}>{(settings as any)[s.k]?"● Configurada":"Sin configurar"}</span>
            </div>
          ))}
          <div style={{ marginTop:12,padding:12,background:"rgba(249,115,22,0.06)",borderRadius:8,fontSize:11,color:"var(--t2)",lineHeight:1.6 }}>
            <strong style={{ color:"var(--acc)" }}>⚠️ Nota:</strong> Las API keys se guardan localmente en tu navegador. Para producción, configúralas como variables de entorno en Vercel (Settings → Environment Variables).
          </div>
        </>}
        {settingsTab==="system" && <>
          {[{k:"notifications",l:"Push Notifications"},{k:"emailReports",l:"Email Reports"},{k:"slackAlerts",l:"Slack Alerts"}].map(s => (
            <div className="vf-set-row" key={s.k}><div style={{ flex:1,fontSize:13,fontWeight:600 }}>{s.l}</div><div className={`vf-toggle ${(settings as any)[s.k]?"on":""}`} onClick={() => toggleSetting(s.k)}><div className="vf-toggle-k" /></div></div>
          ))}
          <div className="vf-set-row" style={{ borderTop:"1px solid var(--bd)",marginTop:8,paddingTop:16 }}>
            <div style={{ flex:1 }}><div style={{ fontSize:13,fontWeight:600,color:"#F87171" }}>Resetear Datos</div><div className="vf-t3" style={{ fontSize:11 }}>Restaura canales, videos y campañas a los valores por defecto</div></div>
            <button className="vf-btn vf-btn-sm vf-btn-ghost" style={{ color:"#F87171" }} onClick={doReset}><I.Trash {...sz(12)} /> Resetear</button>
          </div>
        </>}
      </div></div>
    </>)
  }

  const renderView = () => { switch(view) { case "dashboard":return renderDashboard(); case "pipeline":return renderPipeline(); case "generate":return renderGenerate(); case "campaigns":return renderCampaigns(); case "channels":return renderChannels(); case "schedule":return renderSchedule(); case "analytics":return renderAnalytics(); case "logs":return renderLogs(); case "settings":return renderSettings(); default:return renderDashboard() } }

  // ── MODALS ────────────────────────────────────────────
  const renderModals = () => {
    if (modal==="newchannel") return (
      <div className="vf-overlay" onClick={e => e.target===e.currentTarget && setModal(null)}>
        <div className="vf-modal" style={{ maxWidth:480 }}>
          <div className="vf-modal-h"><h2 style={{ fontSize:18,fontWeight:800,display:"flex",alignItems:"center",gap:8 }}><I.YT {...sz(20)} style={{ color:"#FF0000" }} /> Nuevo Canal</h2><button className="vf-modal-x" onClick={() => setModal(null)}><I.X {...sz(18)} /></button></div>
          <div className="vf-modal-b">
            <div className="vf-form-g"><label className="vf-label">Nombre del Canal</label><input className="vf-input" value={newChName} onChange={e => setNewChName(e.target.value)} placeholder="ej: Mi Canal de Historia" /></div>
            <div className="vf-form-g"><label className="vf-label">Ícono (emoji)</label><input className="vf-input" style={{ width:80 }} value={newChIcon} onChange={e => setNewChIcon(e.target.value)} /></div>
            <div className="vf-form-g"><label className="vf-label">Nicho</label><div className="vf-niche-g">{NICHES.map(n => <div key={n.id} className={`vf-niche ${newChNiche===n.id?"sel":""}`} onClick={() => setNewChNiche(n.id)}><span style={{ fontSize:26 }}>{n.icon}</span><span style={{ fontSize:12,fontWeight:600 }}>{n.label}</span><span className="vf-t3" style={{ fontSize:10 }}>{n.desc}</span></div>)}</div></div>
          </div>
          <div className="vf-modal-f"><button className="vf-btn vf-btn-ghost" onClick={() => setModal(null)}>Cancelar</button><button className="vf-btn vf-btn-glow" onClick={doAddChannel} disabled={!newChName.trim()||!newChNiche}><I.Plus {...sz(16)} /> Crear Canal</button></div>
        </div>
      </div>
    )
    if (modal==="campaign") return (
      <div className="vf-overlay" onClick={e => e.target===e.currentTarget && setModal(null)}>
        <div className="vf-modal">
          <div className="vf-modal-h"><h2 style={{ fontSize:18,fontWeight:800,display:"flex",alignItems:"center",gap:8 }}><I.Spark {...sz(20)} style={{ color:"var(--acc)" }} /> Nueva Campaña</h2><button className="vf-modal-x" onClick={() => setModal(null)}><I.X {...sz(18)} /></button></div>
          <div className="vf-modal-b">
            <div className="vf-form-g"><label className="vf-label">Nombre</label><input className="vf-input" value={campaignName} onChange={e => setCampaignName(e.target.value)} placeholder="ej: Serie Civilizaciones" /></div>
            <div className="vf-form-g"><label className="vf-label">Nicho</label><div className="vf-niche-g">{NICHES.map(n => <div key={n.id} className={`vf-niche ${selNiche===n.id?"sel":""}`} onClick={() => setSelNiche(n.id)}><span style={{ fontSize:26 }}>{n.icon}</span><span style={{ fontSize:12,fontWeight:600 }}>{n.label}</span><span className="vf-t3" style={{ fontSize:10 }}>{n.desc}</span></div>)}</div></div>
            <div className="vf-form-g"><label className="vf-label">Idea</label><textarea className="vf-ta" rows={3} value={campaignIdea} onChange={e => setCampaignIdea(e.target.value)} placeholder="Describe la idea..." /></div>
            <div className="vf-form-grid2">
              <div className="vf-form-g"><label className="vf-label">Videos</label><select className="vf-input" value={mcVideos} onChange={e => setMcVideos(e.target.value)}><option value="10">10</option><option value="20">20</option><option value="50">50</option><option value="100">100</option></select></div>
              <div className="vf-form-g"><label className="vf-label">Duración</label><select className="vf-input" value={mcDur} onChange={e => setMcDur(e.target.value)}><option value="15">15s</option><option value="30">30s</option><option value="45">45s</option><option value="60">1min</option></select></div>
              <div className="vf-form-g"><label className="vf-label">Canal</label><select className="vf-input" value={mcChan} onChange={e => setMcChan(e.target.value)}>{channels.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}</select></div>
              <div className="vf-form-g"><label className="vf-label">Videos/día</label><select className="vf-input" value={mcPerDay} onChange={e => setMcPerDay(e.target.value)}><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option></select></div>
            </div>
          </div>
          <div className="vf-modal-f"><button className="vf-btn vf-btn-ghost" onClick={() => setModal(null)}>Cancelar</button><button className="vf-btn vf-btn-glow" onClick={doCampaign} disabled={loading||!campaignName.trim()}>{loading?<><I.Loader {...sz(16)} className="vf-spin" /> Creando...</>:<><I.Zap {...sz(16)} /> Lanzar</>}</button></div>
        </div>
      </div>
    )
    if (modal==="editcampaign" && editCampId) return (
      <div className="vf-overlay" onClick={e => e.target===e.currentTarget && setModal(null)}>
        <div className="vf-modal">
          <div className="vf-modal-h"><h2 style={{ fontSize:18,fontWeight:800,display:"flex",alignItems:"center",gap:8 }}><I.Edit {...sz(20)} style={{ color:"var(--acc)" }} /> Editar Campaña</h2><button className="vf-modal-x" onClick={() => setModal(null)}><I.X {...sz(18)} /></button></div>
          <div className="vf-modal-b">
            <div className="vf-form-g"><label className="vf-label">Nombre</label><input className="vf-input" value={campaignName} onChange={e => setCampaignName(e.target.value)} /></div>
            <div className="vf-form-g"><label className="vf-label">Idea</label><textarea className="vf-ta" rows={3} value={campaignIdea} onChange={e => setCampaignIdea(e.target.value)} /></div>
            <div className="vf-form-grid2">
              <div className="vf-form-g"><label className="vf-label">Videos</label><select className="vf-input" value={mcVideos} onChange={e => setMcVideos(e.target.value)}><option value="10">10</option><option value="20">20</option><option value="50">50</option><option value="100">100</option></select></div>
              <div className="vf-form-g"><label className="vf-label">Duración</label><select className="vf-input" value={mcDur} onChange={e => setMcDur(e.target.value)}><option value="15">15s</option><option value="30">30s</option><option value="45">45s</option><option value="60">1min</option></select></div>
              <div className="vf-form-g"><label className="vf-label">Canal</label><select className="vf-input" value={mcChan} onChange={e => setMcChan(e.target.value)}>{channels.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}</select></div>
              <div className="vf-form-g"><label className="vf-label">Videos/día</label><select className="vf-input" value={mcPerDay} onChange={e => setMcPerDay(e.target.value)}><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option></select></div>
            </div>
          </div>
          <div className="vf-modal-f"><button className="vf-btn vf-btn-ghost" onClick={() => setModal(null)}>Cancelar</button><button className="vf-btn vf-btn-glow" onClick={doSaveEditCampaign}><I.Check {...sz(16)} /> Guardar</button></div>
        </div>
      </div>
    )
    if (modal==="editvideo" && detailVideo) return (
      <div className="vf-overlay" onClick={e => e.target===e.currentTarget && setModal(null)}>
        <div className="vf-modal" style={{ maxWidth:480 }}>
          <div className="vf-modal-h"><h2 style={{ fontSize:18,fontWeight:800,display:"flex",alignItems:"center",gap:8 }}><I.Edit {...sz(20)} style={{ color:"var(--acc)" }} /> Editar Video</h2><button className="vf-modal-x" onClick={() => setModal(null)}><I.X {...sz(18)} /></button></div>
          <div className="vf-modal-b">
            <div className="vf-form-g"><label className="vf-label">Título</label><input className="vf-input" value={editVideoTitle} onChange={e => setEditVideoTitle(e.target.value)} /></div>
            <div className="vf-form-g"><label className="vf-label">Descripción</label><textarea className="vf-ta" rows={4} value={editVideoDesc} onChange={e => setEditVideoDesc(e.target.value)} placeholder="Descripción del video para YouTube..." /></div>
          </div>
          <div className="vf-modal-f"><button className="vf-btn vf-btn-ghost" onClick={() => setModal(null)}>Cancelar</button><button className="vf-btn vf-btn-glow" onClick={doSaveEditVideo}><I.Check {...sz(16)} /> Guardar</button></div>
        </div>
      </div>
    )
    if (detailVideo) {
      const v=detailVideo, ch=getChannel(v.channel), st=STATUS_MAP[v.status]
      return (
        <div className="vf-overlay" onClick={e => e.target===e.currentTarget && setDetailVideo(null)}>
          <div className="vf-modal" style={{ maxWidth:520 }}>
            <div className="vf-modal-h"><h2 style={{ fontSize:15,fontWeight:700 }}>{v.title}</h2><button className="vf-modal-x" onClick={() => setDetailVideo(null)}><I.X {...sz(18)} /></button></div>
            <div className="vf-modal-b">
              <div style={{ background:`linear-gradient(135deg,${ch.color}10,${ch.color}25)`,borderRadius:12,padding:28,textAlign:"center",marginBottom:16 }}><span style={{ fontSize:44 }}>{ch.icon}</span><div style={{ fontSize:13,fontWeight:600,marginTop:6 }}>{ch.name}</div></div>
              <div className="vf-detail-g">
                <div className="vf-detail-i"><span className="vf-t3">Estado</span><span className="vf-badge" style={{ background:st.bg,color:st.color }}>{st.label}</span></div>
                <div className="vf-detail-i"><span className="vf-t3">Progreso</span><span className="vf-mono">{Math.round(liveProgress[v.id]||v.progress)}%</span></div>
                <div className="vf-detail-i"><span className="vf-t3">Duración</span><span className="vf-mono">{v.duration}</span></div>
                <div className="vf-detail-i"><span className="vf-t3">Programado</span><span>{v.scheduledAt}</span></div>
                <div className="vf-detail-i"><span className="vf-t3">Est. Views</span><span className="vf-mono" style={{ color:"var(--acc)" }}>{v.estimatedViews}</span></div>
                <div className="vf-detail-i"><span className="vf-t3">Views</span><span className="vf-mono">{v.views>0?fmt(v.views):"—"}</span></div>
              </div>
              <div style={{ marginTop:14 }}><label className="vf-label">Pipeline</label><div className="vf-detail-steps">{STEPS.map((s,i) => {
                const done = i <= (st?.order||0)
                return <div key={i} className="vf-detail-st" style={{ opacity:done?1:0.25 }}><span style={{ fontSize:16 }}>{s.icon}</span><span style={{ fontSize:9,fontWeight:600 }}>{s.label}</span>{done && <I.Check {...sz(8)} style={{ color:"#4ADE80" }} />}</div>
              })}</div></div>
            </div>
            <div className="vf-modal-f"><button className="vf-btn vf-btn-ghost" style={{ color:"#F87171" }} onClick={() => { deleteVideo(v.id); setDetailVideo(null) }}><I.Trash {...sz(14)} /> Eliminar</button><div style={{ flex:1 }} /><button className="vf-btn vf-btn-ghost" onClick={() => { setEditVideoTitle(v.title); setEditVideoDesc(v.description||""); setModal("editvideo") }}><I.Edit {...sz(14)} /> Editar</button><button className="vf-btn vf-btn-glow" onClick={() => { advanceVideo(v.id); setDetailVideo(null) }}><I.Play {...sz(14)} /> Avanzar</button></div>
          </div>
        </div>
      )
    }
    return null
  }

  // ═══════════════════════════════════════════════════════
  return (
    <>
      <style>{CSS}</style>
      <div className="vf-app">
        <aside className={`vf-side ${mobNav?"open":""}`}>
          <div className="vf-side-logo"><div className="vf-logo-ic"><I.Zap {...sz(20)} style={{ color:"#fff" }} /></div><div><div className="vf-logo-t">VideoForge</div><div className="vf-logo-s">Enterprise AI</div></div></div>
          <nav className="vf-side-nav">
            <div className="vf-nav-lbl">PLATAFORMA</div>
            {NAV.map(n => <div key={n.id} className={`vf-nav-i ${view===n.id?"active":""}`} onClick={() => {setView(n.id);setMobNav(false)}}><n.icon {...sz(18)} /><span>{n.label}</span>{n.badge && <span className="vf-nav-b">{n.badge}</span>}</div>)}
            <div className="vf-nav-lbl" style={{ marginTop:16 }}>CANALES</div>
            {channels.map(ch => <div key={ch.id} className="vf-nav-ch" onClick={() => { setFilterChannel(ch.id); setView("pipeline"); setMobNav(false) }}><span className="vf-nav-cd" style={{ background:ch.color }} /><span>{ch.icon} {ch.name}</span></div>)}
          </nav>
          <div className="vf-side-ft"><div className="vf-side-u"><div className="vf-av">A</div><div><div style={{ fontSize:13,fontWeight:600 }}>Alejandro</div><div className="vf-t3" style={{ fontSize:10 }}>Enterprise Plan</div></div></div></div>
        </aside>
        <main className="vf-main">
          <header className="vf-top">
            <div className="vf-top-l"><button className="vf-menu-b" onClick={() => setMobNav(!mobNav)}><I.Menu {...sz(20)} /></button><h2 className="vf-pg-t">{TITLES[view]}</h2></div>
            <div className="vf-top-r">
              <div className="vf-top-s"><I.Search {...sz(14)} style={{ color:"var(--t3)" }} /><input placeholder="Buscar..." value={search} onChange={e => { setSearch(e.target.value); if(view !== "pipeline") setView("pipeline") }} /></div>
              <button className="vf-icon-b" style={{ position:"relative" }}><I.Bell {...sz(18)} />{activeJobs > 0 && <span className="vf-notif">{activeJobs > 9 ? "9+" : activeJobs}</span>}</button>
              <button className="vf-btn vf-btn-glow" onClick={() => setModal("campaign")}><I.Plus {...sz(14)} /> Nueva Campaña</button>
            </div>
          </header>
          <div className="vf-ct">{renderView()}</div>
        </main>
        {mobNav && <div className="vf-mob-ov" onClick={() => setMobNav(false)} />}
        {renderModals()}
        {toasts.length > 0 && <div style={{ position:"fixed",bottom:24,right:24,zIndex:300,display:"flex",flexDirection:"column",gap:8 }}>{toasts.map(t => (
          <div key={t.id} style={{ background:t.type==="error"?"rgba(239,68,68,0.95)":"rgba(34,197,94,0.95)",color:"#fff",padding:"10px 18px",borderRadius:10,fontSize:13,fontWeight:600,boxShadow:"0 8px 24px rgba(0,0,0,0.4)",animation:"su .3s cubic-bezier(.4,0,.2,1)",display:"flex",alignItems:"center",gap:8 }}>
            {t.type==="error"?<I.X {...sz(14)} />:<I.Check {...sz(14)} />} {t.msg}
          </div>
        ))}</div>}
      </div>
    </>
  )
}

// ═══════════════════════════════════════════════════════════
// CSS
// ═══════════════════════════════════════════════════════════
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
:root{--bg0:#06060A;--bg1:#0C0C12;--bg2:#13131B;--bg3:#1A1A24;--bd:#1E1E2A;--bd2:#2A2A38;--t1:#F0F0F5;--t2:#9D9DB5;--t3:#5E5E76;--acc:#F97316;--acc2:#A855F7;--accg:rgba(249,115,22,0.12);--ok:#22C55E;--warn:#EAB308;--err:#EF4444;--info:#3B82F6}
*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Sora',sans-serif;background:var(--bg0);color:var(--t1);overflow-x:hidden;-webkit-font-smoothing:antialiased}
.vf-app{display:flex;min-height:100vh}
.vf-side{width:260px;background:var(--bg1);border-right:1px solid var(--bd);display:flex;flex-direction:column;position:fixed;top:0;left:0;bottom:0;z-index:100;transition:transform .25s cubic-bezier(.4,0,.2,1)}
.vf-side-logo{padding:20px;display:flex;align-items:center;gap:12px;border-bottom:1px solid var(--bd)}
.vf-logo-ic{width:38px;height:38px;border-radius:10px;background:linear-gradient(135deg,#F97316,#EA580C);display:flex;align-items:center;justify-content:center;box-shadow:0 0 24px rgba(249,115,22,.25)}
.vf-logo-t{font-size:18px;font-weight:800;background:linear-gradient(135deg,#F97316,#FBBF24);-webkit-background-clip:text;-webkit-text-fill-color:transparent;letter-spacing:-.5px}
.vf-logo-s{font-size:10px;color:var(--t3);font-weight:500;letter-spacing:.5px}
.vf-side-nav{padding:12px 10px;flex:1;overflow-y:auto}
.vf-nav-lbl{font-size:9px;font-weight:700;letter-spacing:1.5px;color:var(--t3);padding:12px 12px 6px;text-transform:uppercase}
.vf-nav-i{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:9px;cursor:pointer;transition:all .15s;color:var(--t2);font-size:13px;font-weight:500;margin-bottom:1px;border:1px solid transparent}
.vf-nav-i:hover{background:var(--bg2);color:var(--t1)}.vf-nav-i.active{background:var(--accg);color:var(--acc);border-color:rgba(249,115,22,.15)}
.vf-nav-b{margin-left:auto;background:var(--acc);color:#fff;font-size:10px;font-weight:700;padding:1px 6px;border-radius:8px;font-family:'JetBrains Mono',monospace}
.vf-nav-ch{display:flex;align-items:center;gap:8px;padding:6px 12px;font-size:12px;color:var(--t2);cursor:pointer;border-radius:6px}.vf-nav-ch:hover{background:var(--bg2)}
.vf-nav-cd{width:7px;height:7px;border-radius:50%;flex-shrink:0}
.vf-side-ft{padding:12px 16px;border-top:1px solid var(--bd)}.vf-side-u{display:flex;align-items:center;gap:10px}
.vf-av{width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,var(--acc),var(--acc2));display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;flex-shrink:0}
.vf-main{flex:1;margin-left:260px;min-height:100vh;display:flex;flex-direction:column}
.vf-top{height:60px;border-bottom:1px solid var(--bd);display:flex;align-items:center;justify-content:space-between;padding:0 24px;background:rgba(6,6,10,.85);backdrop-filter:blur(16px);position:sticky;top:0;z-index:50}
.vf-top-l{display:flex;align-items:center;gap:14px}.vf-top-r{display:flex;align-items:center;gap:10px}
.vf-pg-t{font-size:16px;font-weight:700;letter-spacing:-.3px}
.vf-menu-b{display:none;background:none;border:none;color:var(--t2);cursor:pointer}
.vf-top-s{display:flex;align-items:center;gap:8px;background:var(--bg2);border:1px solid var(--bd);border-radius:8px;padding:6px 12px}
.vf-top-s input{background:none;border:none;color:var(--t1);font-family:'Sora',sans-serif;font-size:12px;outline:none;width:140px}.vf-top-s input::placeholder{color:var(--t3)}
.vf-icon-b{background:var(--bg2);border:1px solid var(--bd);border-radius:8px;padding:7px;cursor:pointer;color:var(--t2);position:relative;transition:all .15s}.vf-icon-b:hover{border-color:var(--bd2);color:var(--t1)}
.vf-notif{position:absolute;top:-3px;right:-3px;background:var(--err);color:#fff;font-size:9px;font-weight:700;width:16px;height:16px;border-radius:50%;display:flex;align-items:center;justify-content:center}
.vf-ct{padding:24px;flex:1;max-width:1480px}
.vf-mob-ov{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.6);z-index:99}
.vf-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:9px;font-size:12px;font-weight:600;cursor:pointer;transition:all .15s;border:none;font-family:'Sora',sans-serif;white-space:nowrap}
.vf-btn-glow{background:linear-gradient(135deg,#F97316,#EA580C);color:#fff;box-shadow:0 0 16px rgba(249,115,22,.2)}.vf-btn-glow:hover{box-shadow:0 0 28px rgba(249,115,22,.4);transform:translateY(-1px)}.vf-btn-glow:disabled{opacity:.6;cursor:not-allowed;transform:none}
.vf-btn-ghost{background:transparent;color:var(--t2);border:1px solid var(--bd)}.vf-btn-ghost:hover{border-color:var(--bd2);color:var(--t1)}
.vf-btn-sm{padding:5px 10px;font-size:11px}.vf-btn-xl{width:100%;padding:14px;font-size:14px;justify-content:center;border-radius:12px}
.vf-card{background:var(--bg1);border:1px solid var(--bd);border-radius:14px;overflow:hidden}
.vf-card-h{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid var(--bd)}
.vf-card-t{font-size:13px;font-weight:700;display:flex;align-items:center;gap:8px}.vf-card-b{padding:12px 18px}
.vf-stats{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:20px}
.vf-stat{background:var(--bg1);border:1px solid var(--bd);border-radius:12px;padding:16px;transition:all .15s;animation:fu .4s ease both}
.vf-stat:hover{border-color:var(--bd2);transform:translateY(-2px)}
.vf-stat-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px}
.vf-stat-icon{width:34px;height:34px;border-radius:9px;display:flex;align-items:center;justify-content:center}
.vf-stat-ch{font-size:10px;font-weight:600;display:flex;align-items:center;gap:2px;font-family:'JetBrains Mono',monospace;color:#4ADE80}
.vf-stat-val{font-size:22px;font-weight:800;letter-spacing:-.5px;font-family:'JetBrains Mono',monospace}
.vf-stat-lbl{font-size:11px;color:var(--t3);font-weight:500}
@keyframes fu{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes spin{to{transform:rotate(360deg)}}.vf-spin{animation:spin 1s linear infinite}
.vf-grid2{display:grid;grid-template-columns:1fr 380px;gap:16px;margin-bottom:20px}
.vf-gen-hero{position:relative;border-radius:16px;overflow:hidden;margin-bottom:20px;border:1px solid rgba(249,115,22,.15)}
.vf-gen-bg{position:absolute;inset:0;background:linear-gradient(135deg,rgba(249,115,22,.06),rgba(168,85,247,.06))}
.vf-gen-ct{position:relative;padding:24px}.vf-gen-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px}
.vf-gen-title{font-size:16px;font-weight:700;display:flex;align-items:center;gap:8px}
.vf-gen-row{display:flex;gap:10px;margin-bottom:12px}
.vf-gen-in{flex:1;background:rgba(0,0,0,.4);border:1px solid rgba(249,115,22,.15);border-radius:10px;padding:12px 16px;color:var(--t1);font-size:13px;font-family:'Sora',sans-serif;outline:none;transition:all .15s}
.vf-gen-in:focus{border-color:var(--acc);box-shadow:0 0 0 3px var(--accg)}.vf-gen-in::placeholder{color:var(--t3)}
.vf-gen-sel{width:180px;background:rgba(0,0,0,.4);border:1px solid rgba(249,115,22,.15);border-radius:10px;padding:12px 14px;color:var(--t1);font-size:13px;font-family:'Sora',sans-serif;outline:none;cursor:pointer}
.vf-tags{display:flex;gap:8px;flex-wrap:wrap}
.vf-tag{background:rgba(0,0,0,.3);border:1px solid var(--bd);border-radius:7px;padding:5px 10px;font-size:11px;color:var(--t2);cursor:pointer;transition:all .15s;font-family:'Sora',sans-serif}
.vf-tag:hover{border-color:var(--acc);color:var(--acc)}.vf-tag.on{border-color:var(--acc);color:var(--acc);background:var(--accg)}
.vf-pulse{display:flex;align-items:center;gap:8px;font-size:11px;color:var(--ok);font-weight:600}
.vf-pulse-dot{width:8px;height:8px;border-radius:50%;background:var(--ok);position:relative}
.vf-pulse-dot::after{content:'';position:absolute;top:-3px;left:-3px;width:14px;height:14px;border-radius:50%;background:rgba(34,197,94,.3);animation:pls 2s ease-in-out infinite}
@keyframes pls{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.6);opacity:0}}
.vf-row{display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid rgba(30,30,42,.5);cursor:pointer;transition:background .1s}
.vf-row:last-child{border-bottom:none}.vf-row:hover{background:var(--bg2);margin:0 -18px;padding-left:18px;padding-right:18px;border-radius:8px}
.vf-thumb{width:52px;height:30px;border-radius:6px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.vf-row-info{flex:1;min-width:0}.vf-row-title{font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.vf-row-meta{font-size:11px;color:var(--t3);display:flex;align-items:center;gap:6px;margin-top:2px}
.vf-bar-w{width:80px;height:4px;background:var(--bg3);border-radius:2px;overflow:hidden;flex-shrink:0}
.vf-bar-f{height:100%;border-radius:2px;transition:width .5s ease}
.vf-badge{font-size:10px;font-weight:600;padding:3px 8px;border-radius:6px;white-space:nowrap;font-family:'JetBrains Mono',monospace}
.vf-mono{font-family:'JetBrains Mono',monospace}.vf-t2{color:var(--t2)}.vf-t3{color:var(--t3)}
.vf-ch-row{display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid rgba(30,30,42,.5)}.vf-ch-row:last-child{border-bottom:none}
.vf-ch-av{width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0}
.vf-ch-info{flex:1}.vf-ch-name{font-size:13px;font-weight:600}.vf-ch-stats{font-size:11px;color:var(--t3);font-family:'JetBrains Mono',monospace;margin-top:1px}
.vf-log-r{display:flex;align-items:center;gap:8px;padding:6px 0;font-size:12px}
.vf-log-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0}.vf-log-t{color:var(--t3);font-family:'JetBrains Mono',monospace;font-size:10px;flex-shrink:0}.vf-log-m{color:var(--t2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.vf-sys{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}.vf-sys-i{display:flex;align-items:center;gap:6px;background:var(--bg1);border:1px solid var(--bd);border-radius:8px;padding:6px 12px;font-size:11px}
.vf-sys-l{color:var(--t2);font-weight:500}.vf-sys-s{font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:600}
.vf-toolbar{display:flex;align-items:center;gap:10px;margin-bottom:16px;flex-wrap:wrap}
.vf-search-w{display:flex;align-items:center;gap:8px;background:var(--bg2);border:1px solid var(--bd);border-radius:8px;padding:6px 12px}
.vf-search-i{background:none;border:none;color:var(--t1);font-family:'Sora',sans-serif;font-size:12px;outline:none;width:160px}.vf-search-i::placeholder{color:var(--t3)}
.vf-sel{background:var(--bg2);border:1px solid var(--bd);border-radius:8px;padding:6px 12px;color:var(--t1);font-size:12px;font-family:'Sora',sans-serif;outline:none;cursor:pointer}
.vf-steps{display:flex;gap:10px;overflow-x:auto;padding:8px 0}
.vf-step{border:1px solid;border-radius:12px;padding:14px 18px;min-width:130px;text-align:center;position:relative;flex-shrink:0}
.vf-step-arr{position:absolute;right:-12px;top:50%;transform:translateY(-50%);color:var(--t3)}
.vf-camp-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:14px}
.vf-camp{background:var(--bg1);border:1px solid var(--bd);border-radius:14px;padding:18px}
.vf-camp-head{display:flex;align-items:center;gap:12px;margin-bottom:14px}.vf-camp-prog{}.vf-camp-bar{height:6px;background:var(--bg3);border-radius:3px;overflow:hidden}
.vf-ch-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px}
.vf-ch-full{background:var(--bg1);border:1px solid var(--bd);border-radius:14px;overflow:hidden}
.vf-ch-banner{height:80px;display:flex;align-items:center;justify-content:center}.vf-ch-body{padding:16px}
.vf-ch-metrics{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-top:8px}
.vf-ch-m{text-align:center}.vf-ch-mv{font-size:14px;font-weight:700;font-family:'JetBrains Mono',monospace;display:block}.vf-ch-ml{font-size:9px;color:var(--t3);text-transform:uppercase;letter-spacing:.5px}
.vf-sched-h{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin-bottom:6px}
.vf-sched-dl{text-align:center;font-size:10px;font-weight:600;color:var(--t3);text-transform:uppercase;letter-spacing:1px;padding:6px}
.vf-sched-g{display:grid;grid-template-columns:repeat(7,1fr);gap:6px}
.vf-sched-c{background:var(--bg2);border:1px solid var(--bd);border-radius:8px;padding:8px;min-height:60px}.vf-sched-c.dim{opacity:.3}
.vf-sched-n{font-size:11px;font-weight:600;color:var(--t3);display:block;margin-bottom:4px}
.vf-sched-dots{display:flex;flex-wrap:wrap;gap:2px}.vf-sched-dot{width:6px;height:6px;border-radius:50%;display:inline-block}
.vf-sched-leg{display:flex;gap:14px;margin-top:14px;flex-wrap:wrap}.vf-sched-li{display:flex;align-items:center;gap:6px;font-size:11px;color:var(--t2)}
.vf-an-row{display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid rgba(30,30,42,.5)}.vf-an-row:last-child{border-bottom:none}
.vf-an-lbl{display:flex;align-items:center;gap:8px;min-width:130px;font-size:13px;font-weight:500}
.vf-an-track{flex:1;height:8px;background:var(--bg3);border-radius:4px;overflow:hidden}.vf-an-fill{height:100%;border-radius:4px;transition:width .5s}
.vf-terminal{background:var(--bg0);border-radius:8px;padding:16px;font-family:'JetBrains Mono',monospace;font-size:12px;max-height:500px;overflow-y:auto}
.vf-log-line{padding:4px 0;display:flex;gap:8px;color:var(--t2)}.vf-log-tf{color:var(--t3)}.vf-cursor{color:var(--acc);animation:blink 1s step-end infinite}
@keyframes blink{50%{opacity:0}}
.vf-stabs{display:flex;gap:6px;margin-bottom:16px}
.vf-stab{background:var(--bg2);border:1px solid var(--bd);border-radius:8px;padding:8px 14px;font-size:12px;font-weight:600;color:var(--t2);cursor:pointer;font-family:'Sora',sans-serif;display:flex;align-items:center;gap:6px;transition:all .15s}
.vf-stab:hover{border-color:var(--bd2);color:var(--t1)}.vf-stab.on{background:var(--accg);border-color:rgba(249,115,22,.2);color:var(--acc)}
.vf-set-row{display:flex;align-items:center;gap:14px;padding:12px 0;border-bottom:1px solid rgba(30,30,42,.5)}.vf-set-row:last-child{border-bottom:none}
.vf-toggle{width:42px;height:22px;background:var(--bg3);border-radius:11px;cursor:pointer;position:relative;transition:all .2s;border:1px solid var(--bd);flex-shrink:0}
.vf-toggle.on{background:var(--acc);border-color:var(--acc)}
.vf-toggle-k{width:16px;height:16px;background:#fff;border-radius:50%;position:absolute;top:2px;left:2px;transition:all .2s}.vf-toggle.on .vf-toggle-k{left:22px}
.vf-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.7);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;z-index:200;animation:fi .2s ease}
@keyframes fi{from{opacity:0}to{opacity:1}}@keyframes su{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
.vf-modal{background:var(--bg1);border:1px solid var(--bd);border-radius:18px;width:640px;max-height:85vh;overflow-y:auto;animation:su .3s cubic-bezier(.4,0,.2,1)}
.vf-modal-h{display:flex;align-items:center;justify-content:space-between;padding:20px 24px;border-bottom:1px solid var(--bd)}
.vf-modal-x{background:none;border:none;color:var(--t3);cursor:pointer;padding:4px;border-radius:8px;transition:all .15s}.vf-modal-x:hover{background:var(--bg2);color:var(--t1)}
.vf-modal-b{padding:20px 24px}.vf-modal-f{display:flex;justify-content:flex-end;gap:10px;padding:16px 24px;border-top:1px solid var(--bd)}
.vf-form-g{margin-bottom:16px}.vf-label{display:block;font-size:12px;font-weight:600;color:var(--t2);margin-bottom:6px}
.vf-input,.vf-ta{width:100%;background:var(--bg2);border:1px solid var(--bd);border-radius:10px;padding:10px 14px;color:var(--t1);font-size:13px;font-family:'Sora',sans-serif;outline:none;transition:all .15s}
.vf-input:focus,.vf-ta:focus{border-color:var(--acc);box-shadow:0 0 0 3px var(--accg)}
.vf-ta{min-height:80px;resize:vertical}
.vf-form-grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.vf-form-grid4{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:12px;margin-bottom:16px}
.vf-niche-g{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.vf-niche{background:var(--bg2);border:2px solid var(--bd);border-radius:10px;padding:12px;cursor:pointer;text-align:center;transition:all .15s}
.vf-niche:hover{border-color:var(--bd2)}.vf-niche.sel{border-color:var(--acc);background:var(--accg)}
.vf-detail-g{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}
.vf-detail-i{background:var(--bg2);border-radius:8px;padding:10px;display:flex;flex-direction:column;gap:4px;font-size:13px}
.vf-detail-steps{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}
.vf-detail-st{display:flex;flex-direction:column;align-items:center;gap:2px;padding:6px 8px;border-radius:8px;background:var(--bg2);min-width:50px}
::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:var(--bd);border-radius:3px}::-webkit-scrollbar-thumb:hover{background:var(--bd2)}
@media(max-width:1200px){.vf-stats{grid-template-columns:repeat(3,1fr)}.vf-grid2{grid-template-columns:1fr}.vf-form-grid4{grid-template-columns:1fr 1fr}.vf-ch-metrics{grid-template-columns:repeat(3,1fr)}}
@media(max-width:768px){.vf-side{transform:translateX(-260px)}.vf-side.open{transform:translateX(0)}.vf-main{margin-left:0!important}.vf-menu-b{display:block}.vf-stats{grid-template-columns:1fr 1fr}.vf-niche-g{grid-template-columns:repeat(2,1fr)}.vf-form-grid2,.vf-form-grid4{grid-template-columns:1fr}.vf-ct{padding:16px}.vf-sched-g,.vf-sched-h{grid-template-columns:repeat(4,1fr)}.vf-gen-row{flex-direction:column}.vf-gen-sel{width:100%}.vf-top-s{display:none}.vf-camp-grid,.vf-ch-grid{grid-template-columns:1fr}}
`
