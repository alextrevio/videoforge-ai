import { createClient, SupabaseClient } from '@supabase/supabase-js'

// NEXT_PUBLIC_* vars are inlined at build time by Next.js
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const isSupabaseConfigured = () => !!(SUPABASE_URL && SUPABASE_KEY)

let _client: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient {
  if (!_client) {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      throw new Error('Supabase not configured')
    }
    _client = createClient(SUPABASE_URL, SUPABASE_KEY)
  }
  return _client
}

// Lazy wrapper — only calls createClient on first actual use
export const supabase = {
  from: (table: string) => getSupabaseClient().from(table),
}
