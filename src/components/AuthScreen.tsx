'use client'
import React, { useState } from 'react'

interface AuthScreenProps {
  onAuth: (user: { id: string; email: string; name: string }) => void
  isSupabase: boolean
}

export default function AuthScreen({ onAuth, isSupabase }: AuthScreenProps) {
  const [mode, setMode] = useState<'login'|'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setError('')
    if (!isSupabase) {
      // Demo mode — skip auth
      onAuth({ id: 'local', email: 'demo@videoforge.ai', name: 'Demo User' })
      return
    }
    if (!email || !password) { setError('Ingresa email y contraseña'); return }
    if (mode === 'signup' && !name) { setError('Ingresa tu nombre'); return }

    setLoading(true)
    try {
      const endpoint = mode === 'signup' ? '/api/auth/signup' : '/api/auth/login'
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      })
      const data = await res.json()
      if (data.error) { setError(data.error); setLoading(false); return }
      onAuth(data.user)
    } catch (e: any) {
      setError(e.message)
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',
      background:'#06060A',fontFamily:"'Sora',sans-serif",
    }}>
      <div style={{width:380,maxWidth:'90%'}}>
        {/* Logo */}
        <div style={{textAlign:'center',marginBottom:32}}>
          <div style={{width:56,height:56,borderRadius:14,background:'linear-gradient(135deg,#F97316,#EA580C)',display:'inline-flex',alignItems:'center',justifyContent:'center',marginBottom:12,boxShadow:'0 0 40px rgba(249,115,22,.3)'}}>
            <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8"/></svg>
          </div>
          <h1 style={{fontSize:26,fontWeight:800,background:'linear-gradient(135deg,#F97316,#FBBF24)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',marginBottom:4}}>VideoForge AI</h1>
          <p style={{fontSize:13,color:'#5E5E76'}}>Genera y publica videos automáticamente</p>
        </div>

        {/* Card */}
        <div style={{background:'#0C0C12',border:'1px solid #1E1E2A',borderRadius:16,padding:28}}>
          {/* Tabs */}
          <div style={{display:'flex',gap:0,marginBottom:24,background:'#13131B',borderRadius:10,padding:3}}>
            {(['login','signup'] as const).map(m =>
              <button key={m} onClick={()=>{setMode(m);setError('')}}
                style={{flex:1,padding:'8px 0',borderRadius:8,border:'none',fontFamily:'inherit',fontSize:13,fontWeight:600,cursor:'pointer',transition:'all .15s',
                  background:mode===m?'linear-gradient(135deg,#F97316,#EA580C)':'transparent',
                  color:mode===m?'#fff':'#5E5E76',
                }}>
                {m==='login'?'Iniciar Sesión':'Crear Cuenta'}
              </button>
            )}
          </div>

          {mode==='signup' && <div style={{marginBottom:14}}>
            <label style={{display:'block',fontSize:12,fontWeight:600,color:'#9D9DB5',marginBottom:5}}>Nombre</label>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="Tu nombre"
              style={{width:'100%',background:'#13131B',border:'1px solid #1E1E2A',borderRadius:10,padding:'10px 12px',color:'#F0F0F5',fontSize:13,fontFamily:'Sora',outline:'none'}} />
          </div>}

          <div style={{marginBottom:14}}>
            <label style={{display:'block',fontSize:12,fontWeight:600,color:'#9D9DB5',marginBottom:5}}>Email</label>
            <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="tu@email.com" type="email"
              style={{width:'100%',background:'#13131B',border:'1px solid #1E1E2A',borderRadius:10,padding:'10px 12px',color:'#F0F0F5',fontSize:13,fontFamily:'Sora',outline:'none'}} />
          </div>

          <div style={{marginBottom:20}}>
            <label style={{display:'block',fontSize:12,fontWeight:600,color:'#9D9DB5',marginBottom:5}}>Contraseña</label>
            <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" type="password"
              style={{width:'100%',background:'#13131B',border:'1px solid #1E1E2A',borderRadius:10,padding:'10px 12px',color:'#F0F0F5',fontSize:13,fontFamily:'Sora',outline:'none'}} />
          </div>

          {error && <div style={{padding:'8px 12px',borderRadius:8,background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.2)',color:'#F87171',fontSize:12,marginBottom:14}}>{error}</div>}

          <button onClick={handleSubmit} disabled={loading}
            style={{width:'100%',padding:12,borderRadius:10,border:'none',background:'linear-gradient(135deg,#F97316,#EA580C)',color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:'Sora',boxShadow:'0 0 20px rgba(249,115,22,.25)',opacity:loading?0.6:1}}>
            {loading ? 'Cargando...' : mode==='login' ? 'Entrar' : 'Crear Cuenta'}
          </button>

          {!isSupabase && <div style={{marginTop:16,textAlign:'center'}}>
            <button onClick={()=>onAuth({id:'local',email:'demo@videoforge.ai',name:'Demo'})}
              style={{background:'none',border:'1px solid #1E1E2A',borderRadius:10,padding:'10px 20px',color:'#9D9DB5',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'Sora',width:'100%'}}>
              🎮 Entrar en Modo Demo (sin cuenta)
            </button>
            <p style={{fontSize:10,color:'#5E5E76',marginTop:8}}>Configura Supabase para habilitar autenticación real</p>
          </div>}
        </div>
      </div>
    </div>
  )
}
