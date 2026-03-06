import { NextRequest, NextResponse } from 'next/server'

// POST /api/generate/script
// GPT generates a video script optimized for AI video generation
export async function POST(req: NextRequest) {
  try {
    const { title, description, niche, duration, lang } = await req.json()
    
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      const durSec = parseInt(duration) || 45
      return NextResponse.json({
        script: `[GUIÓN SIMULADO — ${title}]\n\nEscena 1: Introducción impactante sobre ${title.toLowerCase()}.\n\nEscena 2: Desarrollo del tema principal con datos sorprendentes.\n\nEscena 3: El momento más impactante de la historia.\n\nEscena 4: Conclusión y llamada a la acción.`,
        mode: 'simulation',
      })
    }

    const durSec = parseInt(duration) || 45
    const numScenes = Math.min(Math.ceil(durSec / 10), 4)

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
            content: `Eres un guionista experto en videos virales cortos (YouTube Shorts, TikTok, Reels).

Tu trabajo: Crear un guión de ${numScenes} escenas que sea ENTRETENIDO, ENGANCHANTE y VISUAL.

REGLAS:
- Escribe en español (${lang || 'es-MX'})
- El video dura ${durSec} segundos total (~${numScenes} escenas de ${Math.round(durSec/numScenes)}s cada una)
- Nicho: ${niche}
- Cada escena debe ser VISUALMENTE DESCRIPTIVA — describe lo que se VE, no solo lo que se dice
- Escena 1: GANCHO — algo impactante que atrape en los primeros 3 segundos
- Escenas intermedias: DESARROLLO — datos, historia, drama, tensión creciente
- Última escena: CLIMAX + CTA — el momento más impactante + llamada a la acción
- Cada escena debe conectar narrativamente con la siguiente
- Incluye emociones: sorpresa, miedo, curiosidad, asombro
- NO uses marcas de tiempo como [0:00-0:05]
- Cada escena: 2-3 oraciones descriptivas

Responde SOLO con JSON:
{
  "script": "El guión completo como texto corrido",
  "scenes": ["Escena 1 texto", "Escena 2 texto", ...],
  "hook": "Frase gancho de los primeros 3 segundos",
  "tags": ["tag1", "tag2", "tag3"]
}`
          },
          { role: 'user', content: `Genera un guión viral de ${numScenes} escenas para: "${title}"\nDescripción: ${description || title}` }
        ],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('[script] GPT error:', err)
      return NextResponse.json({ error: `GPT error: ${response.status}` }, { status: 500 })
    }

    const data = await response.json()
    const text = data.choices?.[0]?.message?.content || ''
    
    try {
      const parsed = JSON.parse(text.replace(/```json|```/g, '').trim())
      return NextResponse.json({
        script: parsed.script || parsed.scenes?.join('\n\n') || text,
        scenes: parsed.scenes || [],
        hook: parsed.hook || '',
        tags: parsed.tags || [niche],
        mode: 'gpt',
      })
    } catch {
      return NextResponse.json({ script: text, scenes: [], hook: '', tags: [niche], mode: 'gpt-raw' })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
