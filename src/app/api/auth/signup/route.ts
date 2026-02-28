import { NextRequest, NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ user: { id: 'local', email: 'demo@videoforge.ai', name: 'Demo' } })
  }
  try {
    const { email, password, name } = await req.json()
    const { data, error } = await supabase.auth.signUp({
      email, password, options: { data: { name } }
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ user: { id: data.user?.id, email, name } })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
