import { NextRequest, NextResponse } from 'next/server'

// POST /api/generate/media
// Uses GPT to generate Pexels search queries, then fetches images
export async function POST(req: NextRequest) {
  try {
    const { scenes, niche } = await req.json()

    const pexelsKey = process.env.PEXELS_API_KEY
    const openaiKey = process.env.OPENAI_API_KEY

    if (!pexelsKey) {
      const NICHE_COLORS: Record<string, [string, string]> = {
        history: ['#1a0a00', '#3d1500'], kids: ['#001a1a', '#003d3d'],
        facts: ['#0a001a', '#1a0033'], horror: ['#0a0a0a', '#1a001a'],
        motivation: ['#1a0500', '#3d0a00'], tech: ['#000a1a', '#00153d'],
        lifestyle: ['#1a0010', '#3d0020'], finance: ['#001a0a', '#003d15'],
        gaming: ['#10001a', '#20003d'], other: ['#0a0a12', '#15152a'],
      }
      const colors = NICHE_COLORS[niche] || NICHE_COLORS.other
      const results = (scenes || []).map((s: any, i: number) => ({
        sceneIndex: i, imageUrl: null, bgGradient: colors, source: 'color-fallback',
      }))
      return NextResponse.json({ media: results, mode: 'simulation' })
    }

    // Step 1: GPT generates search queries
    let searchQueries: string[] = []
    if (openaiKey && scenes?.length > 0) {
      try {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            max_tokens: 300,
            response_format: { type: 'json_object' },
            messages: [
              { role: 'system', content: 'Generate Pexels search queries for stock footage. Reply ONLY with JSON: {"queries": ["query1", "query2", ...]}. Keep queries short (2-3 words), visual, specific.' },
              { role: 'user', content: `Generate stock footage queries for ${scenes.length} scenes (niche: ${niche}):\n${scenes.map((s: any, i: number) => `Scene ${i+1}: ${s.text?.slice(0, 60)}`).join('\n')}` },
            ],
          }),
        })
        const data = await res.json()
        const text = data.choices?.[0]?.message?.content || ''
        const parsed = JSON.parse(text.replace(/```json|```/g, '').trim())
        searchQueries = parsed.queries || parsed
      } catch {
        searchQueries = scenes.map((s: any) => (s.text || '').split(' ').slice(0, 3).join(' ') || niche)
      }
    } else {
      searchQueries = scenes.map(() => niche)
    }

    // Step 2: Fetch images from Pexels (limit to 4)
    const limitedQueries = searchQueries.slice(0, 4)
    const media = await Promise.all(
      limitedQueries.map(async (query: string, i: number) => {
        try {
          const res = await fetch(
            `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=portrait`, {
              headers: { Authorization: pexelsKey },
            }
          )
          const data = await res.json()
          const photo = data.photos?.[0]
          return {
            sceneIndex: i,
            imageUrl: photo?.src?.large2x || photo?.src?.large || null,
            photographer: photo?.photographer || null,
            source: 'pexels', query,
          }
        } catch {
          return { sceneIndex: i, imageUrl: null, source: 'failed', query }
        }
      })
    )

    return NextResponse.json({ media, mode: 'pexels' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
