import { NextRequest, NextResponse } from 'next/server'

// POST /api/generate/thumbnail
// Generates thumbnail concept (text + colors) and placeholder image
export async function POST(req: NextRequest) {
  try {
    const { title, niche, thumbnailText } = await req.json()

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({
        thumbnailUrl: null,
        concept: {
          text: thumbnailText || title.split(' ').slice(0, 4).join(' '),
          bgColor: '#1a1a2e',
          textColor: '#ffffff',
          accent: '#e94560',
          style: 'bold-dramatic',
        },
        mode: 'simulation',
      })
    }

    // Use Claude to generate thumbnail concept
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        system: `Eres un diseñador de thumbnails para YouTube. 
Genera un concepto de thumbnail que maximice CTR.
Responde SOLO JSON sin markdown:
{
  "text": "Texto principal (max 5 palabras, MAYÚSCULAS, impactante)",
  "bgColor": "#hex del fondo",
  "textColor": "#hex del texto",
  "accent": "#hex del color de acento",
  "style": "descripción del estilo visual en 3 palabras",
  "emotion": "emoción que debe transmitir"
}`,
        messages: [{ role: 'user', content: `Thumbnail para: "${title}" (nicho: ${niche})` }],
      }),
    })

    const data = await response.json()
    const text = data.content?.[0]?.text || ''
    
    try {
      const concept = JSON.parse(text.replace(/```json|```/g, '').trim())
      return NextResponse.json({ thumbnailUrl: null, concept, mode: 'claude' })
    } catch {
      return NextResponse.json({
        thumbnailUrl: null,
        concept: { text: title.slice(0, 30), bgColor: '#1a1a2e', textColor: '#fff', accent: '#e94560', style: 'bold' },
        mode: 'claude-raw',
      })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
