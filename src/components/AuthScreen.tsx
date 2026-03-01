'use client'
import React, { useState } from 'react'
import { isSupabaseConfigured } from '@/lib/supabase'

interface AuthScreenProps {
  onAuth: (user: { id: string; email: string }) => void
}

export default function AuthScreen({ onAuth }: AuthScreenProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const hasDb = isSupabaseConfigured()

  const handleLogin = async () => {
    if (!email || !password) { setError('Completa todos los campos'); return }
    setLoading(true); setError('')
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data, error: err } = await supabase.auth.signInWithPassword({ email, password })
      if (err) { setError(err.message); setLoading(false); return }
      if (data.user) onAuth({ id: data.user.id, email: data.user.email || email })
    } catch (e: any) { setError(e.message) }
    setLoading(false)
  }

  return (
    <div style={{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'#06060A',fontFamily:"'Sora',sans-serif",padding:20}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap');`}</style>
      <div style={{background:'#0C0C12',border:'1px solid #1E1E2A',borderRadius:20,padding:36,width:'100%',maxWidth:400}}>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:28}}>
          <div style={{width:40,height:40,borderRadius:10,background:'linear-gradient(135deg,#F97316,#EA580C)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>⚡</div>
          <div><div style={{fontSize:20,fontWeight:800,background:'linear-gradient(135deg,#F97316,#FBBF24)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>VideoForge</div><div style={{fontSize:11,color:'#5E5E76'}}>AI Video Automation</div></div>
        </div>

        {hasDb ? <>
          <h2 style={{fontSize:18,fontWeight:700,color:'#F0F0F5',marginBottom:20}}>Inicia sesión</h2>
          <div style={{marginBottom:16}}><label style={{display:'block',fontSize:12,fontWeight:600,color:'#9D9DB5',marginBottom:5}}>Email</label><input style={{width:'100%',background:'#13131B',border:'1px solid #1E1E2A',borderRadius:10,padding:'10px 14px',color:'#F0F0F5',fontSize:14,fontFamily:"'Sora',sans-serif",outline:'none'}} type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="tu@email.com"/></div>
          <div style={{marginBottom:16}}><label style={{display:'block',fontSize:12,fontWeight:600,color:'#9D9DB5',marginBottom:5}}>Contraseña</label><input style={{width:'100%',background:'#13131B',border:'1px solid #1E1E2A',borderRadius:10,padding:'10px 14px',color:'#F0F0F5',fontSize:14,fontFamily:"'Sora',sans-serif",outline:'none'}} type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" onKeyDown={e=>e.key==='Enter'&&handleLogin()}/></div>
          {error&&<div style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:8,padding:'8px 12px',fontSize:12,color:'#F87171',marginBottom:14}}>{error}</div>}
          <button style={{width:'100%',padding:'12px 0',borderRadius:10,border:'none',background:'linear-gradient(135deg,#F97316,#EA580C)',color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:"'Sora',sans-serif"}} onClick={handleLogin} disabled={loading}>{loading?'Entrando...':'Entrar'}</button>
        </> : <>
          <h2 style={{fontSize:18,fontWeight:700,color:'#F0F0F5',marginBottom:8}}>Bienvenido</h2>
          <p style={{fontSize:13,color:'#5E5E76',marginBottom:20,lineHeight:1.5}}>Modo local — los datos se guardan en tu navegador. Conecta Supabase para persistencia en la nube.</p>
          <button style={{width:'100%',padding:'14px 0',borderRadius:10,border:'none',background:'linear-gradient(135deg,#F97316,#EA580C)',color:'#fff',fontSize:15,fontWeight:700,cursor:'pointer',fontFamily:"'Sora',sans-serif"}} onClick={()=>onAuth({id:'owner',email:'alejandro@videoforge.ai'})}>Entrar</button>
        </>}
      </div>
      <div style={{marginTop:24,fontSize:11,color:'#3E3E56'}}>VideoForge AI © 2026</div>
    </div>
  )
}
