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

    const productionMode = nicheStyle?.productionMode || 'cinematic-narrator'
    const isCharacterMode = productionMode === 'character-lipsync'
    const characterDesc = nicheStyle?.characterPrompt || ''

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

PRODUCTION MODE: ${isCharacterMode ? 'CHARACTER TALKING TO CAMERA' : 'CINEMATIC FOOTAGE WITH NARRATION'}

STYLE: ${videoStyle}
COLOR PALETTE: ${colorPalette}
CAMERA: ${cameraStyle}

${isCharacterMode ? `CHARACTER MODE RULES:
- EVERY prompt shows the SAME character in a CLOSE-UP FRONT-FACING shot
- Character description: ${characterDesc}
- The character is ALWAYS looking at the camera
- Only the CHARACTER'S EXPRESSION changes between scenes (happy, surprised, serious, excited)
- Background can change slightly but character stays the same
- Think: TikTok talking head video, not a movie
- Format: "[character description], [expression], [background], [lighting]"
` : `NARRATOR MODE RULES:
- Each prompt shows a DIFFERENT cinematic scene matching the narration
- NO characters looking at camera — this is footage with a voice-over
- Each scene should be visually distinct but maintain the same color palette
- Include camera movement, lighting, and atmospheric details
- Think: documentary or cinematic b-roll, not talking head
- Format: "[scene description], [camera movement], [lighting], [atmosphere]"
`}
EVERY prompt MUST:
- Start with: "${prefix}"
- Be in ENGLISH only
- Be 2-3 sentences, max 300 characters

Niche: ${niche} | Title: "${title}"

Respond with JSON:
{
  "character": "${isCharacterMode ? 'Exact character description used in every prompt' : 'N/A'}",
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
