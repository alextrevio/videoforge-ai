import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { scenes, scenesRich, niche, title } = await req.json()

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      const prompts = (scenes || []).map((s: string) => `Pixar Disney 3D animation style, ${s.slice(0, 80)}`)
      return NextResponse.json({ prompts, mode: 'fallback' })
    }

    // Use the rich scenes if available
    const sceneDescriptions = (scenesRich || []).map((s: any, i: number) => 
      `Scene ${i+1}: Visual: ${s.visual || scenes?.[i]?.slice(0, 120) || ''} | Emotion: ${s.emotion || 'wonder'}`
    )
    if (sceneDescriptions.length === 0 && scenes?.length) {
      scenes.forEach((s: string, i: number) => sceneDescriptions.push(`Scene ${i+1}: ${s.slice(0, 150)}`))
    }

    const numScenes = sceneDescriptions.length || 4

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 1500,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `You are a VISUAL DIRECTOR for Pixar/Disney-style animated short films.

Your job: Create ${numScenes} VIDEO GENERATION PROMPTS that produce beautiful 3D animated scenes.

CRITICAL STYLE RULES — EVERY prompt MUST include:
- "3D Pixar Disney animation style" as the FIRST words
- Warm, saturated color palette (like Up, Coco, Inside Out)
- Expressive character faces with big eyes and emotions
- Cinematic lighting: volumetric rays, golden hour, soft ambient
- Rich detailed environments with depth and atmosphere
- Camera movement: slow push-in, dolly, crane shot, tracking
- The SAME characters and visual style across ALL scenes (consistency!)

CHARACTER DESIGN (maintain across ALL scenes):
- Main character should look the SAME in every scene
- Describe character's specific features: colors, shape, size, clothing
- Example: "a small round turquoise robot with big golden eyes and tiny antenna"

EACH PROMPT: 2-3 sentences, ENGLISH only, max 300 characters

Niche: ${niche}
Title: "${title || 'Animated Short'}"

Respond with JSON:
{
  "character": "Detailed description of the main character (used in every scene)",
  "style": "The consistent visual style for all scenes",
  "prompts": ["scene 1 prompt", "scene 2 prompt", ...]
}`
          },
          {
            role: 'user',
            content: `Create ${numScenes} Pixar-style animation prompts for these scenes:\n\n${sceneDescriptions.join('\n')}`
          }
        ],
      }),
    })

    if (!response.ok) {
      const prompts = (scenes || []).map((s: string) => `3D Pixar Disney animation style, cute animated characters, warm colorful lighting, cinematic: ${s.slice(0, 80)}`)
      return NextResponse.json({ prompts, mode: 'fallback' })
    }

    const data = await response.json()
    const text = data.choices?.[0]?.message?.content || ''

    try {
      const parsed = JSON.parse(text.replace(/```json|```/g, '').trim())
      console.log('[scene-prompts] Character:', parsed.character?.slice(0, 80), '| Style:', parsed.style?.slice(0, 60))
      return NextResponse.json({
        prompts: parsed.prompts || [],
        character: parsed.character,
        style: parsed.style,
        mode: 'gpt-director'
      })
    } catch {
      const prompts = (scenes || []).map((s: string) => `3D Pixar Disney animation style, cute characters, warm lighting: ${s.slice(0, 80)}`)
      return NextResponse.json({ prompts, mode: 'fallback' })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
