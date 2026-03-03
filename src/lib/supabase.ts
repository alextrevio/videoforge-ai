import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Only create client if configured — use dummy URL to prevent build crash
export const supabase = createClient(
  url || 'https://placeholder.supabase.co',
  key || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder'
)

export const isSupabaseConfigured = () => !!(url && key)
