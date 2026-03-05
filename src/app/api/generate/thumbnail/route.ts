import { NextRequest, NextResponse } from 'next/server'

// POST /api/generate/thumbnail
// Generates thumbnail concept using GPT
export async function POST(req: NextRequest) {
  try {
    const { title, niche, thumbnailText } = await req.json()

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({
        thumbnailUrl: null,
        concept: {
          text: thumbnailText || title.split(' ').slice(0, 4).join(' '),
          bgColor: '#1a1a2e', textColor: '#ffffff', accent: '#e94560', style: 'bold-dramatic',
        },
        mode: 'simulation',
      })
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 300,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `Eres un diseñador de thumbnails para YouTube. Genera un concepto que maximice CTR.
Responde SOLO JSON:
{
  "text": "Texto principal (max 5 palabras, MAYÚSCULAS, impactante)",
  "bgColor": "#hex del fondo",
  "textColor": "#hex del texto",
  "accent": "#hex del color de acento",
  "style": "descripción del estilo visual en 3 palabras",
  "emotion": "emoción que debe transmitir"
}`
          },
          { role: 'user', content: `Thumbnail para: "${title}" (nicho: ${niche})` }
        ],
      }),
    })

    const data = await response.json()
    const text = data.choices?.[0]?.message?.content || ''
    
    try {
      const concept = JSON.parse(text.replace(/```json|```/g, '').trim())
      return NextResponse.json({ thumbnailUrl: null, concept, mode: 'gpt' })
    } catch {
      return NextResponse.json({
        thumbnailUrl: null,
        concept: { text: title.slice(0, 30), bgColor: '#1a1a2e', textColor: '#fff', accent: '#e94560', style: 'bold' },
        mode: 'gpt-raw',
      })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
