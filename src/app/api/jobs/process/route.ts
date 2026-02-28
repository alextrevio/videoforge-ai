import { NextRequest, NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

// POST /api/jobs/process
// Processes pending jobs in the queue
// In production, call this via Vercel Cron (every 1 min)
export async function POST(req: NextRequest) {
  // Verify cron secret or admin auth
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ processed: 0, mode: 'simulation' })
  }

  try {
    // Fetch pending jobs (oldest first, limit 5)
    const { data: jobs } = await supabase
      .from('jobs')
      .select('*, videos(*)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(5)

    if (!jobs || jobs.length === 0) {
      return NextResponse.json({ processed: 0, message: 'No pending jobs' })
    }

    let processed = 0

    for (const job of jobs) {
      // Mark as processing
      await supabase.from('jobs').update({ status: 'processing' }).eq('id', job.id)

      try {
        const video = job.videos
        let result: any = null

        switch (job.type) {
          case 'script': {
            const res = await fetch(new URL('/api/generate/script', req.url), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: video.title,
                description: video.description,
                niche: video.tags?.[0] || 'other',
                duration: video.duration?.replace(/[^0-9]/g, '') || '60',
                lang: 'es-MX',
              }),
            })
            result = await res.json()
            if (result.script) {
              await supabase.from('videos').update({
                script: result.script,
                tags: result.tags || video.tags,
                status: 'voiceover',
                progress: 15,
              }).eq('id', video.id)
            }
            break
          }

          case 'voiceover': {
            const res = await fetch(new URL('/api/generate/voiceover', req.url), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                script: video.script,
                voice: 'mateo',
                videoId: video.id,
              }),
            })
            result = await res.json()
            if (result.audioUrl) {
              await supabase.from('videos').update({
                audio_url: result.audioUrl,
                status: 'visuals',
                progress: 30,
              }).eq('id', video.id)
            }
            break
          }

          case 'thumbnail': {
            const res = await fetch(new URL('/api/generate/thumbnail', req.url), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: video.title,
                niche: video.tags?.[0] || 'other',
              }),
            })
            result = await res.json()
            await supabase.from('videos').update({
              status: 'review',
              progress: 85,
            }).eq('id', video.id)
            break
          }

          case 'publish': {
            // Placeholder: In production, this calls YouTube/TikTok/etc APIs
            await supabase.from('videos').update({
              status: 'published',
              progress: 100,
              published_at: new Date().toISOString(),
            }).eq('id', video.id)
            result = { published: true }
            break
          }

          default: {
            // Unknown job type — advance video to next stage
            result = { skipped: true, type: job.type }
          }
        }

        // Mark job complete
        await supabase.from('jobs').update({
          status: 'completed',
          result,
          completed_at: new Date().toISOString(),
        }).eq('id', job.id)

        processed++
      } catch (error: any) {
        // Mark job failed
        await supabase.from('jobs').update({
          status: 'failed',
          error: error.message,
        }).eq('id', job.id)
      }
    }

    return NextResponse.json({ processed, total: jobs.length })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// GET /api/jobs/process — health check
export async function GET() {
  return NextResponse.json({ status: 'ok', queue: 'ready' })
}
