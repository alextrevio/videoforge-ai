// Supabase — fully lazy with dynamic import
let _client: any = null

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return !!(url && key)
}

async function getClient() {
  if (_client) return _client
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) throw new Error('Supabase not configured')
  const { createClient } = await import('@supabase/supabase-js')
  _client = createClient(url.trim(), key.trim())
  return _client
}

// Returns real supabase client — caller must await
export async function getSupabase() {
  return getClient()
}

// Convenience: get a table query builder
export const supabase = {
  from: (table: string) => ({
    select: (...a: any[]) => getClient().then((c: any) => c.from(table).select(...a)),
    insert: (...a: any[]) => getClient().then((c: any) => c.from(table).insert(...a)),
    update: (...a: any[]) => getClient().then((c: any) => c.from(table).update(...a)),
    delete: () => getClient().then((c: any) => c.from(table).delete()),
  })
}
