import { NextRequest, NextResponse } from 'next/server'

// POST /api/generate/upload-audio
// Uploads base64 audio to fal.ai storage → returns public URL
export async function POST(req: NextRequest) {
  try {
    const { audioBase64 } = await req.json()

    const falKey = process.env.FAL_KEY
    if (!falKey || !audioBase64) {
      return NextResponse.json({ audioUrl: null, mode: 'no-data' })
    }

    // fal.ai file upload: POST to https://fal.run/fal-ai/upload with the file
    // Alternative: use the REST upload endpoint
    const audioBuffer = Buffer.from(audioBase64, 'base64')

    const uploadRes = await fetch('https://fal.ai/api/storage/upload/initiate', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${falKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content_type: 'audio/mpeg',
        file_name: `voiceover-${Date.now()}.mp3`,
      }),
    })

    if (uploadRes.ok) {
      const uploadData = await uploadRes.json()
      const uploadUrl = uploadData.upload_url
      const fileUrl = uploadData.file_url

      if (uploadUrl) {
        // Upload the actual file
        const putRes = await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': 'audio/mpeg' },
          body: audioBuffer,
        })

        if (putRes.ok && fileUrl) {
          console.log('[Upload] Audio uploaded to fal.ai:', fileUrl.slice(0, 80))
          return NextResponse.json({ audioUrl: fileUrl, mode: 'fal-storage' })
        }
      }
    }

    // Fallback: use data URI (some services accept it)
    const dataUrl = `data:audio/mpeg;base64,${audioBase64.slice(0, 100)}...`
    console.log('[Upload] fal.ai upload failed, trying data URI approach')
    return NextResponse.json({ 
      audioUrl: `data:audio/mpeg;base64,${audioBase64}`, 
      mode: 'data-uri' 
    })
  } catch (error: any) {
    console.error('[Upload] Error:', error.message)
    return NextResponse.json({ audioUrl: null, mode: 'error', error: error.message })
  }
}
