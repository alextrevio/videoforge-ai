import { NextRequest, NextResponse } from 'next/server'

// POST /api/generate/scene-prompts
// Uses GPT to convert script sentences into cinematic visual prompts for Kling
export async function POST(req: NextRequest) {
  try {
    const { scenes, niche } = await req.json()

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey || !scenes?.length) {
      // Fallback: simple English translation of scenes
      const prompts = (scenes || []).map((s: string) => `Cinematic ${niche} scene: ${s.slice(0, 80)}`)
      return NextResponse.json({ prompts, mode: 'fallback' })
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 800,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `You are a visual director for AI video generation. Convert Spanish script sentences into English cinematic video prompts optimized for Kling AI.

Rules:
- Each prompt must be in ENGLISH (Kling works best with English)
- Each prompt should be 1-2 sentences, max 200 chars
- Describe VISUAL SCENES, not narration (what the camera sees)
- Include camera movement: "slow zoom in", "dolly shot", "aerial view", "close-up"
- Include lighting: "golden hour", "dramatic lighting", "neon glow"
- Include style: "cinematic", "photorealistic", "4K quality"
- Match the niche mood: ${niche}

Respond ONLY with JSON: {"prompts": ["prompt1", "prompt2", ...]}`
          },
          {
            role: 'user',
            content: `Convert these ${scenes.length} script scenes (niche: ${niche}) to visual video prompts:\n${scenes.map((s: string, i: number) => `${i + 1}. ${s.slice(0, 100)}`).join('\n')}`
          }
        ],
      }),
    })

    const data = await response.json()
    const text = data.choices?.[0]?.message?.content || ''

    try {
      const parsed = JSON.parse(text.replace(/```json|```/g, '').trim())
      return NextResponse.json({ prompts: parsed.prompts || parsed, mode: 'gpt' })
    } catch {
      const prompts = scenes.map((s: string) => `Cinematic ${niche} scene, photorealistic, 4K: ${s.slice(0, 80)}`)
      return NextResponse.json({ prompts, mode: 'fallback' })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
