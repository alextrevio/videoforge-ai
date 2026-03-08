import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { title, description, niche, duration, lang, nicheStyle } = await req.json()
    
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ script: `[SIMULADO] ${title}`, scenes: [], mode: 'simulation' })
    }

    const durSec = parseInt(duration) || 60
    const sceneDur = parseInt(nicheStyle?.sceneDuration) || 5
    const numScenes = Math.min(Math.max(Math.ceil(durSec / sceneDur), 3), 8)
    const tone = nicheStyle?.scriptTone || 'Engaging storyteller'
    const narrationStyle = nicheStyle?.narration || 'An engaging narrator'
    const musicMood = nicheStyle?.musicMood || 'cinematic ambient'

    const productionMode = nicheStyle?.productionMode || 'cinematic-narrator'
    const isCharacterMode = productionMode === 'character-lipsync'
    const characterPrompt = nicheStyle?.characterPrompt || ''

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 2000,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `You are a MASTER VIDEO SCRIPTWRITER for viral short videos. Your style: ${tone}

PRODUCTION MODE: ${isCharacterMode ? 'CHARACTER TALKING TO CAMERA — A 3D animated character speaks directly to the viewer in a monologue. Write as if the character is SPEAKING to the audience. Use first person. The character is expressive, uses rhetorical questions, and reacts emotionally.' : 'NARRATOR OVER FOOTAGE — A narrator speaks while cinematic footage plays. The narration describes what we see. Write vivid visual descriptions that will become video prompts.'}

RULES:
- Write in Spanish (${lang || 'es-MX'})
- Video duration: ${durSec} seconds total
- Create EXACTLY ${numScenes} scenes of ~${sceneDur}s each
- Niche: ${niche}
- Narration style: ${narrationStyle}
- Music mood: ${musicMood}
${isCharacterMode ? `- CHARACTER: The speaker is a 3D animated character. Write their dialogue as a monologue to camera.
- Include emotional reactions: surprise, excitement, seriousness, humor
- Use direct address: "¿Sabían que...?", "Escuchen esto...", "No van a creer..."` : `- VISUAL FOCUS: Each scene must describe what the viewer SEES in cinematic detail
- The narrator speaks OVER the footage, not as a character in frame
- Include atmosphere, lighting, and camera movement in visual descriptions`}

NARRATIVE FLOW (${numScenes} scenes):
  • Scene 1: HOOK — ${isCharacterMode ? 'character grabs attention with a bold statement or question' : 'dramatic opening shot with narrator hook'}
  • Scenes 2-${Math.max(numScenes-2, 2)}: DEVELOPMENT — each scene builds tension or curiosity
  • Scene ${numScenes-1}: CLIMAX — peak moment
  • Scene ${numScenes}: RESOLUTION — satisfying ending + call to action

CRITICAL: Each scene CONNECTS to the next. Continuous story, not random clips.

Respond with JSON:
{
  "script": "Full script ${isCharacterMode ? '(character monologue)' : '(narration over footage)'}",
  "scenes": [
    {
      "narration": "${isCharacterMode ? 'What the character SAYS to camera' : 'What the narrator SAYS over the footage'}",
      "dialogue": "${isCharacterMode ? 'Same as narration (character speaking)' : 'N/A for narrator mode'}",
      "emotion": "target emotion for this moment",
      "visual": "${isCharacterMode ? 'Character expression and gesture (e.g. wide eyes, leaning forward, pointing)' : 'Detailed cinematic scene description for AI video generation'}",
      "sound": "Background sounds/music"
    }
  ],
  "hook": "Opening hook line",
  "tags": ["tag1", "tag2"]
}`
          },
          { role: 'user', content: `Write a viral ${numScenes}-scene script for: "${title}"\nDescription: ${description || title}` }
        ],
      }),
    })

    if (!response.ok) {
      return NextResponse.json({ error: `GPT error: ${response.status}` }, { status: 500 })
    }

    const data = await response.json()
    const text = data.choices?.[0]?.message?.content || ''
    
    try {
      const parsed = JSON.parse(text.replace(/```json|```/g, '').trim())
      const scenes = (parsed.scenes || []).map((s: any) => 
        `${s.narration || ''} ${s.dialogue || ''} ${s.visual || ''}`.trim()
      )
      return NextResponse.json({
        script: parsed.script || scenes.join('\n\n'),
        scenes,
        scenesRich: parsed.scenes,
        hook: parsed.hook || '',
        tags: parsed.tags || [niche],
        mode: 'gpt',
      })
    } catch {
      return NextResponse.json({ script: text, scenes: [], mode: 'gpt-raw' })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
