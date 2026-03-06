import { NextRequest, NextResponse } from 'next/server'

// GET /api/oauth/callback?platform=youtube&code=...&state=channelId
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const platform = url.searchParams.get('platform')
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state') // channelId
  const error = url.searchParams.get('error')

  if (error) {
    return NextResponse.redirect(new URL(`/?oauth_error=${error}`, req.url))
  }

  if (!code || !platform || !state) {
    return NextResponse.redirect(new URL('/?oauth_error=missing_params', req.url))
  }

  try {
    let tokens: { access_token: string; refresh_token?: string; expires_in?: number } | null = null

    switch (platform) {
      case 'youtube': {
        const res = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            code,
            client_id: process.env.GOOGLE_CLIENT_ID || '',
            client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
            redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL || ''}/api/oauth/callback?platform=youtube`,
            grant_type: 'authorization_code',
          }),
        })
        tokens = await res.json()
        break
      }

      case 'tiktok': {
        const res = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            code,
            client_key: process.env.TIKTOK_CLIENT_KEY || '',
            client_secret: process.env.TIKTOK_CLIENT_SECRET || '',
            redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL || ''}/api/oauth/callback?platform=tiktok`,
            grant_type: 'authorization_code',
          }),
        })
        tokens = await res.json()
        break
      }

      case 'instagram':
      case 'facebook': {
        const res = await fetch('https://graph.facebook.com/v19.0/oauth/access_token?' + new URLSearchParams({
          code,
          client_id: process.env.FACEBOOK_APP_ID || '',
          client_secret: process.env.FACEBOOK_APP_SECRET || '',
          redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL || ''}/api/oauth/callback?platform=${platform}`,
        }))
        tokens = await res.json()
        break
      }
    }

    if (tokens?.access_token && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const { getSupabase } = await import('@/lib/supabase')
      const client = await getSupabase()
      const expiresAt = tokens.expires_in
        ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
        : null

      await client.from('channels').update({
        oauth_token: tokens.access_token,
        oauth_refresh: tokens.refresh_token || null,
        oauth_expires_at: expiresAt,
      }).eq('id', state)
    }

    return NextResponse.redirect(new URL(`/?oauth_success=${platform}`, req.url))
  } catch (err: any) {
    return NextResponse.redirect(new URL(`/?oauth_error=${err.message}`, req.url))
  }
}
