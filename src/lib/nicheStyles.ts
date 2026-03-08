// ═══════════════════════════════════════════════════════════
// VideoForge AI v5 — Niche Production Styles
// Each niche defines its COMPLETE production approach
// ═══════════════════════════════════════════════════════════

export type ProductionMode = 
  | 'character-lipsync'  // 3D character talks to camera with lip-sync (infantil, gaming)
  | 'cinematic-narrator' // Cinematic footage with voiceover narration (historia, terror)
  | 'stock-narrator'     // Stock footage with voiceover narration (curiosidades, motivación)
  | 'aesthetic-narrator'  // Aesthetic footage with soft narration (lifestyle, finanzas)

export interface NicheStyle {
  label: string
  productionMode: ProductionMode
  videoStyle: string
  promptPrefix: string
  narration: string
  sceneDuration: string
  colorPalette: string
  cameraStyle: string
  musicMood: string
  scriptTone: string
  // Production-specific
  useAIVideo: boolean       // true = Kling, false = Pexels stock
  useLipSync: boolean       // true = Sync Lipsync (only for character modes)
  useVoiceover: boolean     // true = ElevenLabs TTS
  characterPrompt: string   // Describes the recurring character (for character modes)
  voiceStyle: string        // Voice description for ElevenLabs
}

export const NICHE_STYLES: Record<string, NicheStyle> = {
  infantil: {
    label: 'Infantil',
    productionMode: 'character-lipsync',
    videoStyle: '3D Pixar Disney animation',
    promptPrefix: '3D Pixar Disney animation style, cute expressive character with big eyes looking at camera, warm saturated colors, volumetric lighting, close-up portrait shot',
    narration: 'A warm friendly character talking directly to the viewer',
    sceneDuration: '5',
    colorPalette: 'bright warm colors, pastel accents, golden hour lighting',
    cameraStyle: 'static front-facing close-up, slight gentle movement',
    musicMood: 'whimsical orchestral, soft piano, playful',
    scriptTone: 'Pixar character monologue — speaking directly to camera, emotional, wonder-filled, heartwarming',
    useAIVideo: true,
    useLipSync: true,
    useVoiceover: true,
    characterPrompt: 'A cute round colorful 3D animated character with big expressive eyes, looking directly at the camera, mouth slightly open as if speaking, Pixar style, front-facing portrait',
    voiceStyle: 'warm, friendly, childlike wonder',
  },
  historia: {
    label: 'Historia',
    productionMode: 'cinematic-narrator',
    videoStyle: 'cinematic historical documentary',
    promptPrefix: 'Cinematic historical scene, photorealistic, dramatic lighting, epic scale, 4K film quality, wide shot',
    narration: 'A dramatic documentary narrator with authority',
    sceneDuration: '5',
    colorPalette: 'desaturated earth tones, dramatic shadows, golden light',
    cameraStyle: 'slow aerial, dramatic push-in, wide establishing shots',
    musicMood: 'epic orchestral, drums, tension',
    scriptTone: 'Documentary narrator — fascinating facts, dramatic reveals, surprising historical moments',
    useAIVideo: true,
    useLipSync: false,
    useVoiceover: true,
    characterPrompt: '',
    voiceStyle: 'deep, authoritative, dramatic pauses',
  },
  curiosidades: {
    label: 'Curiosidades',
    productionMode: 'stock-narrator',
    videoStyle: 'dynamic educational footage',
    promptPrefix: 'High quality educational footage, vibrant colors, sharp focus, dynamic composition',
    narration: 'An energetic curious narrator who makes facts exciting',
    sceneDuration: '5',
    colorPalette: 'vivid saturated colors, high contrast, clean',
    cameraStyle: 'quick cuts, zoom-ins, dynamic transitions',
    musicMood: 'upbeat electronic, energetic, surprising sound effects',
    scriptTone: 'Excited fact presenter — mind-blowing facts, fast-paced, did-you-know energy',
    useAIVideo: false,
    useLipSync: false,
    useVoiceover: true,
    characterPrompt: '',
    voiceStyle: 'energetic, fast-paced, excited',
  },
  terror: {
    label: 'Terror',
    productionMode: 'cinematic-narrator',
    videoStyle: 'dark cinematic horror',
    promptPrefix: 'Dark atmospheric horror scene, moody low-key lighting, fog, shadows, cinematic 4K, eerie',
    narration: 'A slow suspenseful narrator building tension',
    sceneDuration: '5',
    colorPalette: 'dark blues, deep shadows, cold desaturated, red accents',
    cameraStyle: 'slow creeping dolly, handheld tension, Dutch angles',
    musicMood: 'ambient drones, unsettling strings, sudden silence',
    scriptTone: 'Horror storyteller — building dread, creepy details, twist ending, whispered moments',
    useAIVideo: true,
    useLipSync: false,
    useVoiceover: true,
    characterPrompt: '',
    voiceStyle: 'slow, deep, whispery, suspenseful',
  },
  motivacion: {
    label: 'Motivación',
    productionMode: 'stock-narrator',
    videoStyle: 'inspirational cinematic',
    promptPrefix: 'Inspirational cinematic scene, golden hour, silhouettes, epic landscapes, 4K',
    narration: 'A powerful inspiring voice with conviction',
    sceneDuration: '5',
    colorPalette: 'warm golden tones, sunrise/sunset, lens flares',
    cameraStyle: 'epic slow-motion, aerial sweeps, dramatic reveals',
    musicMood: 'inspiring orchestral, building crescendo, piano and strings',
    scriptTone: 'Motivational speaker — powerful quotes, personal growth, you-can-do-this energy, emotional peaks',
    useAIVideo: false,
    useLipSync: false,
    useVoiceover: true,
    characterPrompt: '',
    voiceStyle: 'powerful, commanding, emotional, inspirational',
  },
  tecnologia: {
    label: 'Tecnología',
    productionMode: 'stock-narrator',
    videoStyle: 'futuristic tech visualization',
    promptPrefix: 'Futuristic technology visualization, holographic displays, clean minimalist, neon accents, 4K',
    narration: 'A knowledgeable tech presenter',
    sceneDuration: '5',
    colorPalette: 'dark backgrounds, neon blue/cyan accents, clean whites',
    cameraStyle: 'smooth orbits, close-up details, rack focus',
    musicMood: 'electronic ambient, synthetic, futuristic',
    scriptTone: 'Tech reviewer — breaking down complex topics simply, wow factor, future predictions',
    useAIVideo: false,
    useLipSync: false,
    useVoiceover: true,
    characterPrompt: '',
    voiceStyle: 'clear, modern, slightly excited',
  },
  lifestyle: {
    label: 'Lifestyle',
    productionMode: 'aesthetic-narrator',
    videoStyle: 'aesthetic lifestyle footage',
    promptPrefix: 'Aesthetic lifestyle scene, natural light, warm tones, beautiful composition',
    narration: 'A relaxed relatable narrator sharing life tips',
    sceneDuration: '5',
    colorPalette: 'warm naturals, soft pastels, golden hour',
    cameraStyle: 'handheld natural, smooth gimbal, intimate close-ups',
    musicMood: 'lo-fi chill, acoustic guitar, relaxing',
    scriptTone: 'Friendly influencer — relatable advice, personal anecdotes, aspirational vibes',
    useAIVideo: false,
    useLipSync: false,
    useVoiceover: true,
    characterPrompt: '',
    voiceStyle: 'relaxed, warm, conversational',
  },
  finanzas: {
    label: 'Finanzas',
    productionMode: 'aesthetic-narrator',
    videoStyle: 'professional financial visualization',
    promptPrefix: 'Professional financial visualization, clean graphs, modern office, premium 4K',
    narration: 'A confident trustworthy financial advisor',
    sceneDuration: '5',
    colorPalette: 'dark navy, gold accents, clean whites',
    cameraStyle: 'steady professional shots, data visualizations',
    musicMood: 'corporate ambient, confident, building momentum',
    scriptTone: 'Financial educator — simple explanations, actionable tips, urgency, money mindset',
    useAIVideo: false,
    useLipSync: false,
    useVoiceover: true,
    characterPrompt: '',
    voiceStyle: 'confident, trustworthy, clear',
  },
  gaming: {
    label: 'Gaming',
    productionMode: 'character-lipsync',
    videoStyle: '3D gaming cinematic',
    promptPrefix: '3D cinematic game character, Unreal Engine quality, dramatic lighting, front-facing portrait, character looking at camera',
    narration: 'An excited gaming character talking to the viewer',
    sceneDuration: '5',
    colorPalette: 'vibrant neons, dark backgrounds, particle effects',
    cameraStyle: 'static front-facing, dramatic lighting, slight movement',
    musicMood: 'intense electronic, dubstep drops, adrenaline',
    scriptTone: 'Excited gamer character — speaking to camera, epic moments, lore, hype energy',
    useAIVideo: true,
    useLipSync: true,
    useVoiceover: true,
    characterPrompt: 'A cool 3D game character with armor and glowing eyes, looking directly at camera, mouth slightly open, dramatic lighting, Unreal Engine quality, front-facing portrait',
    voiceStyle: 'excited, energetic, hyped',
  },
}

export const DEFAULT_STYLE: NicheStyle = {
  label: 'General',
  productionMode: 'cinematic-narrator',
  videoStyle: 'cinematic high quality',
  promptPrefix: 'Cinematic high quality scene, beautiful lighting, 4K, professional',
  narration: 'An engaging clear narrator',
  sceneDuration: '5',
  colorPalette: 'balanced natural colors, cinematic lighting',
  cameraStyle: 'smooth professional camera movements',
  musicMood: 'ambient cinematic, emotional',
  scriptTone: 'Engaging storyteller — clear, interesting, well-paced',
  useAIVideo: true,
  useLipSync: false,
  useVoiceover: true,
  characterPrompt: '',
  voiceStyle: 'clear, engaging, professional',
}

export function getNicheStyle(niche: string): NicheStyle {
  const key = niche.toLowerCase().replace(/[^a-záéíóúñ]/g, '')
  return NICHE_STYLES[key] || DEFAULT_STYLE
}

export function getSceneCount(targetDurationSec: number, sceneDuration: string): number {
  const dur = parseInt(sceneDuration) || 5
  const count = Math.ceil(targetDurationSec / dur)
  return Math.min(Math.max(count, 3), 8)
}
