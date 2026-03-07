import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { scenes, scenesRich, niche, title, nicheStyle } = await req.json()

    const apiKey = process.env.OPENAI_API_KEY
    const prefix = nicheStyle?.promptPrefix || 'Cinematic high quality scene, 4K'
    const videoStyle = nicheStyle?.videoStyle || 'cinematic'
    const colorPalette = nicheStyle?.colorPalette || 'balanced natural colors'
    const cameraStyle = nicheStyle?.cameraStyle || 'smooth professional'

    if (!apiKey) {
      const prompts = (scenes || []).map((s: string) => `${prefix}, ${s.slice(0, 80)}`)
      return NextResponse.json({ prompts, mode: 'fallback' })
    }

    const sceneDescriptions = (scenesRich || []).map((s: any, i: number) => 
      `Scene ${i+1}: Visual: ${s.visual || scenes?.[i]?.slice(0, 120) || ''} | Emotion: ${s.emotion || 'engaging'}`
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
            content: `You are a VISUAL DIRECTOR creating ${numScenes} video generation prompts.

STYLE: ${videoStyle}
COLOR PALETTE: ${colorPalette}
CAMERA: ${cameraStyle}

EVERY prompt MUST:
- Start with: "${prefix}"
- Be in ENGLISH only
- Be 2-3 sentences, max 300 characters
- Maintain the SAME characters and visual style across ALL scenes
- Include specific camera movement and lighting

${videoStyle.includes('Pixar') || videoStyle.includes('animation') ? 
  'CHARACTER DESIGN: Define one consistent main character with specific features (colors, shape, size, clothing) that appears in EVERY scene.' :
  'VISUAL CONSISTENCY: Maintain the same visual tone, color grading, and atmosphere across all scenes.'}

Niche: ${niche} | Title: "${title}"

Respond with JSON:
{
  "character": "Main character/subject description (consistent across scenes)",
  "style": "Visual style summary",
  "prompts": ["scene 1 prompt", "scene 2 prompt", ...]
}`
          },
          { role: 'user', content: `Create ${numScenes} prompts for:\n\n${sceneDescriptions.join('\n')}` }
        ],
      }),
    })

    if (!response.ok) {
      const prompts = (scenes || []).map((s: string) => `${prefix}, ${s.slice(0, 80)}`)
      return NextResponse.json({ prompts, mode: 'fallback' })
    }

    const data = await response.json()
    const text = data.choices?.[0]?.message?.content || ''

    try {
      const parsed = JSON.parse(text.replace(/```json|```/g, '').trim())
      console.log('[scene-prompts] Style:', parsed.style?.slice(0, 60), '| Character:', parsed.character?.slice(0, 60))
      return NextResponse.json({ prompts: parsed.prompts || [], character: parsed.character, style: parsed.style, mode: 'gpt-director' })
    } catch {
      const prompts = (scenes || []).map((s: string) => `${prefix}, ${s.slice(0, 80)}`)
      return NextResponse.json({ prompts, mode: 'fallback' })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
