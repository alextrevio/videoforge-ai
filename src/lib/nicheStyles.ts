// Each niche has its own visual style, video approach, and prompt strategy
export const NICHE_STYLES: Record<string, {
  label: string
  videoStyle: string       // Core visual style for AI video prompts
  promptPrefix: string     // Prepended to every scene prompt
  narration: string        // How the script should be narrated
  sceneDuration: string    // '5' or '10' seconds per clip
  useStock: boolean        // Prefer stock footage (Pexels) over AI generation
  colorPalette: string     // Color guidance for prompts
  cameraStyle: string      // Camera movement style
  musicMood: string        // Background music direction
  scriptTone: string       // How GPT should write the script
}> = {
  infantil: {
    label: 'Infantil',
    videoStyle: '3D Pixar Disney animation',
    promptPrefix: '3D Pixar Disney animation style, cute expressive characters with big eyes, warm saturated colors, volumetric lighting',
    narration: 'A warm, friendly narrator telling a story to children, with character dialogue',
    sceneDuration: '10',
    useStock: false,
    colorPalette: 'bright warm colors, pastel accents, golden hour lighting',
    cameraStyle: 'slow dolly, gentle tracking, crane shots',
    musicMood: 'whimsical orchestral, soft piano, playful',
    scriptTone: 'Pixar storyteller — emotional, wonder-filled, heartwarming ending',
  },
  historia: {
    label: 'Historia',
    videoStyle: 'cinematic historical documentary',
    promptPrefix: 'Cinematic historical scene, photorealistic, dramatic lighting, epic scale, 4K film quality',
    narration: 'A dramatic documentary narrator, authoritative and engaging',
    sceneDuration: '10',
    useStock: false,
    colorPalette: 'desaturated earth tones, dramatic shadows, golden light',
    cameraStyle: 'slow aerial, dramatic push-in, wide establishing shots',
    musicMood: 'epic orchestral, drums, tension',
    scriptTone: 'Documentary narrator — fascinating facts, dramatic reveals, "you won\'t believe" moments',
  },
  curiosidades: {
    label: 'Curiosidades',
    videoStyle: 'dynamic educational footage',
    promptPrefix: 'High quality stock footage style, vibrant colors, sharp focus, educational documentary',
    narration: 'An energetic, curious narrator who makes facts exciting',
    sceneDuration: '5',
    useStock: true,
    colorPalette: 'vivid saturated colors, high contrast, clean',
    cameraStyle: 'quick cuts, zoom-ins, dynamic transitions',
    musicMood: 'upbeat electronic, energetic, surprising sound effects',
    scriptTone: 'Excited fact presenter — mind-blowing facts, "did you know?", fast-paced',
  },
  terror: {
    label: 'Terror',
    videoStyle: 'dark cinematic horror',
    promptPrefix: 'Dark atmospheric horror scene, moody low-key lighting, fog, shadows, cinematic 4K',
    narration: 'A slow, suspenseful narrator building tension and dread',
    sceneDuration: '10',
    useStock: false,
    colorPalette: 'dark blues, deep shadows, cold desaturated, red accents',
    cameraStyle: 'slow creeping dolly, handheld tension, Dutch angles',
    musicMood: 'ambient drones, unsettling strings, sudden silence',
    scriptTone: 'Horror storyteller — building dread, creepy details, twist ending',
  },
  motivacion: {
    label: 'Motivación',
    videoStyle: 'inspirational cinematic',
    promptPrefix: 'Inspirational cinematic scene, golden hour, silhouettes, epic landscapes, motivational 4K',
    narration: 'A powerful, inspiring voice with conviction and emotion',
    sceneDuration: '5',
    useStock: true,
    colorPalette: 'warm golden tones, sunrise/sunset, lens flares',
    cameraStyle: 'epic slow-motion, aerial sweeps, dramatic reveals',
    musicMood: 'inspiring orchestral, building crescendo, piano and strings',
    scriptTone: 'Motivational speaker — powerful quotes, personal growth, "you can do this"',
  },
  tecnologia: {
    label: 'Tecnología',
    videoStyle: 'futuristic tech visualization',
    promptPrefix: 'Futuristic technology visualization, holographic displays, clean minimalist design, neon accents, 4K',
    narration: 'A knowledgeable, slightly excited tech presenter',
    sceneDuration: '5',
    useStock: true,
    colorPalette: 'dark backgrounds, neon blue/cyan accents, clean whites',
    cameraStyle: 'smooth orbits, close-up details, rack focus',
    musicMood: 'electronic ambient, synthetic, futuristic',
    scriptTone: 'Tech reviewer — breaking down complex topics simply, wow factor',
  },
  lifestyle: {
    label: 'Lifestyle',
    videoStyle: 'aesthetic lifestyle footage',
    promptPrefix: 'Aesthetic lifestyle scene, natural light, warm tones, beautiful composition, Instagram quality',
    narration: 'A relaxed, relatable narrator sharing life tips',
    sceneDuration: '5',
    useStock: true,
    colorPalette: 'warm naturals, soft pastels, golden hour',
    cameraStyle: 'handheld natural, smooth gimbal, intimate close-ups',
    musicMood: 'lo-fi chill, acoustic guitar, relaxing',
    scriptTone: 'Friendly influencer — relatable advice, personal anecdotes, aspirational',
  },
  finanzas: {
    label: 'Finanzas',
    videoStyle: 'professional financial visualization',
    promptPrefix: 'Professional financial visualization, clean graphs, modern office, money imagery, premium 4K',
    narration: 'A confident, trustworthy financial advisor voice',
    sceneDuration: '5',
    useStock: true,
    colorPalette: 'dark navy, gold accents, clean whites, professional',
    cameraStyle: 'steady professional shots, data visualizations, split screens',
    musicMood: 'corporate ambient, confident, building momentum',
    scriptTone: 'Financial educator — simple explanations, actionable tips, urgency',
  },
  gaming: {
    label: 'Gaming',
    videoStyle: '3D gaming cinematic',
    promptPrefix: '3D cinematic game-style scene, Unreal Engine quality, dramatic action, vibrant colors, 4K',
    narration: 'An excited, energetic gaming commentator',
    sceneDuration: '5',
    useStock: false,
    colorPalette: 'vibrant neons, dark backgrounds, particle effects, explosions',
    cameraStyle: 'fast dynamic, action tracking, slow-mo moments',
    musicMood: 'intense electronic, dubstep drops, adrenaline',
    scriptTone: 'Excited gamer — epic moments, lore deep-dives, "insane" reactions',
  },
}

// Default fallback for unknown niches
export const DEFAULT_STYLE = {
  label: 'General',
  videoStyle: 'cinematic high quality',
  promptPrefix: 'Cinematic high quality scene, beautiful lighting, 4K, professional',
  narration: 'An engaging, clear narrator',
  sceneDuration: '5',
  useStock: false,
  colorPalette: 'balanced natural colors, cinematic lighting',
  cameraStyle: 'smooth professional camera movements',
  musicMood: 'ambient cinematic, emotional',
  scriptTone: 'Engaging storyteller — clear, interesting, well-paced',
}

export function getNicheStyle(niche: string) {
  const key = niche.toLowerCase().replace(/\s+/g, '')
  return NICHE_STYLES[key] || DEFAULT_STYLE
}
