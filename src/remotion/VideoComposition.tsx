import React from 'react'
import {
  AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig,
  interpolate, spring, Img, Audio, Easing,
} from 'remotion'

// ═══════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════
export interface SubtitleWord {
  word: string
  start: number
  end: number
  emphasis?: boolean // keyword to punch
}

export interface BRollClip {
  url: string        // image or video URL
  type: 'image' | 'video'
  startSec: number
  endSec: number
}

export interface Scene {
  text: string
  imageUrl?: string
  bRoll?: BRollClip[]  // rapid-cut B-roll clips
  bgColor?: string
  startSec: number
  endSec: number
  transition?: 'zoom-in' | 'zoom-out' | 'slide-left' | 'slide-right' | 'glitch' | 'flash' | 'none'
}

export interface VideoProps {
  scenes: Scene[]
  subtitles: SubtitleWord[]
  audioUrl?: string
  musicUrl?: string       // background music
  musicVolume?: number    // 0-1
  title: string
  hookText?: string       // first 2 sec text
  niche: string
  accentColor: string
  bgGradient: [string, string]
  fps: number
  durationInFrames: number
}

// ═══════════════════════════════════════════════════════
// UTILS
// ═══════════════════════════════════════════════════════
const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max)

// Transition presets: each returns {opacity, transform, filter} for the frame
function getTransitionStyle(
  type: Scene['transition'], frame: number, fps: number, totalFrames: number
) {
  const enterFrames = Math.round(fps * 0.4)
  const exitFrames = Math.round(fps * 0.3)
  const exitStart = totalFrames - exitFrames

  // Enter
  let enterOpacity = interpolate(frame, [0, enterFrames], [0, 1], { extrapolateRight: 'clamp' })
  let enterTransform = ''
  let enterFilter = ''

  switch (type) {
    case 'zoom-in': {
      const s = interpolate(frame, [0, enterFrames], [1.3, 1], {
        extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic),
      })
      enterTransform = `scale(${s})`
      break
    }
    case 'zoom-out': {
      const s = interpolate(frame, [0, enterFrames], [0.8, 1], {
        extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic),
      })
      enterTransform = `scale(${s})`
      break
    }
    case 'slide-left': {
      const x = interpolate(frame, [0, enterFrames], [80, 0], {
        extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic),
      })
      enterTransform = `translateX(${x}px)`
      break
    }
    case 'slide-right': {
      const x = interpolate(frame, [0, enterFrames], [-80, 0], {
        extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic),
      })
      enterTransform = `translateX(${x}px)`
      break
    }
    case 'glitch': {
      const glitchOn = frame < enterFrames && frame % 4 < 2
      enterTransform = glitchOn ? `translateX(${(frame % 7) - 3}px) skewX(${(frame % 5) - 2}deg)` : ''
      enterFilter = glitchOn ? 'hue-rotate(90deg) saturate(2)' : ''
      enterOpacity = frame < 3 ? 0 : 1
      break
    }
    case 'flash': {
      enterOpacity = frame < 2 ? 3 : interpolate(frame, [2, enterFrames], [2, 1], { extrapolateRight: 'clamp' })
      break
    }
    default:
      break
  }

  // Exit fade
  const exitOpacity = frame >= exitStart
    ? interpolate(frame, [exitStart, totalFrames], [1, 0], { extrapolateRight: 'clamp' })
    : 1

  return {
    opacity: clamp(enterOpacity * exitOpacity, 0, 1),
    transform: enterTransform,
    filter: enterFilter,
  }
}

// ═══════════════════════════════════════════════════════
// HOOK SCREEN (first 2 seconds)
// ═══════════════════════════════════════════════════════
const HookScreen: React.FC<{ text: string; accent: string }> = ({ text, accent }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // Dramatic scale-in
  const scale = spring({ fps, frame, config: { damping: 8, stiffness: 300, mass: 0.5 } })
  // Shake on impact
  const shakeX = frame > fps * 0.15 && frame < fps * 0.5
    ? Math.sin(frame * 2.5) * interpolate(frame, [fps * 0.15, fps * 0.5], [8, 0], { extrapolateRight: 'clamp' })
    : 0
  // Flash
  const flashOpacity = interpolate(frame, [0, 3, 8], [1, 1, 0], { extrapolateRight: 'clamp' })
  // BG pulse
  const bgPulse = interpolate(frame, [0, fps * 0.3, fps * 0.6], [0.3, 0, 0.15], { extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill>
      {/* Dark bg with pulse */}
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 50%, ${accent}${Math.round(bgPulse * 255).toString(16).padStart(2, '0')}, #000 70%)` }} />

      {/* Flash frame */}
      <AbsoluteFill style={{ background: '#fff', opacity: flashOpacity }} />

      {/* Hook text */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 40,
        transform: `scale(${scale}) translateX(${shakeX}px)`,
      }}>
        <h1 style={{
          fontSize: 72,
          fontWeight: 900,
          fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
          color: '#fff',
          textAlign: 'center',
          textTransform: 'uppercase',
          lineHeight: 1.1,
          letterSpacing: '-2px',
          textShadow: `0 0 40px ${accent}, 0 0 80px ${accent}60, 0 8px 30px rgba(0,0,0,0.8)`,
        }}>
          {text}
        </h1>
      </div>

      {/* Corner accent lines */}
      <div style={{ position: 'absolute', top: 40, left: 40, width: 60, height: 4, background: accent, opacity: scale }} />
      <div style={{ position: 'absolute', top: 40, left: 40, width: 4, height: 60, background: accent, opacity: scale }} />
      <div style={{ position: 'absolute', bottom: 40, right: 40, width: 60, height: 4, background: accent, opacity: scale }} />
      <div style={{ position: 'absolute', bottom: 40, right: 40, width: 4, height: 60, background: accent, opacity: scale }} />
    </AbsoluteFill>
  )
}

// ═══════════════════════════════════════════════════════
// SUBTITLES (CapCut/TikTok style with dramatic zoom)
// ═══════════════════════════════════════════════════════
const Subtitles: React.FC<{ words: SubtitleWord[]; accentColor: string }> = ({ words, accentColor }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const sec = frame / fps

  // Group words: 4 at a time
  const GRP = 4
  let activeGroup: SubtitleWord[] = []
  let groupStart = 0

  for (let i = 0; i < words.length; i += GRP) {
    const g = words.slice(i, i + GRP)
    const s = g[0]?.start ?? 0
    const e = g[g.length - 1]?.end ?? 0
    if (sec >= s - 0.05 && sec <= e + 0.2) {
      activeGroup = g
      groupStart = s
      break
    }
  }

  if (activeGroup.length === 0) return null

  // Group entrance spring
  const gFrame = Math.max((sec - groupStart) * fps, 0)
  const gScale = spring({ fps, frame: gFrame, config: { damping: 10, stiffness: 280, mass: 0.4 } })

  return (
    <div style={{
      position: 'absolute', bottom: 220, left: 30, right: 30,
      display: 'flex', flexWrap: 'wrap', justifyContent: 'center',
      gap: '6px 10px',
      transform: `scale(${gScale})`,
    }}>
      {activeGroup.map((w, i) => {
        const isActive = sec >= w.start && sec <= w.end
        const isPast = sec > w.end
        const isEmphasis = w.emphasis

        // Active word: dramatic zoom + shake
        const wordFrame = isActive ? (sec - w.start) * fps : 0
        const popScale = isActive
          ? spring({ fps, frame: wordFrame, config: { damping: 6, stiffness: 400, mass: 0.3 } })
          : 1
        const shake = isActive && isEmphasis && wordFrame < fps * 0.2
          ? Math.sin(wordFrame * 3) * 3 : 0

        // Size: active words are bigger, emphasis even bigger
        const size = isActive ? (isEmphasis ? 62 : 54) : 48

        return (
          <span key={`${w.word}-${i}-${groupStart}`} style={{
            fontSize: size,
            fontWeight: 900,
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            color: isActive ? '#fff' : isPast ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.25)',
            textShadow: isActive
              ? `0 0 30px ${accentColor}, 0 6px 20px rgba(0,0,0,0.9), 0 0 60px ${accentColor}50`
              : '0 3px 10px rgba(0,0,0,0.7)',
            background: isActive ? accentColor : 'transparent',
            padding: isActive ? '6px 16px' : '4px 2px',
            borderRadius: isActive ? 10 : 0,
            transform: `scale(${popScale}) translateX(${shake}px)`,
            textTransform: 'uppercase',
            letterSpacing: '-0.5px',
            lineHeight: 1.2,
            WebkitTextStroke: isActive ? '0' : '0.5px rgba(0,0,0,0.3)',
          }}>
            {w.word}
          </span>
        )
      })}
    </div>
  )
}

// ═══════════════════════════════════════════════════════
// SCENE (with B-roll rapid cuts + Ken Burns)
// ═══════════════════════════════════════════════════════
const SceneView: React.FC<{
  scene: Scene
  sceneIndex: number
  bgGradient: [string, string]
  accentColor: string
}> = ({ scene, sceneIndex, bgGradient, accentColor }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const sceneDur = scene.endSec - scene.startSec
  const totalFrames = Math.round(sceneDur * fps)

  // Transition style
  const trans = getTransitionStyle(scene.transition || 'none', frame, fps, totalFrames)

  // Ken Burns: alternate between different patterns per scene
  const patterns = [
    { zoom: [1, 1.2], panX: [0, -30], panY: [0, -15] },
    { zoom: [1.15, 1], panX: [-20, 20], panY: [10, -10] },
    { zoom: [1, 1.1], panX: [15, -15], panY: [-5, 5] },
    { zoom: [1.2, 1.05], panX: [0, 0], panY: [-20, 10] },
  ]
  const pat = patterns[sceneIndex % patterns.length]
  const zoom = interpolate(frame, [0, totalFrames], pat.zoom as [number, number], { extrapolateRight: 'clamp' })
  const panX = interpolate(frame, [0, totalFrames], pat.panX as [number, number], { extrapolateRight: 'clamp' })
  const panY = interpolate(frame, [0, totalFrames], pat.panY as [number, number], { extrapolateRight: 'clamp' })

  // B-roll rapid cuts (if available)
  const bRoll = scene.bRoll || []
  const hasBRoll = bRoll.length > 0

  // Determine which B-roll clip is active (rapid 2-3 second cuts)
  const sceneLocalSec = frame / fps
  let activeBRoll: BRollClip | null = null
  if (hasBRoll) {
    for (const clip of bRoll) {
      const localStart = clip.startSec - scene.startSec
      const localEnd = clip.endSec - scene.startSec
      if (sceneLocalSec >= localStart && sceneLocalSec < localEnd) {
        activeBRoll = clip
        break
      }
    }
  }

  // Vignette intensity
  const vignette = 0.6

  return (
    <AbsoluteFill style={{
      opacity: trans.opacity,
      transform: trans.transform,
      filter: trans.filter,
    }}>
      {/* Background: B-roll clip or main image or gradient */}
      {activeBRoll ? (
        <div style={{ position: 'absolute', inset: -30, overflow: 'hidden' }}>
          <Img src={activeBRoll.url} style={{
            width: '115%', height: '115%', objectFit: 'cover',
            transform: `scale(${zoom}) translate(${panX}px, ${panY}px)`,
            filter: 'brightness(0.45) contrast(1.15) saturate(1.2)',
          }} />
        </div>
      ) : scene.imageUrl ? (
        <div style={{ position: 'absolute', inset: -30, overflow: 'hidden' }}>
          <Img src={scene.imageUrl} style={{
            width: '115%', height: '115%', objectFit: 'cover',
            transform: `scale(${zoom}) translate(${panX}px, ${panY}px)`,
            filter: 'brightness(0.4) contrast(1.15) saturate(1.1)',
          }} />
        </div>
      ) : (
        <AbsoluteFill style={{
          background: `linear-gradient(${155 + sceneIndex * 20}deg, ${scene.bgColor || bgGradient[0]}, ${bgGradient[1]})`,
        }} />
      )}

      {/* Cinematic overlays */}
      <AbsoluteFill style={{
        background: `radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,${vignette}) 100%)`,
      }} />
      <AbsoluteFill style={{
        background: 'linear-gradient(180deg, rgba(0,0,0,0.4) 0%, transparent 25%, transparent 60%, rgba(0,0,0,0.6) 100%)',
      }} />

      {/* Film grain noise overlay */}
      <AbsoluteFill style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        opacity: 0.03,
        mixBlendMode: 'overlay',
      }} />

      {/* Accent color strip (side bar) */}
      <div style={{
        position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 4,
        background: `linear-gradient(180deg, transparent, ${accentColor}, transparent)`,
        opacity: 0.4,
      }} />
    </AbsoluteFill>
  )
}

// ═══════════════════════════════════════════════════════
// MAIN COMPOSITION
// ═══════════════════════════════════════════════════════
export const VideoComposition: React.FC<VideoProps> = ({
  scenes, subtitles, audioUrl, musicUrl, musicVolume = 0.15,
  title, hookText, accentColor, bgGradient, fps, durationInFrames,
}) => {
  // Assign transitions to scenes automatically
  const TRANSITIONS: Scene['transition'][] = [
    'zoom-in', 'slide-left', 'flash', 'zoom-out', 'slide-right', 'glitch', 'zoom-in', 'slide-left',
  ]

  // Hook duration (first 2 seconds)
  const hookFrames = Math.round(fps * 2)
  const hasHook = !!hookText

  return (
    <AbsoluteFill style={{ background: '#000' }}>

      {/* ── Hook Screen (first 2 seconds) ── */}
      {hasHook && (
        <Sequence from={0} durationInFrames={hookFrames}>
          <HookScreen text={hookText!} accent={accentColor} />
        </Sequence>
      )}

      {/* ── Scenes ── */}
      {scenes.map((scene, i) => {
        const from = Math.round(scene.startSec * fps) + (hasHook ? hookFrames : 0)
        const dur = Math.round((scene.endSec - scene.startSec) * fps)
        const enriched = { ...scene, transition: scene.transition || TRANSITIONS[i % TRANSITIONS.length] }
        return (
          <Sequence key={i} from={from} durationInFrames={dur}>
            <SceneView
              scene={enriched}
              sceneIndex={i}
              bgGradient={bgGradient}
              accentColor={accentColor}
            />
          </Sequence>
        )
      })}

      {/* ── Subtitles (always on top of everything) ── */}
      <Subtitles words={subtitles} accentColor={accentColor} />

      {/* ── Narration Audio ── */}
      {audioUrl && <Audio src={audioUrl} />}

      {/* ── Background Music (low volume) ── */}
      {musicUrl && <Audio src={musicUrl} volume={musicVolume} />}

      {/* ── Top safe area gradient ── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 120,
        background: 'linear-gradient(180deg, rgba(0,0,0,0.5) 0%, transparent 100%)',
        pointerEvents: 'none',
      }} />

      {/* ── Bottom safe area gradient ── */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 180,
        background: 'linear-gradient(0deg, rgba(0,0,0,0.5) 0%, transparent 100%)',
        pointerEvents: 'none',
      }} />

      {/* ── Letterbox bars (cinematic feel) ── */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: accentColor, opacity: 0.3 }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: accentColor, opacity: 0.3 }} />
    </AbsoluteFill>
  )
}
