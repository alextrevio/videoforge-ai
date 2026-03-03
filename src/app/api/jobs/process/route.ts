import { NextRequest, NextResponse } from 'next/server'

// POST /api/jobs/process — placeholder for future cron-based processing
export async function POST() {
  return NextResponse.json({ processed: 0, mode: 'client-side', message: 'Video processing runs client-side via render queue' })
}

// GET /api/jobs/process — health check
export async function GET() {
  return NextResponse.json({ status: 'ok', queue: 'client-side' })
}
