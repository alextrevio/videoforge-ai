'use client'
import { useState, useEffect } from 'react'
import { AppProvider } from '@/lib/context'
import VideoForgeApp from '@/components/VideoForgeApp'
import AuthScreen from '@/components/AuthScreen'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'

const USER_KEY = 'videoforge_user'

export default function Home() {
  const [user, setUser] = useState<{id:string;email:string}|null>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      if (isSupabaseConfigured()) {
        try {
          const { data } = await supabase.auth.getSession()
          if (data.session?.user) {
            const u = { id: data.session.user.id, email: data.session.user.email || '' }
            setUser(u)
            localStorage.setItem(USER_KEY, JSON.stringify(u))
            setChecking(false)
            return
          }
        } catch {}
      }
      try {
        const saved = localStorage.getItem(USER_KEY)
        if (saved) setUser(JSON.parse(saved))
      } catch {}
      setChecking(false)
    }
    checkAuth()

    if (isSupabaseConfigured()) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          const u = { id: session.user.id, email: session.user.email || '' }
          setUser(u)
          localStorage.setItem(USER_KEY, JSON.stringify(u))
        } else if (_event === 'SIGNED_OUT') {
          setUser(null)
          localStorage.removeItem(USER_KEY)
        }
      })
      return () => subscription.unsubscribe()
    }
  }, [])

  const handleAuth = (u: {id:string;email:string}) => {
    setUser(u)
    localStorage.setItem(USER_KEY, JSON.stringify(u))
  }

  const handleLogout = async () => {
    if (isSupabaseConfigured()) {
      try { await supabase.auth.signOut() } catch {}
    }
    setUser(null)
    localStorage.removeItem(USER_KEY)
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
