import { NextRequest, NextResponse } from 'next/server'

// POST /api/generate/media
// Fetches stock images/videos from Pexels to use as scene backgrounds
// Claude analyzes the script and suggests search queries per scene
export async function POST(req: NextRequest) {
  try {
    const { scenes, niche } = await req.json()
    // scenes: [{ text: "...", searchHint: "..." }, ...]

    const pexelsKey = process.env.PEXELS_API_KEY
    const anthropicKey = process.env.ANTHROPIC_API_KEY

    if (!pexelsKey) {
      // Return color-based backgrounds per niche
      const NICHE_COLORS: Record<string, [string, string]> = {
        history: ['#1a0a00', '#3d1500'],
        kids: ['#001a1a', '#003d3d'],
        facts: ['#0a001a', '#1a0033'],
        horror: ['#0a0a0a', '#1a001a'],
        motivation: ['#1a0500', '#3d0a00'],
        tech: ['#000a1a', '#00153d'],
        lifestyle: ['#1a0010', '#3d0020'],
        finance: ['#001a0a', '#003d15'],
        gaming: ['#10001a', '#20003d'],
        other: ['#0a0a12', '#15152a'],
      }
      const colors = NICHE_COLORS[niche] || NICHE_COLORS.other
      const results = (scenes || []).map((s: any, i: number) => ({
        sceneIndex: i,
        imageUrl: null,
        videoUrl: null,
        bgGradient: colors,
        source: 'color-fallback',
      }))
      return NextResponse.json({ media: results, mode: 'simulation' })
    }

    // ── Step 1: Use Claude to generate search queries per scene ──
    let searchQueries: string[] = []
    if (anthropicKey && scenes?.length > 0) {
      try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': anthropicKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 500,
            system: 'Generate Pexels search queries for stock footage. Reply ONLY a JSON array of strings, one per scene. Keep queries short (2-3 words), visual, and specific. No markdown.',
            messages: [{
              role: 'user',
              content: `Generate stock footage search queries for these ${scenes.length} scenes (niche: ${niche}):\n${scenes.map((s: any, i: number) => `Scene ${i + 1}: ${s.text?.slice(0, 80)}`).join('\n')}`,
            }],
          }),
        })
        const data = await res.json()
        const text = data.content?.[0]?.text || ''
        searchQueries = JSON.parse(text.replace(/```json|```/g, '').trim())
      } catch {
        // Fallback queries
        searchQueries = scenes.map((s: any) => {
          const words = (s.text || '').split(' ').slice(0, 3).join(' ')
          return words || niche
        })
      }
    } else {
      searchQueries = scenes.map(() => niche)
    }

    // ── Step 2: Fetch images from Pexels ──
    const media = await Promise.all(
      searchQueries.map(async (query: string, i: number) => {
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
            source: 'pexels',
            query,
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
