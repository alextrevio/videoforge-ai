import { NextRequest, NextResponse } from 'next/server'

// POST /api/generate/upload-audio
// Uploads base64 audio to fal.ai storage to get a public URL
// (Sync Lipsync needs a URL, not base64)
export async function POST(req: NextRequest) {
  try {
    const { audioBase64 } = await req.json()

    const falKey = process.env.FAL_KEY
    if (!falKey || !audioBase64) {
      return NextResponse.json({ audioUrl: null, mode: 'no-data' })
    }

    // Convert base64 to buffer
    const audioBuffer = Buffer.from(audioBase64, 'base64')

    // Upload to fal.ai storage
    const uploadRes = await fetch('https://fal.run/fal-ai/upload', {
      method: 'PUT',
      headers: {
        'Authorization': `Key ${falKey}`,
        'Content-Type': 'audio/mpeg',
      },
      body: audioBuffer,
    })

    if (!uploadRes.ok) {
      // Try alternative: use a data URI approach
      // Some fal.ai models accept data URIs directly
      const dataUrl = `data:audio/mpeg;base64,${audioBase64}`
      console.log('[Upload] fal.ai upload failed, using data URI')
      return NextResponse.json({ audioUrl: dataUrl, mode: 'data-uri' })
    }

    const uploadData = await uploadRes.json()
    console.log('[Upload] Audio uploaded:', uploadData.url?.slice(0, 80))

    return NextResponse.json({ audioUrl: uploadData.url, mode: 'fal-storage' })
  } catch (error: any) {
    console.error('[Upload] Error:', error.message)
    return NextResponse.json({ audioUrl: null, mode: 'error', error: error.message })
  }
}
