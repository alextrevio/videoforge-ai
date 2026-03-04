'use client'
import { useState, useEffect } from 'react'
import { AppProvider } from '@/lib/context'
import VideoForgeApp from '@/components/VideoForgeApp'
import AuthScreen from '@/components/AuthScreen'

const USER_KEY = 'videoforge_user'

export default function AppShell() {
  const [user, setUser] = useState<{id:string;email:string}|null>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(USER_KEY)
      if (saved) setUser(JSON.parse(saved))
    } catch {}
    setChecking(false)
  }, [])

  const handleAuth = (u: {id:string;email:string}) => {
    setUser(u)
    try { localStorage.setItem(USER_KEY, JSON.stringify(u)) } catch {}
  }

  const handleLogout = () => {
    setUser(null)
    try { localStorage.removeItem(USER_KEY) } catch {}
  }

  if (checking) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#06060A'}}>
      <div style={{textAlign:'center'}}>
        <div style={{width:48,height:48,borderRadius:12,background:'linear-gradient(135deg,#F97316,#EA580C)',display:'inline-flex',alignItems:'center',justifyContent:'center',marginBottom:12,animation:'pulse 1.5s infinite'}}>
          <span style={{fontSize:24}}>⚡</span>
        </div>
        <p style={{color:'#5E5E76',fontSize:13,fontFamily:"'Sora',sans-serif"}}>Cargando...</p>
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
      </div>
    </div>
  )

  if (!user) return <AuthScreen onAuth={handleAuth} />

  return (
    <AppProvider userId={user.id}>
      <VideoForgeApp user={user} onLogout={handleLogout} />
    </AppProvider>
  )
}
