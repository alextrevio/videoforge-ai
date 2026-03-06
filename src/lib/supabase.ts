// Supabase client — 100% lazy, zero top-level import of @supabase/supabase-js
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const isSupabaseConfigured = () => !!(SUPABASE_URL && SUPABASE_KEY)

let _client: any = null

async function initClient() {
  if (!_client) {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      throw new Error('Supabase not configured')
    }
    const { createClient } = await import('@supabase/supabase-js')
    _client = createClient(SUPABASE_URL, SUPABASE_KEY)
  }
  return _client
}

// Async wrapper — all db calls must await
export const supabase = {
  from: (table: string) => {
    // Return a promise-based chain
    const pending = initClient()
    return {
      select: (...args: any[]) => chainMethod(pending, table, 'select', args),
      insert: (...args: any[]) => chainMethod(pending, table, 'insert', args),
      update: (...args: any[]) => chainMethod(pending, table, 'update', args),
      delete: () => chainMethod(pending, table, 'delete', []),
    }
  }
}

function chainMethod(pending: Promise<any>, table: string, method: string, args: any[]) {
  // Create a thenable chain that resolves the client first
  const chain: any = {
    _promise: pending.then(client => {
      const q = client.from(table)[method](...args)
      return q
    }),
    then: (resolve: any, reject: any) => chain._promise.then(resolve, reject),
    eq: (col: string, val: any) => {
      chain._promise = chain._promise.then((q: any) => q.eq(col, val))
      return chain
    },
    order: (col: string, opts?: any) => {
      chain._promise = chain._promise.then((q: any) => q.order(col, opts))
      return chain
    },
    select: (...sArgs: any[]) => {
      chain._promise = chain._promise.then((q: any) => q.select(...sArgs))
      return chain
    },
    single: () => {
      chain._promise = chain._promise.then((q: any) => q.single())
      return chain
    },
  }
  return chain
}
