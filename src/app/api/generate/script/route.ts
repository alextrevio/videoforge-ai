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
            content: `You are a MASTER VIDEO SCRIPTWRITER. Your style: ${tone}

RULES:
- Write in Spanish (${lang || 'es-MX'})
- Video duration: ${durSec} seconds total
- You MUST create EXACTLY ${numScenes} scenes, each ~${sceneDur} seconds
- Niche: ${niche}
- Narration style: ${narrationStyle}
- Music mood: ${musicMood}

SCENE STRUCTURE — EACH SCENE MUST INCLUDE:
  • NARRATION: ${narrationStyle}
  • DIALOGUE: Characters speaking (if fits the niche)
  • EMOTION: What the audience should FEEL
  • VISUAL: Detailed description of what we SEE (this becomes the AI video prompt)
  • SOUND: Background sounds/music cues

NARRATIVE FLOW (${numScenes} scenes):
  • Scene 1: HOOK — grab attention instantly, introduce world/character
  • Scenes 2-${Math.max(numScenes-2, 2)}: DEVELOPMENT — each scene advances the story, builds tension or curiosity
  • Scene ${numScenes-1}: CLIMAX — peak moment, biggest reveal or emotion
  • Scene ${numScenes}: RESOLUTION — satisfying ending, call to action

CRITICAL: Each scene must CONNECT to the next. The viewer must feel a continuous story, not random clips. Use transitions like "but then...", "meanwhile...", "what happened next changed everything..."

Respond with JSON:
{
  "script": "Full script with narration and dialogue",
  "scenes": [
    {
      "narration": "Narrator text",
      "dialogue": "Character dialogue (if any)",
      "emotion": "target emotion",
      "visual": "Detailed visual description for AI video generation",
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
