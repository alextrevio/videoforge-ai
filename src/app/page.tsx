'use client'
import { useState, useEffect } from 'react'
import { AppProvider } from '@/lib/context'
import VideoForgeApp from '@/components/VideoForgeApp'
import AuthScreen from '@/components/AuthScreen'
import { isSupabaseConfigured } from '@/lib/supabase'

interface User {
  id: string
  email: string
  name: string
}

const USER_KEY = 'videoforge_user'

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [checking, setChecking] = useState(true)
  const isSupa = isSupabaseConfigured()

  // Check for existing session
  useEffect(() => {
    try {
      const saved = localStorage.getItem(USER_KEY)
      if (saved) setUser(JSON.parse(saved))
    } catch {}
    setChecking(false)
  }, [])

  const handleAuth = (u: User) => {
    setUser(u)
    localStorage.setItem(USER_KEY, JSON.stringify(u))
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem(USER_KEY)
  }

  if (checking) {
    return (
      <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#06060A',fontFamily:"'Sora',sans-serif"}}>
        <div style={{textAlign:'center'}}>
          <div style={{width:48,height:48,borderRadius:12,background:'linear-gradient(135deg,#F97316,#EA580C)',display:'inline-flex',alignItems:'center',justifyContent:'center',marginBottom:12,animation:'pulse 1.5s infinite'}}>
            <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8"/></svg>
          </div>
          <p style={{color:'#5E5E76',fontSize:13}}>Cargando...</p>
          <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
        </div>
      </div>
    )
  }

  if (!user) {
    return <AuthScreen onAuth={handleAuth} isSupabase={isSupa} />
  }

  return (
    <AppProvider>
      <VideoForgeApp user={user} onLogout={handleLogout} />
    </AppProvider>
  )
}
