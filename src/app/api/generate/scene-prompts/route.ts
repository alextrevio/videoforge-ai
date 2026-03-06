import { NextRequest, NextResponse } from 'next/server'

// POST /api/generate/scene-prompts
// GPT acts as a creative director — generates a cohesive storyboard
// Each scene connects to the next with visual continuity
export async function POST(req: NextRequest) {
  try {
    const { scenes, niche, title, script } = await req.json()

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      const prompts = (scenes || []).map((s: string) => `Cinematic ${niche} scene, photorealistic, 4K: ${s.slice(0, 80)}`)
      return NextResponse.json({ prompts, mode: 'fallback' })
    }

    const numScenes = Math.min((scenes || []).length, 4)

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 1200,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `You are a CREATIVE DIRECTOR for AI-generated short videos (YouTube Shorts, TikTok, Reels).

Your job: Create a ${numScenes}-scene STORYBOARD that tells a compelling, cohesive visual story.

CRITICAL RULES:
- ALL prompts must be in ENGLISH (the AI video model works best in English)
- Each scene is 5 seconds of video — describe what the CAMERA SEES, not narration
- Scenes must CONNECT logically: Scene 1 sets up → Scene 2 develops → Scene 3 climax → Scene 4 resolution
- Maintain VISUAL CONTINUITY: same color palette, same visual style, same world
- Include SPECIFIC camera directions: "slow dolly forward", "aerial tracking shot", "close-up rotating"
- Include LIGHTING: "golden hour", "dramatic side lighting", "neon glow", "moody low-key"
- Include MOOD/ATMOSPHERE: "mysterious fog", "vibrant energy", "serene calm"
- Make it CINEMATIC: think movie trailer quality, not stock footage
- Each prompt: 2-3 sentences, max 250 characters
- Style: photorealistic, cinematic, 4K quality

The niche is: ${niche}
${title ? `The video title is: "${title}"` : ''}

Respond with JSON:
{
  "concept": "One sentence describing the overall video concept",
  "style": "The consistent visual style for all scenes",
  "prompts": ["scene 1 prompt", "scene 2 prompt", ...]
}`
          },
          {
            role: 'user',
            content: `Create a ${numScenes}-scene cinematic storyboard for this video:\n\nScript excerpts:\n${(scenes || []).map((s: string, i: number) => `Scene ${i+1}: ${s.slice(0, 120)}`).join('\n')}`
          }
        ],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('[scene-prompts] GPT error:', err)
      const prompts = (scenes || []).map((s: string) => `Cinematic ${niche} scene, photorealistic, 4K, dramatic lighting: ${s.slice(0, 80)}`)
      return NextResponse.json({ prompts, mode: 'fallback' })
    }

    const data = await response.json()
    const text = data.choices?.[0]?.message?.content || ''

    try {
      const parsed = JSON.parse(text.replace(/```json|```/g, '').trim())
      console.log('[scene-prompts] Concept:', parsed.concept, '| Style:', parsed.style)
      return NextResponse.json({
        prompts: parsed.prompts || [],
        concept: parsed.concept,
        style: parsed.style,
        mode: 'gpt-director'
      })
    } catch {
      const prompts = (scenes || []).map((s: string) => `Cinematic ${niche} scene, photorealistic, 4K: ${s.slice(0, 80)}`)
      return NextResponse.json({ prompts, mode: 'fallback' })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
