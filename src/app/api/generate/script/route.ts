import { NextRequest, NextResponse } from 'next/server'

// POST /api/generate/script
// Generates a video script using OpenAI GPT
export async function POST(req: NextRequest) {
  try {
    const { title, description, niche, duration, lang } = await req.json()
    
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      const durSec = parseInt(duration) || 60
      const wordCount = Math.round(durSec * 2.5)
      return NextResponse.json({
        script: `[GUIÓN SIMULADO — ${title}]\n\nGancho (0-3s): ¿Sabías que ${title.toLowerCase()}? Lo que vas a ver te va a sorprender.\n\nDesarrollo (3-${durSec-10}s): ${description || title}. Este es un guión de demostración generado automáticamente.\n\nCierre (${durSec-10}-${durSec}s): Si te gustó, suscríbete y activa la campana.\n\n[~${wordCount} palabras | ${duration}s | ${lang}]`,
        hook: `¿Sabías que ${title.toLowerCase()}?`,
        cta: 'Suscríbete y activa la campana 🔔',
        tags: [niche, 'viral', 'shorts', lang],
        mode: 'simulation',
      })
    }

    const durSec = parseInt(duration) || 60
    const wordCount = Math.round(durSec * 2.5)

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 1500,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `Eres un guionista experto en videos virales de YouTube/TikTok/Instagram Reels.
Generas guiones en español (${lang || 'es-MX'}) optimizados para retención.
El video dura ${durSec} segundos (~${wordCount} palabras).
Nicho: ${niche}.

Responde SOLO con JSON:
{
  "script": "El guión completo con marcas de tiempo [0:00-0:03] Gancho...",
  "hook": "Frase gancho de los primeros 3 segundos",
  "cta": "Call to action del final",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "thumbnail_text": "Texto corto para el thumbnail (max 5 palabras)"
}`
          },
          { role: 'user', content: `Genera un guión viral para: "${title}"\nDescripción: ${description || title}` }
        ],
      }),
    })

    const data = await response.json()
    const text = data.choices?.[0]?.message?.content || ''
    
    try {
      const parsed = JSON.parse(text.replace(/```json|```/g, '').trim())
      return NextResponse.json({ ...parsed, mode: 'gpt' })
    } catch {
      return NextResponse.json({
        script: text, hook: '', cta: '', tags: [niche], mode: 'gpt-raw'
      })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
