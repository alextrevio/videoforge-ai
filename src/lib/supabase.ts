// Read env vars at module level — Next.js injects NEXT_PUBLIC_* here
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const isSupabaseConfigured = () => !!(SUPABASE_URL && SUPABASE_KEY)

let _client: any = null

function getClient() {
  if (!_client) {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      throw new Error('Supabase not configured')
    }
    const { createClient } = require('@supabase/supabase-js')
    _client = createClient(SUPABASE_URL, SUPABASE_KEY)
  }
  return _client
}

export const supabase = {
  from: (...args: any[]) => getClient().from(...args),
}
