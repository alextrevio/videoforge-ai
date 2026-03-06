// Supabase — fully lazy, env vars read at call time (not module load time)
let _client: any = null

export function isSupabaseConfigured(): boolean {
  // Read env vars INLINE every time — Next.js replaces these at build time
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return !!(url && key)
}

async function getClient() {
  if (_client) return _client
  // Read env vars HERE, not at module scope
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    console.warn('[Supabase] Not configured — using localStorage only')
    throw new Error('Supabase not configured')
  }
  console.log('[Supabase] URL:', JSON.stringify(url), 'KEY length:', key?.length)
  const { createClient } = await import('@supabase/supabase-js')
  _client = createClient(url.trim(), key.trim())
  return _client
}

export const supabase = {
  from: (table: string) => {
    const p = getClient()
    return {
      select: (...a: any[]) => wrap(p.then(c => c.from(table).select(...a))),
      insert: (...a: any[]) => wrap(p.then(c => c.from(table).insert(...a))),
      update: (...a: any[]) => wrap(p.then(c => c.from(table).update(...a))),
      delete: () => wrap(p.then(c => c.from(table).delete())),
    }
  }
}

// Wrap a promise to support chaining .eq(), .order(), etc.
function wrap(promise: Promise<any>): any {
  const obj: any = {
    _p: promise,
    then: (ok: any, fail: any) => obj._p.then(ok, fail),
    catch: (fail: any) => obj._p.catch(fail),
    eq: (col: string, val: any) => { obj._p = obj._p.then((q: any) => q.eq(col, val)); return obj },
    order: (col: string, opts?: any) => { obj._p = obj._p.then((q: any) => q.order(col, opts)); return obj },
    select: (...a: any[]) => { obj._p = obj._p.then((q: any) => q.select(...a)); return obj },
    single: () => { obj._p = obj._p.then((q: any) => q.single()); return obj },
    limit: (n: number) => { obj._p = obj._p.then((q: any) => q.limit(n)); return obj },
  }
  return obj
}
