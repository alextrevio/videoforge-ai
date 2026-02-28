'use client'
import React, { useState } from 'react'

interface AuthScreenProps {
  onAuth: (user: { id: string; email: string }) => void
}

export default function AuthScreen({ onAuth }: AuthScreenProps) {
  const [mode, setMode] = useState<'login'|'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!email || !password) { setError('Completa todos los campos'); return }
    setLoading(true); setError('')
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
        onAuth({ id: 'demo', email }); return
      }
      const { signIn, signUp } = await import('@/lib/db')
      if (mode === 'login') {
        const { user, error: err } = await signIn(email, password)
        if (err) { setError(err.message); setLoading(false); return }
        if (user) onAuth({ id: user.id, email: user.email || email })
      } else {
        if (!name) { setError('Ingresa tu nombre'); setLoading(false); return }
        const { user, error: err } = await signUp(email, password, name)
        if (err) { setError(err.message); setLoading(false); return }
        if (user) onAuth({ id: user.id, email: user.email || email })
      }
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
        <h2 style={{fontSize:18,fontWeight:700,color:'#F0F0F5',marginBottom:20}}>{mode==='login'?'Inicia sesión':'Crea tu cuenta'}</h2>
        {mode==='signup'&&<div style={{marginBottom:16}}><label style={{display:'block',fontSize:12,fontWeight:600,color:'#9D9DB5',marginBottom:5}}>Nombre</label><input style={{width:'100%',background:'#13131B',border:'1px solid #1E1E2A',borderRadius:10,padding:'10px 14px',color:'#F0F0F5',fontSize:14,fontFamily:"'Sora',sans-serif",outline:'none'}} value={name} onChange={e=>setName(e.target.value)} placeholder="Tu nombre"/></div>}
        <div style={{marginBottom:16}}><label style={{display:'block',fontSize:12,fontWeight:600,color:'#9D9DB5',marginBottom:5}}>Email</label><input style={{width:'100%',background:'#13131B',border:'1px solid #1E1E2A',borderRadius:10,padding:'10px 14px',color:'#F0F0F5',fontSize:14,fontFamily:"'Sora',sans-serif",outline:'none'}} type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="tu@email.com"/></div>
        <div style={{marginBottom:16}}><label style={{display:'block',fontSize:12,fontWeight:600,color:'#9D9DB5',marginBottom:5}}>Contraseña</label><input style={{width:'100%',background:'#13131B',border:'1px solid #1E1E2A',borderRadius:10,padding:'10px 14px',color:'#F0F0F5',fontSize:14,fontFamily:"'Sora',sans-serif",outline:'none'}} type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" onKeyDown={e=>e.key==='Enter'&&handleSubmit()}/></div>
        {error&&<div style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:8,padding:'8px 12px',fontSize:12,color:'#F87171',marginBottom:14}}>{error}</div>}
        <button style={{width:'100%',padding:'12px 0',borderRadius:10,border:'none',background:'linear-gradient(135deg,#F97316,#EA580C)',color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:"'Sora',sans-serif",marginBottom:10}} onClick={handleSubmit} disabled={loading}>{loading?'Cargando...':mode==='login'?'Entrar':'Crear Cuenta'}</button>
        <button style={{width:'100%',padding:'10px 0',borderRadius:10,border:'1px solid #1E1E2A',background:'transparent',color:'#9D9DB5',fontSize:13,fontWeight:500,cursor:'pointer',fontFamily:"'Sora',sans-serif",marginBottom:16}} onClick={()=>onAuth({id:'demo',email:'demo@videoforge.ai'})}>Modo Demo (sin cuenta)</button>
        <div style={{textAlign:'center',fontSize:13,color:'#5E5E76'}}>{mode==='login'?<>¿No tienes cuenta? <span style={{color:'#F97316',cursor:'pointer',fontWeight:600}} onClick={()=>{setMode('signup');setError('')}}>Regístrate</span></>:<>¿Ya tienes cuenta? <span style={{color:'#F97316',cursor:'pointer',fontWeight:600}} onClick={()=>{setMode('login');setError('')}}>Inicia sesión</span></>}</div>
      </div>
      <div style={{marginTop:24,fontSize:11,color:'#3E3E56'}}>VideoForge AI © 2026</div>
    </div>
  )
}
