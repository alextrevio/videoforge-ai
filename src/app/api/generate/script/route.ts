import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { title, description, niche, duration, lang, nicheStyle } = await req.json()
    
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ script: `[SIMULADO] ${title}`, scenes: [], mode: 'simulation' })
    }

    const durSec = parseInt(duration) || 60
    const sceneDur = parseInt(nicheStyle?.sceneDuration) || 10
    const numScenes = Math.min(Math.ceil(durSec / sceneDur), 6)
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
- Video duration: ${durSec} seconds total, ${numScenes} scenes of ~${sceneDur}s each
- Niche: ${niche}
- Narration style: ${narrationStyle}
- Music mood: ${musicMood}
- Each scene MUST include:
  • NARRATION: ${narrationStyle}
  • DIALOGUE: Characters speaking (if applicable for this niche)
  • EMOTION: What the audience should FEEL
  • VISUAL: Detailed description of what we SEE
  • SOUND: Background sounds/music [${musicMood}]
- Story structure:
  • Scene 1: HOOK — grab attention in first 3 seconds
  • Middle: DEVELOPMENT — build tension, curiosity, or emotion
  • Last scene: PAYOFF — satisfying conclusion, twist, or call to action
- Make it VIRAL — surprising, emotional, or mind-blowing

Respond with JSON:
{
  "script": "Full script with narration and dialogue",
  "scenes": [
    {
      "narration": "Narrator text for this scene",
      "dialogue": "Character dialogue (if any)",
      "emotion": "target emotion",
      "visual": "What we see in detail",
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
