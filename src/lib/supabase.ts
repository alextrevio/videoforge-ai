let _supabase: any = null

export const isSupabaseConfigured = () => {
  if (typeof process === 'undefined') return false
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

export const supabase = {
  from: (...args: any[]) => getClient().from(...args),
  auth: {
    getSession: () => getClient().auth.getSession(),
    signInWithPassword: (creds: any) => getClient().auth.signInWithPassword(creds),
    signOut: () => getClient().auth.signOut(),
    onAuthStateChange: (cb: any) => getClient().auth.onAuthStateChange(cb),
  }
}

function getClient() {
  if (!_supabase) {
    const { createClient } = require('@supabase/supabase-js')
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) throw new Error('Supabase not configured')
    _supabase = createClient(url, key)
  }
  return _supabase
}
