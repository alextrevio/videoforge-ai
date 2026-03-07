import { NextRequest, NextResponse } from 'next/server'

// POST /api/generate/subtitles
// Generates viral-style subtitles from script text
// Returns timed subtitle blocks for Shotstack CaptionAsset
export async function POST(req: NextRequest) {
  try {
    const { script, duration } = await req.json()

    if (!script || script.length < 10) {
      return NextResponse.json({ subtitles: [], mode: 'empty' })
    }

    const apiKey = process.env.OPENAI_API_KEY
    const durSec = parseInt(duration) || 45
    
    if (!apiKey) {
      // Basic fallback: split into timed chunks
      const words = script.replace(/\[.*?\]/g, '').replace(/\(.*?\)/g, '').split(/\s+/).filter((w: string) => w.length > 0)
      const wordsPerChunk = 4
      const chunks: any[] = []
      const timePerChunk = durSec / Math.ceil(words.length / wordsPerChunk)
      
      for (let i = 0; i < words.length; i += wordsPerChunk) {
        const chunk = words.slice(i, i + wordsPerChunk).join(' ')
        chunks.push({
          text: chunk.toUpperCase(),
          start: (i / wordsPerChunk) * timePerChunk,
          end: ((i / wordsPerChunk) + 1) * timePerChunk,
        })
      }
      return NextResponse.json({ subtitles: chunks, mode: 'basic' })
    }

    // GPT generates viral-style subtitle blocks with emphasis words
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 1500,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `You create VIRAL TIKTOK/REELS subtitles from a video script.

RULES:
- Break the script into short subtitle blocks (3-5 words each)
- Total video duration: ${durSec} seconds
- Space blocks evenly across the video duration
- Each block should be PUNCHY and impactful
- Mark the KEY WORD in each block with asterisks: "esto es *INCREÍBLE*"
- Remove any stage directions [like this] or (like this)
- Keep the language as-is (usually Spanish)
- Make it feel like TikTok captions — short, bold, dramatic

Respond with JSON:
{
  "blocks": [
    { "text": "un pequeño *ROBOT*", "emphasis": "ROBOT", "start": 0.0, "end": 2.5 },
    { "text": "descubre un *MUNDO*", "emphasis": "MUNDO", "start": 2.5, "end": 5.0 }
  ]
}`
          },
          { role: 'user', content: `Create viral subtitles for this ${durSec}s script:\n\n${script.slice(0, 2000)}` }
        ],
      }),
    })

    if (!response.ok) {
      // Fallback
      const words = script.replace(/\[.*?\]/g, '').split(/\s+/).filter((w: string) => w.length > 0)
      const chunks: any[] = []
      const wordsPerChunk = 4
      const timePerChunk = durSec / Math.ceil(words.length / wordsPerChunk)
      for (let i = 0; i < words.length; i += wordsPerChunk) {
        chunks.push({ text: words.slice(i, i + wordsPerChunk).join(' ').toUpperCase(), start: (i / wordsPerChunk) * timePerChunk, end: ((i / wordsPerChunk) + 1) * timePerChunk })
      }
      return NextResponse.json({ subtitles: chunks, mode: 'basic' })
    }

    const data = await response.json()
    const text = data.choices?.[0]?.message?.content || ''

    try {
      const parsed = JSON.parse(text.replace(/```json|```/g, '').trim())
      const blocks = (parsed.blocks || []).map((b: any) => ({
        text: (b.text || '').replace(/\*/g, ''),
        emphasis: b.emphasis || '',
        start: b.start || 0,
        end: b.end || 0,
      }))
      return NextResponse.json({ subtitles: blocks, mode: 'viral' })
    } catch {
      return NextResponse.json({ subtitles: [], mode: 'error' })
    }
  } catch (error: any) {
    return NextResponse.json({ subtitles: [], mode: 'error', error: error.message })
  }
}
