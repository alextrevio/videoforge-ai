'use client'
import React, { useState, useEffect, useMemo } from 'react'
import { useApp } from '@/lib/context'
import { STATUS_MAP, NICHES, PIPELINE_STEPS, PLATFORMS, Platform, VideoStatus, VideoItem, fmtDur } from '@/lib/store'

// ── Icons (Lucide-style inline SVGs) ────────────────────
const sv = (d: string, s=18) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><path d={d}/></svg>
const I = {
  Spark: (s=18) => sv('M13 2L3 14h9l-1 8 10-12h-9l1-8',s),
  Layers: (s=18) => sv('M12 2L2 7l10 5 10-5-10-5M2 17l10 5 10-5M2 12l10 5 10-5',s),
  Calendar: (s=18) => sv('M19 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2M16 2v4M8 2v4M3 10h18',s),
  Tv: (s=18) => sv('M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2M17 2l-5 5-5-5',s),
  Settings: (s=18) => sv('M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z',s),
  Plus: (s=18) => sv('M12 5v14M5 12h14',s),
  Trash: (s=18) => sv('M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2',s),
  Check: (s=18) => sv('M20 6L9 17l-5-5',s),
  X: (s=18) => sv('M18 6L6 18M6 6l12 12',s),
  Play: (s=18) => sv('M5 3l14 9-14 9V3z',s),
  Search: (s=18) => sv('M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',s),
  Menu: (s=18) => sv('M3 12h18M3 6h18M3 18h18',s),
  Right: (s=18) => sv('M9 18l6-6-6-6',s),
  Zap: (s=18) => sv('M13 2L3 14h9l-1 8 10-12h-9l1-8',s),
  Edit: (s=18) => sv('M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7',s),
  Send: (s=18) => sv('M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z',s),
  Clock: (s=18) => sv('M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2',s),
  Loader: (s=18) => sv('M21 12a9 9 0 11-6.219-8.56',s),
}

interface VFProps { user: { id: string; email: string; name: string }; onLogout: () => void }

export default function VideoForgeApp({ user, onLogout }: VFProps) {
  const app = useApp()
  const { channels, videos, settings,
    addChannel, updateChannel, deleteChannel,
    addVideo, updateVideo, deleteVideo, advanceVideo, publishVideo,
    generateVideos, updateSettings, resetAll
  } = app

  const [view, setView] = useState('create')
  const [mobNav, setMobNav] = useState(false)
  const [modal, setModal] = useState<string|null>(null)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterChannel, setFilterChannel] = useState('all')
  const [liveProgress, setLiveProgress] = useState<Record<string,number>>({})

  // Generator state
  const [genIdea, setGenIdea] = useState('')
  const [genChan, setGenChan] = useState('')
  const [genCount, setGenCount] = useState(10)
  const [genDur, setGenDur] = useState('60')
  const [genPerDay, setGenPerDay] = useState(3)
  const [genPlatforms, setGenPlatforms] = useState<Platform[]>(['youtube'])
  const [loading, setLoading] = useState(false)

  // New channel state
  const [ncName, setNcName] = useState('')
  const [ncPlatform, setNcPlatform] = useState<Platform>('youtube')
  const [ncNiche, setNcNiche] = useState('')
  const [ncIcon, setNcIcon] = useState('')
  const [ncAutopilot, setNcAutopilot] = useState(true)
  const [ncIdea, setNcIdea] = useState('')
  const [ncPerDay, setNcPerDay] = useState(3)
  const [ncDur, setNcDur] = useState('60')

  // Detail
  const [detailVid, setDetailVid] = useState<VideoItem|null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editTime, setEditTime] = useState('')

  // Toast
  const [toasts, setToasts] = useState<{id:string;msg:string}[]>([])
  const toast = (msg:string) => {
    const id = Math.random().toString(36).slice(2)
    setToasts(p=>[...p,{id,msg}])
    setTimeout(()=>setToasts(p=>p.filter(t=>t.id!==id)),3000)
  }

  // Auto-select first channel when available / cleanup dead genChan
  useEffect(() => {
    if (channels.length > 0) {
      if (!genChan || !channels.find(c => c.id === genChan)) setGenChan(channels[0].id)
    } else {
      setGenChan('')
    }
  }, [channels, genChan])

  // Live progress tick
  useEffect(() => {
    const iv = setInterval(() => {
      setLiveProgress(p => {
        const n = { ...p }
        videos.forEach(v => {
          if (v.status !== 'published' && v.status !== 'scheduled' && v.status !== 'review')
            n[v.id] = Math.min((n[v.id] || v.progress) + Math.random() * 0.5, 96)
        })
        return n
      })
    }, 3000)
    return () => clearInterval(iv)
  }, [videos])

  // ESC
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') { setModal(null); setDetailVid(null) } }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  // Helpers
  const getChannel = (id: string) => channels.find(c => c.id === id)
  const activeJobs = videos.filter(v => v.status !== 'published').length
  const filteredVideos = useMemo(() => {
    let v = [...videos]
    if (filterStatus !== 'all') v = v.filter(x => x.status === filterStatus)
    if (filterChannel !== 'all') v = v.filter(x => x.channelId === filterChannel)
    if (search) v = v.filter(x => x.title.toLowerCase().includes(search.toLowerCase()))
    return v.sort((a,b) => {
      const oa = STATUS_MAP[a.status]?.order ?? 99
      const ob = STATUS_MAP[b.status]?.order ?? 99
      return oa - ob
    })
  }, [videos, filterStatus, filterChannel, search])

  // Actions
  const doGenerate = () => {
    if (!genIdea.trim() || !genChan) return
    setLoading(true)
    setTimeout(() => {
      generateVideos(genIdea, genChan, genCount, genDur, genPerDay, genPlatforms as string[])
      toast(`✅ ${genCount} videos creados`)
      setLoading(false)
      setGenIdea('')
      setView('videos')
    }, 1200)
  }

  const doAddChannel = () => {
    if (!ncName.trim() || !ncNiche) return
    const niche = NICHES.find(n => n.id === ncNiche)
    const ch = addChannel({
      name: ncName, platform: ncPlatform, niche: ncNiche,
      icon: ncIcon || niche?.icon || '📺', color: niche?.color || '#666',
      autopilot: ncAutopilot, autopilotIdea: ncIdea,
      autopilotPerDay: ncPerDay, autopilotDuration: ncDur,
      autopilotPlatforms: [ncPlatform],
    })
    setGenChan(ch.id)
    toast(`📺 Canal "${ncName}" creado${ncAutopilot ? ' con Autopilot 🤖' : ''}`)
    setNcName(''); setNcNiche(''); setNcIcon(''); setNcIdea(''); setNcAutopilot(true); setModal(null)
  }

  const doSaveEdit = () => {
    if (!detailVid) return
    updateVideo(detailVid.id, { title: editTitle, description: editDesc, scheduledDate: editDate, scheduledTime: editTime })
    toast('💾 Video guardado')
    setDetailVid(null)
  }

  const doAdvance = () => {
    if (!detailVid) return
    advanceVideo(detailVid.id)
    toast('⏩ Video avanzado al siguiente paso')
    setDetailVid(null)
  }

  const doPublish = () => {
    if (!detailVid) return
    publishVideo(detailVid.id)
    toast('🚀 Video publicado')
    setDetailVid(null)
  }

  const doDeleteVideo = () => {
    if (!detailVid) return
    deleteVideo(detailVid.id)
    toast('🗑️ Video eliminado')
    setDetailVid(null)
  }

  const openDetail = (v: VideoItem) => {
    setDetailVid(v); setEditTitle(v.title); setEditDesc(v.description)
    setEditDate(v.scheduledDate); setEditTime(v.scheduledTime)
  }

  // ═══════════════════════════════════════════════════════
  // VIEWS
  // ═══════════════════════════════════════════════════════

  // ── CREATE ────────────────────────────────────────────
  const renderCreate = () => (
    <>
      {/* Stats */}
      <div style={{display:'flex',gap:10,marginBottom:20,flexWrap:'wrap'}}>
        {[{v:videos.length,l:'Videos',c:'#F97316',i:'🎬'},{v:activeJobs,l:'En proceso',c:'#8B5CF6',i:'⚡'},{v:videos.filter(v=>v.status==='published').length,l:'Publicados',c:'#22C55E',i:'✅'},{v:channels.length,l:'Canales',c:'#3B82F6',i:'📺'}].map((s,i)=>
        <div key={i} style={{display:'flex',alignItems:'center',gap:8,background:'var(--bg1)',border:'1px solid var(--bd)',borderRadius:10,padding:'10px 16px',flex:1,minWidth:130}}>
          <span style={{fontSize:18}}>{s.i}</span>
          <div><div style={{fontSize:18,fontWeight:800,color:s.c,fontFamily:"'JetBrains Mono',monospace"}}>{s.v}</div><div style={{fontSize:10,color:'var(--t3)'}}>{s.l}</div></div>
        </div>)}
      </div>

      {channels.length === 0 ? (
        // Onboarding: no channels yet
        <div style={{background:'var(--bg1)',border:'1px solid var(--bd)',borderRadius:16,padding:40,textAlign:'center'}}>
          <div style={{fontSize:48,marginBottom:12}}>📺</div>
          <h2 style={{fontSize:20,fontWeight:800,marginBottom:8}}>Crea tu primer canal</h2>
          <p style={{color:'var(--t2)',fontSize:14,marginBottom:20,maxWidth:400,margin:'0 auto 20px'}}>Para empezar a generar videos, primero agrega el canal donde se publicarán.</p>
          <button className="vf-btn vf-btn-glow" style={{fontSize:14,padding:'12px 28px'}} onClick={() => setModal('channel')}>{I.Plus(16)} Crear Canal</button>
        </div>
      ) : (
        // Generator
        <div style={{position:'relative',borderRadius:16,overflow:'hidden',border:'1px solid rgba(249,115,22,0.15)'}}>
          <div style={{position:'absolute',inset:0,background:'linear-gradient(135deg,rgba(249,115,22,0.05),rgba(168,85,247,0.05))'}} />
          <div style={{position:'relative',padding:28}}>
            {/* Step 1 */}
            <div style={{marginBottom:20}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                <span style={{background:'var(--acc)',color:'#fff',width:26,height:26,borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:800}}>1</span>
                <span style={{fontSize:16,fontWeight:700}}>¿De qué quieres hacer videos?</span>
              </div>
              <textarea className="vf-ta" rows={3} value={genIdea} onChange={e=>setGenIdea(e.target.value)} placeholder="Ej: 'Los 10 inventos más locos de la historia, con animaciones y narración épica'" style={{fontSize:14}} />
            </div>

            {/* Step 2 */}
            <div style={{marginBottom:20}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                <span style={{background:'var(--acc2)',color:'#fff',width:26,height:26,borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:800}}>2</span>
                <span style={{fontSize:16,fontWeight:700}}>Configura</span>
              </div>
              <div className="vf-form-grid4">
                <div className="vf-form-g"><label className="vf-label">Canal</label>
                  <select className="vf-input" value={genChan} onChange={e=>{if(e.target.value==='new')setModal('channel');else setGenChan(e.target.value)}}>
                    <option value="">Seleccionar...</option>
                    {channels.map(c=><option key={c.id} value={c.id}>{PLATFORMS[c.platform].icon} {c.name}</option>)}
                    <option value="new">+ Nuevo canal</option>
                  </select>
                </div>
                <div className="vf-form-g"><label className="vf-label">Cuántos videos</label>
                  <select className="vf-input" value={genCount} onChange={e=>setGenCount(Number(e.target.value))}>
                    {[5,10,20,50,100].map(n=><option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div className="vf-form-g"><label className="vf-label">Duración</label>
                  <select className="vf-input" value={genDur} onChange={e=>setGenDur(e.target.value)}>
                    <option value="30">30 seg</option><option value="45">45 seg</option>
                    <option value="60">1 minuto</option><option value="90">1:30 min</option>
                  </select>
                </div>
                <div className="vf-form-g"><label className="vf-label">Videos / día</label>
                  <select className="vf-input" value={genPerDay} onChange={e=>setGenPerDay(Number(e.target.value))}>
                    {[1,2,3,4,5].map(n=><option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Step 3: Platforms */}
            <div style={{marginBottom:24}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                <span style={{background:'var(--ok)',color:'#fff',width:26,height:26,borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:800}}>3</span>
                <span style={{fontSize:16,fontWeight:700}}>¿Dónde publicar?</span>
              </div>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                {(Object.entries(PLATFORMS) as [Platform, typeof PLATFORMS[Platform]][]).map(([k,p]) => {
                  const on = genPlatforms.includes(k)
                  return <button key={k} onClick={()=>setGenPlatforms(prev=>on?prev.filter(x=>x!==k):[...prev,k])}
                    style={{display:'flex',alignItems:'center',gap:8,padding:'10px 18px',borderRadius:10,border:`2px solid ${on?p.color:'var(--bd)'}`,background:on?`${p.color}15`:'var(--bg2)',color:on?p.color:'var(--t2)',cursor:'pointer',fontFamily:'inherit',fontSize:13,fontWeight:600,transition:'all .15s'}}>
                    <span style={{fontSize:20}}>{p.icon}</span>{p.label}
                  </button>
                })}
              </div>
            </div>

            {/* Generate */}
            <button className="vf-btn vf-btn-glow" style={{width:'100%',padding:16,fontSize:15,justifyContent:'center',borderRadius:12}} onClick={doGenerate} disabled={loading||!genIdea.trim()||!genChan}>
              {loading ? <><span style={{display:'inline-flex',animation:'spin 1s linear infinite'}}>{I.Loader(20)}</span> Generando {genCount} videos...</> : <>{I.Zap(20)} Crear {genCount} Videos de {fmtDur(genDur)}</>}
            </button>
          </div>
        </div>
      )}

      {/* Pipeline preview */}
      {videos.filter(v=>v.status!=='published').length > 0 && <div className="vf-card" style={{marginTop:20}}>
        <div className="vf-card-h"><span className="vf-card-t">{I.Layers(16)} Videos en proceso ({activeJobs})</span>
          <button className="vf-btn vf-btn-sm vf-btn-ghost" onClick={()=>setView('videos')}>Ver todos {I.Right(12)}</button>
        </div>
        <div className="vf-card-b">{videos.filter(v=>v.status!=='published').slice(0,5).map(v=>{
          const ch=getChannel(v.channelId),st=STATUS_MAP[v.status],pr=liveProgress[v.id]||v.progress
          const stepIdx=st?.order??0
          return <div className="vf-row" key={v.id} onClick={()=>openDetail(v)} style={{cursor:'pointer'}}>
            <div style={{display:'flex',gap:2,minWidth:100}}>{PIPELINE_STEPS.map((s,i)=><span key={i} style={{fontSize:i===stepIdx?14:i<stepIdx?12:9,opacity:i<=stepIdx?1:0.15,transition:'all .3s'}} title={s.label}>{s.icon}</span>)}</div>
            <div className="vf-row-info" style={{flex:2}}><div className="vf-row-title">{v.title}</div><div className="vf-row-meta">{ch ? `${PLATFORMS[ch.platform].icon} ${ch.name}` : '—'} · {v.duration}</div></div>
            <div className="vf-bar-w" style={{width:80}}><div className="vf-bar-f" style={{width:`${pr}%`,background:st.color,transition:'width .5s'}}/></div>
            <span style={{fontSize:11,fontWeight:600,color:st.color,minWidth:85}}>{st.label}</span>
          </div>
        })}</div>
      </div>}

      {/* How it works */}
      <div className="vf-card" style={{marginTop:20}}>
        <div className="vf-card-h"><span className="vf-card-t">{I.Zap(16)} Cada video pasa por estas etapas automáticamente</span></div>
        <div className="vf-card-b"><div className="vf-steps">{PIPELINE_STEPS.map((s,i)=>
          <div key={i} className="vf-step" style={{borderColor:`${s.color}30`,background:`${s.color}08`}}>
            <div style={{fontSize:24,marginBottom:4}}>{s.icon}</div><div style={{fontSize:11,fontWeight:700}}>{s.label}</div><div style={{fontSize:9,color:'var(--t3)'}}>{s.desc}</div>
            {i<PIPELINE_STEPS.length-1&&<div className="vf-step-arr">{I.Right(10)}</div>}
          </div>
        )}</div></div>
      </div>
    </>
  )

  // ── VIDEOS (Pipeline) ─────────────────────────────────
  const renderVideos = () => (
    <>
      <div className="vf-toolbar">
        <div className="vf-search-w">{I.Search(14)}<input className="vf-search-i" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar..." /></div>
        <select className="vf-sel" value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}><option value="all">Todos los estados</option>{Object.entries(STATUS_MAP).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}</select>
        <select className="vf-sel" value={filterChannel} onChange={e=>setFilterChannel(e.target.value)}><option value="all">Todos los canales</option>{channels.map(c=><option key={c.id} value={c.id}>{PLATFORMS[c.platform].icon} {c.name}</option>)}</select>
        <div style={{flex:1}}/><span style={{fontSize:12,color:'var(--t3)'}}>{filteredVideos.length} videos</span>
        <button className="vf-btn vf-btn-glow" onClick={()=>setView('create')}>{I.Spark(14)} Crear Videos</button>
      </div>

      {/* Stage counters */}
      <div style={{display:'flex',gap:6,marginBottom:14,flexWrap:'wrap',overflowX:'auto'}}>{PIPELINE_STEPS.map(s=>{
        const c=videos.filter(v=>v.status===s.key).length
        return <div key={s.key} style={{display:'flex',alignItems:'center',gap:5,background:'var(--bg1)',border:'1px solid var(--bd)',borderRadius:7,padding:'5px 10px',fontSize:11,whiteSpace:'nowrap',cursor:'pointer',opacity:c>0?1:0.4}} onClick={()=>setFilterStatus(filterStatus===s.key?'all':s.key)}>
          <span style={{fontSize:14}}>{s.icon}</span><span style={{fontWeight:600}}>{s.label}</span><span style={{fontWeight:700,color:s.color,fontFamily:"'JetBrains Mono',monospace"}}>{c}</span>
        </div>
      })}</div>

      <div className="vf-card"><div className="vf-card-b">
        {filteredVideos.length > 0 ? filteredVideos.map(v=>{
          const ch=getChannel(v.channelId),st=STATUS_MAP[v.status],pr=liveProgress[v.id]||v.progress
          const stepIdx=st?.order??0
          return <div className="vf-row" key={v.id} onClick={()=>openDetail(v)} style={{cursor:'pointer',padding:'10px 0'}}>
            <div style={{display:'flex',gap:2,minWidth:110}}>{PIPELINE_STEPS.map((s,i)=><span key={i} style={{fontSize:i===stepIdx?14:i<stepIdx?12:9,opacity:i<=stepIdx?1:0.12,transition:'all .3s',filter:i===stepIdx?`drop-shadow(0 0 3px ${st.color})`:''}} title={s.label}>{s.icon}</span>)}</div>
            <div className="vf-row-info" style={{flex:2}}><div className="vf-row-title">{v.title}</div><div className="vf-row-meta">{ch?`${PLATFORMS[ch.platform].icon} ${ch.name}`:'—'} · {v.duration} {v.scheduledDate && `· ${v.scheduledDate} ${v.scheduledTime}`}</div></div>
            <div style={{display:'flex',gap:3}}>{v.platforms.map(p=><span key={p} title={PLATFORMS[p].label} style={{fontSize:12}}>{PLATFORMS[p].icon}</span>)}</div>
            <div className="vf-bar-w" style={{width:70}}><div className="vf-bar-f" style={{width:`${pr}%`,background:st.color,transition:'width .5s'}}/></div>
            <span style={{fontSize:11,fontWeight:700,color:st.color,minWidth:85,textAlign:'center'}}>{st.label}</span>
          </div>
        }) : <div style={{textAlign:'center',padding:40,color:'var(--t3)'}}>
          {videos.length===0?'No hay videos aún. ':'No hay videos con estos filtros. '}
          <button onClick={()=>setView('create')} style={{background:'none',border:'none',color:'var(--acc)',cursor:'pointer',fontWeight:700,fontFamily:'inherit',fontSize:13}}>Crear Videos →</button>
        </div>}
      </div></div>
    </>
  )

  // ── CALENDAR ──────────────────────────────────────────
  const renderCalendar = () => {
    const days = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom']
    // Get current month
    const now = new Date()
    const year = now.getFullYear(), month = now.getMonth()
    const firstDay = new Date(year, month, 1).getDay() // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const offset = firstDay === 0 ? 6 : firstDay - 1 // Mon=0
    const monthName = now.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })

    // Group videos by date
    const byDate: Record<string, VideoItem[]> = {}
    videos.forEach(v => {
      if (v.scheduledDate) {
        if (!byDate[v.scheduledDate]) byDate[v.scheduledDate] = []
        byDate[v.scheduledDate].push(v)
      }
    })

    return <>
      <div className="vf-toolbar"><h3 style={{fontSize:15,fontWeight:700,textTransform:'capitalize'}}>{monthName}</h3><div style={{flex:1}}/><button className="vf-btn vf-btn-glow" onClick={()=>setView('create')}>{I.Plus(14)} Crear Videos</button></div>
      <div className="vf-card"><div className="vf-card-b">
        <div className="vf-sched-h">{days.map(d=><div key={d} className="vf-sched-dl">{d}</div>)}</div>
        <div className="vf-sched-g">{Array.from({length:42},(_,i)=>{
          const day = i - offset + 1
          const ok = day >= 1 && day <= daysInMonth
          const dateStr = ok ? `${year}-${(month+1).toString().padStart(2,'0')}-${day.toString().padStart(2,'0')}` : ''
          const dayVids = ok ? (byDate[dateStr] || []) : []
          const isToday = ok && day === now.getDate()
          return <div key={i} className={`vf-sched-c ${ok?'':'dim'}`} style={isToday?{border:'1px solid var(--acc)'}:{}}>
            {ok && <>
              <span className="vf-sched-n" style={isToday?{color:'var(--acc)',fontWeight:700}:{}}>{day}</span>
              <div className="vf-sched-dots">{dayVids.slice(0,6).map((v,j)=>{
                const ch=getChannel(v.channelId)
                return <span key={j} className="vf-sched-dot" style={{background:ch?.color||'var(--t3)'}} title={`${v.title} (${v.scheduledTime})`} />
              })}</div>
              {dayVids.length>6&&<span style={{fontSize:8,color:'var(--t3)'}}>+{dayVids.length-6}</span>}
            </>}
          </div>
        })}</div>
        {channels.length>0&&<div className="vf-sched-leg">{channels.map(c=><div key={c.id} className="vf-sched-li"><span className="vf-sched-dot" style={{background:c.color}}/>{PLATFORMS[c.platform].icon} {c.name}</div>)}</div>}
      </div></div>

      {/* Upcoming list */}
      {videos.filter(v=>v.scheduledDate&&v.status!=='published').length>0&&<div className="vf-card" style={{marginTop:16}}>
        <div className="vf-card-h"><span className="vf-card-t">{I.Clock(16)} Próximos a publicar</span></div>
        <div className="vf-card-b">{videos.filter(v=>v.scheduledDate&&v.status!=='published').sort((a,b)=>`${a.scheduledDate}${a.scheduledTime}`.localeCompare(`${b.scheduledDate}${b.scheduledTime}`)).slice(0,10).map(v=>{
          const ch=getChannel(v.channelId),st=STATUS_MAP[v.status]
          return <div className="vf-row" key={v.id} onClick={()=>openDetail(v)} style={{cursor:'pointer'}}>
            <span style={{fontSize:12,color:'var(--t3)',minWidth:90,fontFamily:"'JetBrains Mono',monospace"}}>{v.scheduledDate}</span>
            <span style={{fontSize:12,color:'var(--t2)',minWidth:45,fontFamily:"'JetBrains Mono',monospace"}}>{v.scheduledTime}</span>
            <div className="vf-row-info"><div className="vf-row-title">{v.title}</div><div className="vf-row-meta">{ch?`${PLATFORMS[ch.platform].icon} ${ch.name}`:''}</div></div>
            <div style={{display:'flex',gap:2}}>{v.platforms.map(p=><span key={p} style={{fontSize:11}}>{PLATFORMS[p].icon}</span>)}</div>
            <span style={{fontSize:11,color:st.color,fontWeight:600}}>{st.label}</span>
          </div>
        })}</div>
      </div>}
    </>
  }

  // ── CHANNELS ──────────────────────────────────────────
  const renderChannels = () => (
    <>
      <div className="vf-toolbar"><h3 style={{fontSize:15,fontWeight:700}}>Mis Canales</h3><div style={{flex:1}}/><button className="vf-btn vf-btn-glow" onClick={()=>setModal('channel')}>{I.Plus(14)} Nuevo Canal</button></div>
      {channels.length===0?<div className="vf-card"><div className="vf-card-b" style={{textAlign:'center',padding:40,color:'var(--t3)'}}>
        <div style={{fontSize:40,marginBottom:8}}>📺</div>No tienes canales aún.<br/><button className="vf-btn vf-btn-glow" style={{marginTop:16}} onClick={()=>setModal('channel')}>{I.Plus(14)} Crear Canal</button>
      </div></div>:
      <div className="vf-ch-grid">{channels.map(ch=>{
        const vids=videos.filter(v=>v.channelId===ch.id)
        const published=vids.filter(v=>v.status==='published').length
        const pending=vids.length-published
        const niche=NICHES.find(n=>n.id===ch.niche)
        return <div className="vf-ch-full" key={ch.id}>
          <div className="vf-ch-banner" style={{background:`linear-gradient(135deg,${ch.color}20,${ch.color}40)`}}>
            <span style={{fontSize:40}}>{ch.icon}</span>
          </div>
          <div className="vf-ch-body">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'start',marginBottom:10}}>
              <div><h4 style={{fontSize:15,fontWeight:700}}>{ch.name}</h4><span style={{fontSize:11,color:'var(--t3)'}}>{PLATFORMS[ch.platform].icon} {PLATFORMS[ch.platform].label} · {niche?.label||ch.niche}</span></div>
              {ch.autopilot && <span style={{fontSize:10,fontWeight:700,padding:'3px 8px',borderRadius:6,background:'rgba(249,115,22,0.12)',color:'#F97316',display:'flex',alignItems:'center',gap:4}}>🤖 Autopilot</span>}
            </div>
            <div style={{display:'flex',gap:16,marginBottom:12}}>
              <div style={{textAlign:'center'}}><div style={{fontSize:18,fontWeight:800,fontFamily:"'JetBrains Mono',monospace"}}>{vids.length}</div><div style={{fontSize:9,color:'var(--t3)',textTransform:'uppercase'}}>Total</div></div>
              <div style={{textAlign:'center'}}><div style={{fontSize:18,fontWeight:800,fontFamily:"'JetBrains Mono',monospace",color:'#4ADE80'}}>{published}</div><div style={{fontSize:9,color:'var(--t3)',textTransform:'uppercase'}}>Publicados</div></div>
              <div style={{textAlign:'center'}}><div style={{fontSize:18,fontWeight:800,fontFamily:"'JetBrains Mono',monospace",color:'#8B5CF6'}}>{pending}</div><div style={{fontSize:9,color:'var(--t3)',textTransform:'uppercase'}}>En proceso</div></div>
              {ch.autopilot && <div style={{textAlign:'center'}}><div style={{fontSize:18,fontWeight:800,fontFamily:"'JetBrains Mono',monospace",color:'#F97316'}}>{ch.autopilotPerDay}</div><div style={{fontSize:9,color:'var(--t3)',textTransform:'uppercase'}}>Por día</div></div>}
            </div>
            {/* Autopilot toggle */}
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10,padding:'8px 10px',background:ch.autopilot?'rgba(249,115,22,0.06)':'var(--bg2)',borderRadius:8,border:`1px solid ${ch.autopilot?'rgba(249,115,22,0.15)':'var(--bd)'}`}}>
              <span style={{fontSize:14}}>🤖</span>
              <span style={{flex:1,fontSize:12,fontWeight:600,color:ch.autopilot?'var(--acc)':'var(--t3)'}}>Autopilot {ch.autopilot?'ON':'OFF'}</span>
              <div className={`vf-toggle ${ch.autopilot?'on':''}`} onClick={()=>updateChannel(ch.id,{autopilot:!ch.autopilot})}><div className="vf-toggle-k"/></div>
            </div>
            {ch.autopilot && ch.autopilotIdea && <div style={{fontSize:11,color:'var(--t3)',marginBottom:10,padding:'6px 10px',background:'var(--bg2)',borderRadius:6}}>
              Tema: <strong style={{color:'var(--t2)'}}>{ch.autopilotIdea}</strong> · {fmtDur(ch.autopilotDuration)}/video
            </div>}
            <div style={{display:'flex',gap:6}}>
              <button className="vf-btn vf-btn-sm vf-btn-glow" style={{flex:1}} onClick={()=>{setGenChan(ch.id);setView('create')}}>{I.Spark(12)} Crear Videos</button>
              <button className="vf-btn vf-btn-sm vf-btn-ghost" style={{flex:1}} onClick={()=>{setFilterChannel(ch.id);setView('videos')}}>{I.Layers(12)} Ver Videos</button>
              <button className="vf-btn vf-btn-sm vf-btn-ghost" style={{color:'#F87171'}} onClick={()=>{if(confirm(`¿Eliminar "${ch.name}"?`))deleteChannel(ch.id)}}>{I.Trash(12)}</button>
            </div>
          </div>
        </div>
      })}</div>}
    </>
  )

  // ── SETTINGS ──────────────────────────────────────────
  const renderSettings = () => (
    <div className="vf-card"><div className="vf-card-b">
      {[{k:'autoAdvance',l:'Auto-avance de pipeline',d:'Los videos avanzan automáticamente por las etapas'}].map(s=>
        <div className="vf-set-row" key={s.k}><div style={{flex:1}}><div style={{fontSize:13,fontWeight:600}}>{s.l}</div><div style={{fontSize:11,color:'var(--t3)'}}>{s.d}</div></div>
          <div className={`vf-toggle ${(settings as any)[s.k]?'on':''}`} onClick={()=>updateSettings({[s.k]:!(settings as any)[s.k]})}><div className="vf-toggle-k"/></div>
        </div>)}
      {[{k:'defaultDuration',l:'Duración por defecto',opts:[['30','30s'],['45','45s'],['60','1 min'],['90','1:30']]},{k:'lang',l:'Idioma',opts:[['es-MX','Español MX'],['en-US','English'],['pt-BR','Português']]},{k:'voice',l:'Voz',opts:[['mateo','Mateo'],['sofia','Sofía'],['carlos','Carlos']]}].map(s=>
        <div className="vf-set-row" key={s.k}><div style={{flex:1,fontSize:13,fontWeight:600}}>{s.l}</div>
          <select className="vf-sel" style={{width:160}} value={(settings as any)[s.k]} onChange={e=>updateSettings({[s.k]:e.target.value})}>{s.opts.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select>
        </div>)}
      <div className="vf-set-row" style={{borderTop:'2px solid var(--bd)',marginTop:12,paddingTop:16}}>
        <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:'#F87171'}}>Borrar todos los datos</div><div style={{fontSize:11,color:'var(--t3)'}}>Elimina canales, videos y configuración</div></div>
        <button className="vf-btn vf-btn-sm vf-btn-ghost" style={{color:'#F87171'}} onClick={()=>{if(confirm('¿Borrar TODOS los datos? No se puede deshacer.'))resetAll()}}>{I.Trash(12)} Borrar Todo</button>
      </div>
    </div></div>
  )

  // ── MODALS ────────────────────────────────────────────
  const renderModals = () => {
    if (modal==='channel') return (
      <div className="vf-overlay" onClick={e=>e.target===e.currentTarget&&setModal(null)}>
        <div className="vf-modal" style={{maxWidth:540}}>
          <div className="vf-modal-h"><h2 style={{fontSize:18,fontWeight:800}}>Nuevo Canal</h2><button className="vf-modal-x" onClick={()=>setModal(null)}>{I.X(18)}</button></div>
          <div className="vf-modal-b">
            <div className="vf-form-g"><label className="vf-label">Nombre del canal</label><input className="vf-input" value={ncName} onChange={e=>setNcName(e.target.value)} placeholder="Mi Canal" /></div>
            <div className="vf-form-g"><label className="vf-label">Plataforma</label>
              <div style={{display:'flex',gap:8}}>{(Object.entries(PLATFORMS) as [Platform, typeof PLATFORMS[Platform]][]).map(([k,p])=>
                <button key={k} onClick={()=>setNcPlatform(k)} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4,padding:'12px 8px',borderRadius:10,border:`2px solid ${ncPlatform===k?p.color:'var(--bd)'}`,background:ncPlatform===k?`${p.color}12`:'var(--bg2)',color:ncPlatform===k?p.color:'var(--t2)',cursor:'pointer',fontFamily:'inherit',fontSize:11,fontWeight:600,transition:'all .15s'}}>
                  <span style={{fontSize:22}}>{p.icon}</span>{p.label}
                </button>
              )}</div>
            </div>
            <div className="vf-form-g"><label className="vf-label">Nicho</label>
              <div className="vf-niche-g">{NICHES.map(n=>
                <div key={n.id} className={`vf-niche ${ncNiche===n.id?'sel':''}`} onClick={()=>{setNcNiche(n.id);if(!ncIcon)setNcIcon(n.icon)}}>
                  <span style={{fontSize:22}}>{n.icon}</span><span style={{fontSize:11,fontWeight:600}}>{n.label}</span>
                </div>
              )}</div>
            </div>

            {/* Autopilot Section */}
            <div style={{marginTop:8,padding:16,background:'rgba(249,115,22,0.04)',border:'1px solid rgba(249,115,22,0.12)',borderRadius:12}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:ncAutopilot?14:0}}>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <span style={{fontSize:20}}>🤖</span>
                  <div><div style={{fontSize:14,fontWeight:700}}>Autopilot</div><div style={{fontSize:11,color:'var(--t3)'}}>Genera y publica videos automáticamente todos los días</div></div>
                </div>
                <div className={`vf-toggle ${ncAutopilot?'on':''}`} onClick={()=>setNcAutopilot(!ncAutopilot)}><div className="vf-toggle-k"/></div>
              </div>
              {ncAutopilot && <>
                <div className="vf-form-g" style={{marginBottom:10}}><label className="vf-label">Tema general del canal</label>
                  <input className="vf-input" value={ncIdea} onChange={e=>setNcIdea(e.target.value)} placeholder="Ej: civilizaciones antiguas, misterios del océano, inventos locos..." />
                </div>
                <div className="vf-form-grid2">
                  <div className="vf-form-g" style={{marginBottom:0}}><label className="vf-label">Videos por día</label>
                    <select className="vf-input" value={ncPerDay} onChange={e=>setNcPerDay(Number(e.target.value))}>
                      {[1,2,3,4,5].map(n=><option key={n} value={n}>{n} video{n>1?'s':''}/día</option>)}
                    </select>
                  </div>
                  <div className="vf-form-g" style={{marginBottom:0}}><label className="vf-label">Duración</label>
                    <select className="vf-input" value={ncDur} onChange={e=>setNcDur(e.target.value)}>
                      <option value="30">30 seg</option><option value="45">45 seg</option>
                      <option value="60">1 minuto</option><option value="90">1:30 min</option>
                    </select>
                  </div>
                </div>
              </>}
            </div>
          </div>
          <div className="vf-modal-f"><button className="vf-btn vf-btn-ghost" onClick={()=>setModal(null)}>Cancelar</button><button className="vf-btn vf-btn-glow" onClick={doAddChannel} disabled={!ncName.trim()||!ncNiche}>{I.Plus(16)} Crear Canal</button></div>
        </div>
      </div>
    )

    if (detailVid) {
      const v=detailVid,ch=getChannel(v.channelId),st=STATUS_MAP[v.status],stepIdx=st?.order??0
      return (
        <div className="vf-overlay" onClick={e=>e.target===e.currentTarget&&setDetailVid(null)}>
          <div className="vf-modal" style={{maxWidth:560}}>
            <div className="vf-modal-h"><h2 style={{fontSize:15,fontWeight:700}}>Detalle del Video</h2><button className="vf-modal-x" onClick={()=>setDetailVid(null)}>{I.X(18)}</button></div>
            <div className="vf-modal-b">
              {/* Stage visual */}
              <div style={{display:'flex',gap:4,justifyContent:'center',marginBottom:16,padding:'12px 0',background:'var(--bg2)',borderRadius:10}}>
                {PIPELINE_STEPS.map((s,i)=><div key={i} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:2,padding:'4px 6px',opacity:i<=stepIdx?1:0.2,transition:'all .3s'}}>
                  <span style={{fontSize:i===stepIdx?22:16,filter:i===stepIdx?`drop-shadow(0 0 6px ${st.color})`:''}}>{s.icon}</span>
                  <span style={{fontSize:8,fontWeight:600}}>{s.label}</span>
                  {i<PIPELINE_STEPS.length-1&&i<stepIdx&&<span style={{color:'var(--ok)',fontSize:8}}>✓</span>}
                </div>)}
              </div>
              <div className="vf-form-g"><label className="vf-label">Título</label><input className="vf-input" value={editTitle} onChange={e=>setEditTitle(e.target.value)}/></div>
              <div className="vf-form-g"><label className="vf-label">Descripción</label><textarea className="vf-ta" rows={3} value={editDesc} onChange={e=>setEditDesc(e.target.value)} placeholder="Descripción para redes sociales..."/></div>
              <div className="vf-form-grid2">
                <div className="vf-form-g"><label className="vf-label">Fecha publicación</label><input className="vf-input" type="date" value={editDate} onChange={e=>setEditDate(e.target.value)}/></div>
                <div className="vf-form-g"><label className="vf-label">Hora</label><input className="vf-input" type="time" value={editTime} onChange={e=>setEditTime(e.target.value)}/></div>
              </div>
              <div className="vf-form-g"><label className="vf-label">Plataformas</label><div style={{display:'flex',gap:4}}>{v.platforms.map(p=><span key={p} style={{padding:'4px 10px',borderRadius:6,background:`${PLATFORMS[p].color}15`,color:PLATFORMS[p].color,fontSize:11,fontWeight:600}}>{PLATFORMS[p].icon} {PLATFORMS[p].label}</span>)}</div></div>
              <div style={{display:'flex',gap:6,fontSize:12,color:'var(--t3)',marginTop:8}}><span>Canal: {ch?`${PLATFORMS[ch.platform].icon} ${ch.name}`:'—'}</span><span>·</span><span>Duración: {v.duration}</span><span>·</span><span style={{color:st.color,fontWeight:600}}>Estado: {st.label}</span></div>
            </div>
            <div className="vf-modal-f">
              <button className="vf-btn vf-btn-ghost" style={{color:'#F87171'}} onClick={doDeleteVideo}>{I.Trash(14)} Eliminar</button>
              <div style={{flex:1}}/>
              {v.status!=='published'&&v.status!=='scheduled'&&v.status!=='review'&&<button className="vf-btn vf-btn-ghost" onClick={doAdvance}>{I.Right(14)} Avanzar</button>}
              {v.status==='review'&&<button className="vf-btn vf-btn-ghost" onClick={doAdvance}>{I.Calendar(14)} Programar</button>}
              {v.status==='scheduled'&&<button className="vf-btn vf-btn-glow" onClick={doPublish}>{I.Send(14)} Publicar Ahora</button>}
              <button className="vf-btn vf-btn-glow" onClick={doSaveEdit}>{I.Check(14)} Guardar</button>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  // ═══════════════════════════════════════════════════════
  const renderView = () => { switch(view) { case 'create':return renderCreate();case 'videos':return renderVideos();case 'calendar':return renderCalendar();case 'channels':return renderChannels();case 'settings':return renderSettings();default:return renderCreate() } }

  const NAV = [
    {id:'create',label:'Crear Videos',icon:I.Spark},
    {id:'videos',label:'Mis Videos',icon:I.Layers,badge:activeJobs||undefined},
    {id:'calendar',label:'Calendario',icon:I.Calendar},
    {id:'channels',label:'Canales',icon:I.Tv},
    {id:'settings',label:'Configuración',icon:I.Settings},
  ]

  const TITLES: Record<string,string> = {create:'Crear Videos',videos:'Mis Videos',calendar:'Calendario',channels:'Canales',settings:'Configuración'}

  return (
    <>
      <style>{CSS}</style>
      <div className="vf-app">
        <aside className={`vf-side ${mobNav?'open':''}`}>
          <div className="vf-side-logo"><div className="vf-logo-ic">{I.Zap(20)}</div><div><div className="vf-logo-t">VideoForge</div><div className="vf-logo-s">AI</div></div></div>
          <nav className="vf-side-nav">
            {NAV.map(n=><div key={n.id} className={`vf-nav-i ${view===n.id?'active':''}`} onClick={()=>{setView(n.id);setMobNav(false)}}>
              {n.icon(18)}<span>{n.label}</span>{n.badge?<span className="vf-nav-b">{n.badge}</span>:null}
            </div>)}
            {channels.length>0&&<><div className="vf-nav-lbl" style={{marginTop:16}}>MIS CANALES</div>{channels.map(ch=><div key={ch.id} className="vf-nav-ch" onClick={()=>{setFilterChannel(ch.id);setView('videos');setMobNav(false)}}><span className="vf-nav-cd" style={{background:ch.color}}/><span>{PLATFORMS[ch.platform].icon} {ch.name}</span></div>)}</>}
          </nav>
          <div style={{padding:'12px 14px',borderTop:'1px solid var(--bd)',display:'flex',alignItems:'center',gap:8}}>
            <div style={{width:30,height:30,borderRadius:8,background:'linear-gradient(135deg,#F97316,#A855F7)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:12,fontWeight:800}}>{user.name?.[0]?.toUpperCase()||user.email[0].toUpperCase()}</div>
            <div style={{flex:1,minWidth:0}}><div style={{fontSize:12,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user.name||user.email}</div><div style={{fontSize:9,color:'var(--t3)'}}>Pro Plan</div></div>
            <button onClick={onLogout} style={{background:'none',border:'none',color:'var(--t3)',cursor:'pointer',padding:4,borderRadius:6,fontSize:11}} title="Cerrar sesión">{I.X(14)}</button>
          </div>
        </aside>
        <main className="vf-main">
          <header className="vf-top">
            <div className="vf-top-l"><button className="vf-menu-b" onClick={()=>setMobNav(!mobNav)}>{I.Menu(20)}</button><h2 className="vf-pg-t">{TITLES[view]||''}</h2></div>
            <div className="vf-top-r">
              {activeJobs>0&&<span style={{fontSize:11,color:'var(--t3)',display:'flex',alignItems:'center',gap:4}}><span style={{width:6,height:6,borderRadius:3,background:'var(--ok)',animation:'blink 2s infinite'}}/>{activeJobs} procesando</span>}
              <button className="vf-btn vf-btn-glow" onClick={()=>setView('create')}>{I.Spark(14)} Crear</button>
            </div>
          </header>
          {mobNav&&<div className="vf-mob-ov" onClick={()=>setMobNav(false)}/>}
          <div className="vf-ct">{renderView()}</div>
        </main>
        {renderModals()}
        {toasts.length>0&&<div style={{position:'fixed',bottom:20,right:20,zIndex:300,display:'flex',flexDirection:'column',gap:8}}>{toasts.map(t=>
          <div key={t.id} style={{background:'rgba(34,197,94,0.95)',color:'#fff',padding:'10px 18px',borderRadius:10,fontSize:13,fontWeight:600,boxShadow:'0 8px 24px rgba(0,0,0,0.4)',animation:'su .3s cubic-bezier(.4,0,.2,1)'}}>{t.msg}</div>
        )}</div>}
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
.vf-side{width:240px;background:var(--bg1);border-right:1px solid var(--bd);display:flex;flex-direction:column;position:fixed;top:0;left:0;bottom:0;z-index:100;transition:transform .25s cubic-bezier(.4,0,.2,1)}
.vf-side-logo{padding:18px 16px;display:flex;align-items:center;gap:10px;border-bottom:1px solid var(--bd)}
.vf-logo-ic{width:34px;height:34px;border-radius:9px;background:linear-gradient(135deg,#F97316,#EA580C);display:flex;align-items:center;justify-content:center;color:#fff;box-shadow:0 0 20px rgba(249,115,22,.25)}
.vf-logo-t{font-size:17px;font-weight:800;background:linear-gradient(135deg,#F97316,#FBBF24);-webkit-background-clip:text;-webkit-text-fill-color:transparent;letter-spacing:-.5px}
.vf-logo-s{font-size:10px;color:var(--t3);font-weight:500;letter-spacing:.5px}
.vf-side-nav{padding:10px 8px;flex:1;overflow-y:auto}
.vf-nav-lbl{font-size:9px;font-weight:700;letter-spacing:1.5px;color:var(--t3);padding:10px 10px 4px;text-transform:uppercase}
.vf-nav-i{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:9px;cursor:pointer;transition:all .15s;color:var(--t2);font-size:13px;font-weight:500;margin-bottom:1px;border:1px solid transparent}
.vf-nav-i:hover{background:var(--bg2);color:var(--t1)}.vf-nav-i.active{background:var(--accg);color:var(--acc);border-color:rgba(249,115,22,.15)}
.vf-nav-b{margin-left:auto;background:var(--acc);color:#fff;font-size:10px;font-weight:700;padding:1px 6px;border-radius:8px;font-family:'JetBrains Mono',monospace}
.vf-nav-ch{display:flex;align-items:center;gap:8px;padding:5px 12px;font-size:12px;color:var(--t2);cursor:pointer;border-radius:6px}.vf-nav-ch:hover{background:var(--bg2)}
.vf-nav-cd{width:7px;height:7px;border-radius:50%;flex-shrink:0}
.vf-main{flex:1;margin-left:240px;min-height:100vh;display:flex;flex-direction:column}
.vf-top{height:56px;border-bottom:1px solid var(--bd);display:flex;align-items:center;justify-content:space-between;padding:0 20px;background:rgba(6,6,10,.85);backdrop-filter:blur(16px);position:sticky;top:0;z-index:50}
.vf-top-l{display:flex;align-items:center;gap:12px}.vf-top-r{display:flex;align-items:center;gap:10px}
.vf-pg-t{font-size:15px;font-weight:700;letter-spacing:-.3px}
.vf-menu-b{display:none;background:none;border:none;color:var(--t2);cursor:pointer}
.vf-ct{padding:20px;flex:1;max-width:1400px}
.vf-mob-ov{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.6);z-index:99}
.vf-btn{display:inline-flex;align-items:center;gap:6px;padding:7px 14px;border-radius:9px;font-size:12px;font-weight:600;cursor:pointer;transition:all .15s;border:none;font-family:'Sora',sans-serif;white-space:nowrap}
.vf-btn-glow{background:linear-gradient(135deg,#F97316,#EA580C);color:#fff;box-shadow:0 0 16px rgba(249,115,22,.2)}.vf-btn-glow:hover{box-shadow:0 0 28px rgba(249,115,22,.4);transform:translateY(-1px)}.vf-btn-glow:disabled{opacity:.5;cursor:not-allowed;transform:none}
.vf-btn-ghost{background:transparent;color:var(--t2);border:1px solid var(--bd)}.vf-btn-ghost:hover{border-color:var(--bd2);color:var(--t1)}
.vf-btn-sm{padding:5px 10px;font-size:11px}
.vf-card{background:var(--bg1);border:1px solid var(--bd);border-radius:14px;overflow:hidden}
.vf-card-h{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid var(--bd)}
.vf-card-t{font-size:13px;font-weight:700;display:flex;align-items:center;gap:8px}.vf-card-b{padding:10px 16px}
.vf-toolbar{display:flex;align-items:center;gap:8px;margin-bottom:14px;flex-wrap:wrap}
.vf-search-w{display:flex;align-items:center;gap:6px;background:var(--bg2);border:1px solid var(--bd);border-radius:8px;padding:5px 10px;color:var(--t3)}
.vf-search-i{background:none;border:none;color:var(--t1);font-family:'Sora',sans-serif;font-size:12px;outline:none;width:130px}.vf-search-i::placeholder{color:var(--t3)}
.vf-sel{background:var(--bg2);border:1px solid var(--bd);border-radius:8px;padding:5px 10px;color:var(--t1);font-size:12px;font-family:'Sora',sans-serif;outline:none;cursor:pointer}
.vf-row{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid rgba(30,30,42,.4);font-size:13px}.vf-row:last-child{border-bottom:none}
.vf-row-info{flex:1;min-width:0}.vf-row-title{font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.vf-row-meta{font-size:11px;color:var(--t3);margin-top:1px}
.vf-bar-w{height:4px;background:var(--bg3);border-radius:2px;overflow:hidden}.vf-bar-f{height:100%;border-radius:2px;transition:width .5s}
.vf-badge{font-size:10px;font-weight:600;padding:2px 8px;border-radius:6px;white-space:nowrap}
.vf-steps{display:flex;gap:8px;overflow-x:auto;padding:6px 0}
.vf-step{border:1px solid;border-radius:10px;padding:12px 14px;min-width:110px;text-align:center;position:relative;flex-shrink:0}
.vf-step-arr{position:absolute;right:-10px;top:50%;transform:translateY(-50%);color:var(--t3)}
.vf-form-g{margin-bottom:14px}.vf-label{display:block;font-size:12px;font-weight:600;color:var(--t2);margin-bottom:5px}
.vf-input,.vf-ta{width:100%;background:var(--bg2);border:1px solid var(--bd);border-radius:10px;padding:9px 12px;color:var(--t1);font-size:13px;font-family:'Sora',sans-serif;outline:none;transition:all .15s}
.vf-input:focus,.vf-ta:focus{border-color:var(--acc);box-shadow:0 0 0 3px var(--accg)}.vf-ta{min-height:70px;resize:vertical}
.vf-form-grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.vf-form-grid4{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:10px;margin-bottom:14px}
.vf-niche-g{display:grid;grid-template-columns:repeat(5,1fr);gap:6px}
.vf-niche{background:var(--bg2);border:2px solid var(--bd);border-radius:9px;padding:10px 6px;cursor:pointer;text-align:center;transition:all .15s;display:flex;flex-direction:column;align-items:center;gap:2px}
.vf-niche:hover{border-color:var(--bd2)}.vf-niche.sel{border-color:var(--acc);background:var(--accg)}
.vf-ch-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px}
.vf-ch-full{background:var(--bg1);border:1px solid var(--bd);border-radius:14px;overflow:hidden}
.vf-ch-banner{height:70px;display:flex;align-items:center;justify-content:center}.vf-ch-body{padding:14px}
.vf-sched-h{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-bottom:4px}
.vf-sched-dl{text-align:center;font-size:10px;font-weight:600;color:var(--t3);text-transform:uppercase;letter-spacing:1px;padding:4px}
.vf-sched-g{display:grid;grid-template-columns:repeat(7,1fr);gap:4px}
.vf-sched-c{background:var(--bg2);border:1px solid var(--bd);border-radius:6px;padding:6px;min-height:52px}.vf-sched-c.dim{opacity:.2}
.vf-sched-n{font-size:10px;font-weight:600;color:var(--t3);display:block;margin-bottom:3px}
.vf-sched-dots{display:flex;flex-wrap:wrap;gap:2px}.vf-sched-dot{width:6px;height:6px;border-radius:50%;display:inline-block}
.vf-sched-leg{display:flex;gap:12px;margin-top:12px;flex-wrap:wrap}.vf-sched-li{display:flex;align-items:center;gap:5px;font-size:11px;color:var(--t2)}
.vf-set-row{display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid rgba(30,30,42,.5)}.vf-set-row:last-child{border-bottom:none}
.vf-toggle{width:40px;height:20px;background:var(--bg3);border-radius:10px;cursor:pointer;position:relative;transition:all .2s;border:1px solid var(--bd);flex-shrink:0}
.vf-toggle.on{background:var(--acc);border-color:var(--acc)}.vf-toggle-k{width:14px;height:14px;background:#fff;border-radius:50%;position:absolute;top:2px;left:2px;transition:all .2s}.vf-toggle.on .vf-toggle-k{left:22px}
.vf-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.7);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;z-index:200;animation:fi .2s ease}
@keyframes fi{from{opacity:0}to{opacity:1}}@keyframes su{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
.vf-modal{background:var(--bg1);border:1px solid var(--bd);border-radius:16px;width:90%;max-height:85vh;overflow-y:auto;animation:su .3s cubic-bezier(.4,0,.2,1)}
.vf-modal-h{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid var(--bd)}
.vf-modal-x{background:none;border:none;color:var(--t3);cursor:pointer;padding:4px;border-radius:8px}.vf-modal-x:hover{background:var(--bg2);color:var(--t1)}
.vf-modal-b{padding:16px 20px}.vf-modal-f{display:flex;align-items:center;gap:8px;padding:12px 20px;border-top:1px solid var(--bd)}
@keyframes blink{50%{opacity:0}}
@keyframes spin{to{transform:rotate(360deg)}}.vf-spin{animation:spin 1s linear infinite}
::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:var(--bd);border-radius:3px}
@media(max-width:1100px){.vf-form-grid4{grid-template-columns:1fr 1fr}.vf-niche-g{grid-template-columns:repeat(3,1fr)}}
@media(max-width:768px){.vf-side{transform:translateX(-240px)}.vf-side.open{transform:translateX(0)}.vf-main{margin-left:0!important}.vf-menu-b{display:block}.vf-form-grid2,.vf-form-grid4{grid-template-columns:1fr}.vf-niche-g{grid-template-columns:repeat(2,1fr)}.vf-ct{padding:14px}.vf-sched-g,.vf-sched-h{grid-template-columns:repeat(4,1fr)}.vf-ch-grid{grid-template-columns:1fr}}
`
