import { NextRequest, NextResponse } from 'next/server'

// POST /api/generate — Generate video scripts using Claude API
// When API key is not configured, returns simulated scripts
export async function POST(req: NextRequest) {
  try {
    const { idea, channel, niche, count, duration, lang } = await req.json()

    if (!idea || !channel) {
      return NextResponse.json({ error: 'Missing required fields: idea, channel' }, { status: 400 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY

    if (apiKey) {
      // ═══ REAL API CALL ═══
      const systemPrompt = `Eres un experto en YouTube que crea guiones virales para canales en español.
Nicho: ${niche || 'general'}
Duración objetivo: ${duration || 45} segundos
Idioma: ${lang || 'es-MX'}

Genera ${count || 5} guiones de video basados en la idea del usuario.
Para cada video responde en JSON con este formato exacto:
{
  "videos": [
    {
      "title": "Título atractivo para YouTube",
      "description": "Descripción SEO optimizada (2-3 líneas)",
      "script": "Guión narrado completo del video",
      "tags": ["tag1", "tag2", "tag3"],
      "hook": "Los primeros 3 segundos del video (gancho)",
      "thumbnail_text": "Texto sugerido para el thumbnail"
    }
  ]
}
Solo responde con el JSON, sin texto adicional.`

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4096,
          system: systemPrompt,
          messages: [{ role: 'user', content: `Genera guiones para: ${idea}` }],
        }),
      })

      if (!response.ok) {
        const err = await response.text()
        console.error('Anthropic API error:', err)
        return NextResponse.json({ error: 'API error', details: err }, { status: 500 })
      }

      const data = await response.json()
      const text = data.content?.[0]?.text || ''

      try {
        const parsed = JSON.parse(text)
        return NextResponse.json(parsed)
      } catch {
        // Try to extract JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          return NextResponse.json(JSON.parse(jsonMatch[0]))
        }
        return NextResponse.json({ raw: text, videos: [] })
      }
    }

    // ═══ SIMULATION MODE ═══
    const templates: Record<string, string[]> = {
      history: ['La Historia Oculta de', 'El Ascenso y Caída de', 'Secretos de', 'Lo que Nunca Supiste de', 'El Misterio de'],
      kids: ['Aprende sobre', 'Colores y Formas de', 'Canciones de', 'Aventuras de', 'El Mundo Mágico de'],
      facts: ['10 Datos Increíbles de', '¿Sabías Esto de', 'La Ciencia de', 'Todo sobre', 'Curiosidades de'],
      horror: ['El Terror de', 'Caso Real:', 'La Leyenda de', 'Nunca Vayas a', 'El Misterio Oscuro de'],
      motivation: ['Cómo Lograr', 'El Secreto de', 'Mentalidad de', 'Nunca Renuncies a', 'Transforma tu'],
      tech: ['IA y', 'El Futuro de', 'Robots que Hacen', 'Tecnología de', 'Innovaciones en'],
    }

    const topics = idea.split(' ').filter((w: string) => w.length > 3)
    const tpl = templates[niche] || templates.facts
    const videos = Array.from({ length: Math.min(count || 5, 20) }, (_, i) => {
      const topic = topics[i % topics.length] || 'el Mundo'
      const prefix = tpl[i % tpl.length]
      return {
        title: `${prefix} ${topic.charAt(0).toUpperCase() + topic.slice(1)}`,
        description: `Video sobre ${topic} - ${idea.slice(0, 80)}`,
        script: `[Simulado] Guión para: ${prefix} ${topic}. Duración: ${duration}s. Este guión será generado por Claude cuando configures tu API key.`,
        tags: [niche, topic.toLowerCase(), 'youtube', 'viral'],
        hook: `¿Sabías que ${topic} esconde un secreto increíble?`,
        thumbnail_text: topic.toUpperCase(),
      }
    })

    return NextResponse.json({ videos, simulated: true })
  } catch (error: any) {
    return NextResponse.json({ error: 'Server error', details: error.message }, { status: 500 })
  }
}
