import React from 'react'
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig, interpolate, spring, Img, Audio } from 'remotion'

// ── Types ───────────────────────────────────────────────
export interface SubtitleWord {
  word: string
  start: number  // seconds
  end: number    // seconds
}

export interface Scene {
  text: string
  imageUrl?: string    // stock footage/AI image
  bgColor?: string
  startSec: number
  endSec: number
}

export interface VideoProps {
  scenes: Scene[]
  subtitles: SubtitleWord[]
  audioUrl?: string
  title: string
  niche: string
  accentColor: string
  bgGradient: [string, string]
  fps: number
  durationInFrames: number
}

// ── Subtitle Component (TikTok/CapCut style) ────────────
const Subtitles: React.FC<{ words: SubtitleWord[]; accentColor: string }> = ({ words, accentColor }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const currentSec = frame / fps

  // Find current word group (show 4-6 words at a time)
  const WORDS_PER_GROUP = 5
  let groupStart = 0
  let activeGroup: SubtitleWord[] = []

  for (let i = 0; i < words.length; i += WORDS_PER_GROUP) {
    const group = words.slice(i, i + WORDS_PER_GROUP)
    const gStart = group[0]?.start ?? 0
    const gEnd = group[group.length - 1]?.end ?? 0
    if (currentSec >= gStart && currentSec <= gEnd + 0.3) {
      activeGroup = group
      groupStart = gStart
      break
    }
  }

  if (activeGroup.length === 0) return null

  // Entrance animation
  const groupFrame = (currentSec - groupStart) * fps
  const scale = spring({ fps, frame: groupFrame, config: { damping: 12, stiffness: 200 } })

  return (
    <div style={{
      position: 'absolute', bottom: 200, left: 40, right: 40,
      display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px 12px',
      transform: `scale(${scale})`,
    }}>
      {activeGroup.map((w, i) => {
        const isActive = currentSec >= w.start && currentSec <= w.end
        const isPast = currentSec > w.end
        return (
          <span key={`${w.word}-${i}`} style={{
            fontSize: 52,
            fontWeight: 900,
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            color: isActive ? '#fff' : isPast ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.35)',
            textShadow: isActive
              ? `0 0 20px ${accentColor}, 0 4px 12px rgba(0,0,0,0.8), 0 0 40px ${accentColor}40`
              : '0 2px 8px rgba(0,0,0,0.6)',
            background: isActive ? accentColor : 'transparent',
            padding: isActive ? '4px 14px' : '4px 0',
            borderRadius: 8,
            transition: 'all 0.1s',
            textTransform: 'uppercase',
            letterSpacing: '-1px',
          }}>
            {w.word}
          </span>
        )
      })}
    </div>
  )
}

// ── Scene Component ─────────────────────────────────────
const SceneView: React.FC<{ scene: Scene; bgGradient: [string, string] }> = ({ scene, bgGradient }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const sceneDur = scene.endSec - scene.startSec

  // Ken Burns effect on background image
  const zoom = interpolate(frame, [0, sceneDur * fps], [1, 1.15], { extrapolateRight: 'clamp' })
  const panX = interpolate(frame, [0, sceneDur * fps], [0, -20], { extrapolateRight: 'clamp' })

  // Text entrance
  const textOpacity = interpolate(frame, [0, fps * 0.3], [0, 1], { extrapolateRight: 'clamp' })
  const textY = interpolate(frame, [0, fps * 0.3], [30, 0], { extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill>
      {/* Background */}
      {scene.imageUrl ? (
        <div style={{ position: 'absolute', inset: -20, overflow: 'hidden' }}>
          <Img src={scene.imageUrl} style={{
            width: '110%', height: '110%', objectFit: 'cover',
            transform: `scale(${zoom}) translateX(${panX}px)`,
            filter: 'brightness(0.4) contrast(1.1)',
          }} />
        </div>
      ) : (
        <AbsoluteFill style={{
          background: `linear-gradient(165deg, ${scene.bgColor || bgGradient[0]}, ${bgGradient[1]})`,
        }} />
      )}

      {/* Dark overlay */}
      <AbsoluteFill style={{
        background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.7) 100%)',
      }} />

      {/* Scene text (upper area — subtitles go at bottom) */}
      {scene.text && (
        <div style={{
          position: 'absolute', top: 120, left: 50, right: 50,
          opacity: textOpacity,
          transform: `translateY(${textY}px)`,
        }}>
          <p style={{
            fontSize: 36, fontWeight: 700, color: 'rgba(255,255,255,0.15)',
            fontFamily: "'Inter', sans-serif",
            textAlign: 'center', lineHeight: 1.4,
            textTransform: 'uppercase', letterSpacing: 2,
          }}>
            {scene.text.slice(0, 60)}
          </p>
        </div>
      )}
    </AbsoluteFill>
  )
}

// ── Main Composition ────────────────────────────────────
export const VideoComposition: React.FC<VideoProps> = ({
  scenes, subtitles, audioUrl, title, accentColor, bgGradient, fps, durationInFrames,
}) => {
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      {/* Scenes */}
      {scenes.map((scene, i) => (
        <Sequence
          key={i}
          from={Math.round(scene.startSec * fps)}
          durationInFrames={Math.round((scene.endSec - scene.startSec) * fps)}
        >
          <SceneView scene={scene} bgGradient={bgGradient} />
        </Sequence>
      ))}

      {/* Subtitles overlay — always on top */}
      <Subtitles words={subtitles} accentColor={accentColor} />

      {/* Audio track */}
      {audioUrl && <Audio src={audioUrl} />}

      {/* Top gradient + channel branding area */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 100,
        background: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, transparent 100%)',
      }} />
    </AbsoluteFill>
  )
}
