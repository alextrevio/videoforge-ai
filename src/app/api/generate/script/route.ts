import { NextRequest, NextResponse } from 'next/server'

// POST /api/generate/script
// Generates a video script using Claude API
export async function POST(req: NextRequest) {
  try {
    const { title, description, niche, duration, lang } = await req.json()
    
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      // Simulation mode
      const durSec = parseInt(duration) || 60
      const wordCount = Math.round(durSec * 2.5) // ~150 words per minute
      return NextResponse.json({
        script: `[GUIÓN SIMULADO — ${title}]\n\n` +
          `Gancho (0-3s): ¿Sabías que ${title.toLowerCase()}? Lo que vas a ver te va a sorprender.\n\n` +
          `Desarrollo (3-${durSec-10}s): ${description || title}. ` +
          `Este es un guión de demostración generado automáticamente. ` +
          `En producción, Claude genera guiones completos optimizados para retención.\n\n` +
          `Cierre (${durSec-10}-${durSec}s): Si te gustó, suscríbete y activa la campana. ` +
          `Déjame en los comentarios qué tema quieres que cubra.\n\n` +
          `[~${wordCount} palabras | ${duration}s | ${lang}]`,
        hook: `¿Sabías que ${title.toLowerCase()}?`,
        cta: 'Suscríbete y activa la campana 🔔',
        tags: [niche, 'viral', 'shorts', lang],
        mode: 'simulation',
      })
    }

    // Real Claude API call
    const durSec = parseInt(duration) || 60
    const wordCount = Math.round(durSec * 2.5)

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1500,
        system: `Eres un guionista experto en videos virales de YouTube/TikTok/Instagram Reels.
Generas guiones en español (${lang || 'es-MX'}) optimizados para retención.
El video dura ${durSec} segundos (~${wordCount} palabras).
Nicho: ${niche}.

FORMATO DE RESPUESTA (JSON estricto, sin markdown):
{
  "script": "El guión completo con marcas de tiempo [0:00-0:03] Gancho...",
  "hook": "Frase gancho de los primeros 3 segundos",
  "cta": "Call to action del final",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "thumbnail_text": "Texto corto para el thumbnail (max 5 palabras)"
}`,
        messages: [{ role: 'user', content: `Genera un guión viral para: "${title}"\nDescripción: ${description || title}` }],
      }),
    })

    const data = await response.json()
    const text = data.content?.[0]?.text || ''
    
    try {
      const parsed = JSON.parse(text.replace(/```json|```/g, '').trim())
      return NextResponse.json({ ...parsed, mode: 'claude' })
    } catch {
      return NextResponse.json({
        script: text, hook: '', cta: '', tags: [niche], mode: 'claude-raw'
      })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
