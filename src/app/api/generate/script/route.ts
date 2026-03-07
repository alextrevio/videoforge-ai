import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { title, description, niche, duration, lang } = await req.json()
    
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ script: `[SIMULADO] ${title}`, scenes: [], mode: 'simulation' })
    }

    const durSec = parseInt(duration) || 60
    const numScenes = Math.min(Math.ceil(durSec / 15), 4) // 15s per scene

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
            content: `You are a PIXAR-LEVEL storyteller who writes scripts for animated short films.

Your scripts are EMOTIONAL, CINEMATIC, and tell a COMPLETE STORY with a beginning, middle, and end.

RULES:
- Write in Spanish (${lang || 'es-MX'})
- The video is ${durSec} seconds total, divided into ${numScenes} scenes of ~${Math.round(durSec/numScenes)} seconds each
- Niche: ${niche}
- Each scene MUST include:
  • NARRATION: A narrator voice telling the story (like a Pixar movie narrator)
  • DIALOGUE: Characters speaking to each other (2-3 lines per scene)
  • EMOTION: What the audience should FEEL (wonder, sadness, joy, surprise)
  • VISUAL DESCRIPTION: What we SEE in detail (like a movie script)
- The story must have:
  • Scene 1: SETUP — introduce the world and main character with wonder
  • Middle scenes: CONFLICT — something goes wrong, tension builds
  • Last scene: RESOLUTION — emotional payoff, heartwarming ending
- Style: Pixar/Disney animated film — warm, colorful, emotionally resonant
- Include sound descriptions: [music swells], [soft piano], [birds chirping]

Respond with JSON:
{
  "script": "Full script with narration, dialogue, and sound cues",
  "scenes": [
    {
      "narration": "The narrator's voice for this scene",
      "dialogue": "Character 1: 'Hello!' Character 2: 'Hi there!'",
      "emotion": "wonder and curiosity",
      "visual": "A tiny robot opens its eyes for the first time in a colorful garden"
    }
  ],
  "hook": "Opening line that hooks the viewer",
  "title_suggestion": "A better title if needed",
  "tags": ["tag1", "tag2"]
}`
          },
          { role: 'user', content: `Write a Pixar-quality animated short script for: "${title}"\nDescription: ${description || title}` }
        ],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
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
        scenesRich: parsed.scenes, // full scene objects with emotion, visual, etc.
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
