import React from 'react'
import {
  AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig,
  interpolate, spring, Img, Audio, Easing,
} from 'remotion'

// ═══════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════
export interface SubtitleWord { word: string; start: number; end: number; emphasis?: boolean }
export interface BRollClip { url: string; type: 'image'|'video'; startSec: number; endSec: number }
export interface Scene {
  text: string; imageUrl?: string; bRoll?: BRollClip[]; bgColor?: string
  startSec: number; endSec: number
  transition?: 'zoom-in'|'zoom-out'|'slide-left'|'slide-right'|'glitch'|'flash'|'whip'|'none'
}
export interface VideoProps {
  scenes: Scene[]; subtitles: SubtitleWord[]
  audioUrl?: string; musicUrl?: string; musicVolume?: number
  title: string; hookText?: string; ctaText?: string; niche: string
  accentColor: string; secondaryColor?: string; bgGradient: [string, string]
  fps: number; durationInFrames: number
}

// ═══════════════════════════════════════════════════════
// NICHE PRESETS
// ═══════════════════════════════════════════════════════
interface NicheStyle {
  colorGrade: string; particleType: 'dust'|'sparks'|'bokeh'|'snow'|'matrix'|'bubbles'
  particleColor: string; emphasisEmoji: string[]; hookEmoji: string; ctaEmoji: string
  flareColor: string; flareOpacity: number
}
const NICHE_STYLES: Record<string, NicheStyle> = {
  history:    { colorGrade:'sepia(0.2) contrast(1.1) saturate(0.9)',   particleType:'dust',    particleColor:'#D4A044', emphasisEmoji:['⚔️','🏛️','👑','🗡️'], hookEmoji:'🔥', ctaEmoji:'⚡', flareColor:'#E8A838', flareOpacity:0.15 },
  kids:       { colorGrade:'saturate(1.4) brightness(1.1) contrast(0.95)', particleType:'bubbles', particleColor:'#4ECDC4', emphasisEmoji:['🌟','✨','🎉','🤩'], hookEmoji:'🎈', ctaEmoji:'⭐', flareColor:'#4ECDC4', flareOpacity:0.1 },
  facts:      { colorGrade:'contrast(1.15) saturate(1.1)',             particleType:'bokeh',   particleColor:'#A855F7', emphasisEmoji:['🤯','😱','🧠','💡'], hookEmoji:'🤯', ctaEmoji:'🧠', flareColor:'#A855F7', flareOpacity:0.12 },
  horror:     { colorGrade:'contrast(1.3) saturate(0.6) brightness(0.85)', particleType:'dust', particleColor:'#4444AA', emphasisEmoji:['💀','👻','🩸','😈'], hookEmoji:'💀', ctaEmoji:'👻', flareColor:'#6366F1', flareOpacity:0.08 },
  motivation: { colorGrade:'contrast(1.2) saturate(1.15) brightness(1.05)', particleType:'sparks', particleColor:'#FF6B35', emphasisEmoji:['💪','🔥','🚀','🏆'], hookEmoji:'🔥', ctaEmoji:'💪', flareColor:'#EF4444', flareOpacity:0.18 },
  tech:       { colorGrade:'contrast(1.1) saturate(1.05) hue-rotate(10deg)', particleType:'matrix', particleColor:'#06B6D4', emphasisEmoji:['🤖','💻','⚡','🧬'], hookEmoji:'⚡', ctaEmoji:'🤖', flareColor:'#06B6D4', flareOpacity:0.12 },
  lifestyle:  { colorGrade:'contrast(1.05) saturate(1.2) brightness(1.05)', particleType:'bokeh', particleColor:'#EC4899', emphasisEmoji:['✨','💖','🌸','💫'], hookEmoji:'✨', ctaEmoji:'💖', flareColor:'#EC4899', flareOpacity:0.1 },
  finance:    { colorGrade:'contrast(1.15) saturate(0.95)',            particleType:'sparks',  particleColor:'#22C55E', emphasisEmoji:['💰','📈','🏦','💎'], hookEmoji:'💰', ctaEmoji:'📈', flareColor:'#22C55E', flareOpacity:0.12 },
  gaming:     { colorGrade:'contrast(1.2) saturate(1.3) brightness(1.05)', particleType:'sparks', particleColor:'#8B5CF6', emphasisEmoji:['🎮','🕹️','⚡','💥'], hookEmoji:'🎮', ctaEmoji:'⚡', flareColor:'#8B5CF6', flareOpacity:0.15 },
  other:      { colorGrade:'contrast(1.1) saturate(1.05)',             particleType:'bokeh',   particleColor:'#F97316', emphasisEmoji:['🔥','⚡','💡','✨'], hookEmoji:'⚡', ctaEmoji:'🔥', flareColor:'#F97316', flareOpacity:0.12 },
}

// ═══════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════
const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi)
function seededRng(seed: number) { let s = seed; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 } }
const hex = (n: number) => Math.round(clamp(n, 0, 255)).toString(16).padStart(2, '0')

// ═══════════════════════════════════════════════════════
// TRANSITIONS
// ═══════════════════════════════════════════════════════
function getTrans(type: Scene['transition'], f: number, fps: number, total: number) {
  const eF = Math.round(fps * 0.35), xF = Math.round(fps * 0.25), xS = total - xF
  let op = interpolate(f, [0, Math.min(eF, 6)], [0, 1], { extrapolateRight: 'clamp' })
  let tf = '', fl = ''
  switch (type) {
    case 'zoom-in':    { const s = interpolate(f, [0, eF], [1.35, 1], { extrapolateRight:'clamp', easing:Easing.out(Easing.exp) }); tf = `scale(${s})`; break }
    case 'zoom-out':   { const s = interpolate(f, [0, eF], [0.75, 1], { extrapolateRight:'clamp', easing:Easing.out(Easing.exp) }); tf = `scale(${s})`; break }
    case 'slide-left': { const x = interpolate(f, [0, eF], [100, 0], { extrapolateRight:'clamp', easing:Easing.out(Easing.exp) }); tf = `translateX(${x}px)`; break }
    case 'slide-right':{ const x = interpolate(f, [0, eF], [-100, 0], { extrapolateRight:'clamp', easing:Easing.out(Easing.exp) }); tf = `translateX(${x}px)`; break }
    case 'whip':       { const x = interpolate(f, [0, 3, eF], [-200, 15, 0], { extrapolateRight:'clamp' }); const b = interpolate(f, [0, 3, eF], [20, 2, 0], { extrapolateRight:'clamp' }); tf = `translateX(${x}px)`; fl = `blur(${b}px)`; break }
    case 'glitch':     { const on = f < eF && f % 3 < 2; tf = on ? `translateX(${(f%9)-4}px) skewX(${(f%7)-3}deg)` : ''; fl = on ? `hue-rotate(${60+f*15}deg) saturate(3)` : ''; op = f < 2 ? 0 : 1; break }
    case 'flash':      { op = f < 3 ? clamp(4-f,0,3) : interpolate(f, [3, eF], [1.5, 1], { extrapolateRight:'clamp' }); break }
    default: break
  }
  const xOp = f >= xS ? interpolate(f, [xS, total], [1, 0], { extrapolateRight:'clamp' }) : 1
  return { opacity: clamp(op * xOp, 0, 1), transform: tf, filter: fl }
}

// ═══════════════════════════════════════════════════════
// 1. PARTICLES
// ═══════════════════════════════════════════════════════
const Particles: React.FC<{ type: NicheStyle['particleType']; color: string; count?: number }> = ({ type, color, count = 28 }) => {
  const frame = useCurrentFrame()
  const { fps, width, height } = useVideoConfig()
  const rng = seededRng(42)
  const ps = Array.from({ length: count }, () => ({
    x: rng() * width, y: rng() * height,
    sz: 2 + rng() * 5, sp: 0.3 + rng() * 1.2,
    dr: (rng() - 0.5) * 0.5, dl: rng() * 100, op: 0.12 + rng() * 0.35,
  }))
  return <AbsoluteFill style={{ pointerEvents:'none' }}>
    {ps.map((p, i) => {
      const t = (frame + p.dl) / fps
      let x = p.x + Math.sin(t * p.dr * 2) * 40, y = 0, sz = p.sz, ch = ''
      switch (type) {
        case 'dust': y = p.y - t * p.sp * 15; if (y < -10) y = height + (y % height); break
        case 'sparks': y = p.y - t * p.sp * 40; x += Math.sin(t*3+i)*20; if (y<-10) y = height+(y%height); sz *= 0.5+Math.sin(t*5+i)*0.5; break
        case 'bokeh': y = p.y + Math.sin(t*0.5+i)*30; x += Math.cos(t*0.3+i)*20; sz *= 3; break
        case 'snow': y = (p.y + t*p.sp*30) % height; x += Math.sin(t*1.5+i)*25; break
        case 'matrix': y = (p.y + t*p.sp*60) % height; ch = String.fromCharCode(0x30A0+Math.floor(rng()*96)); break
        case 'bubbles': y = p.y - t*p.sp*20; sz *= 2; if (y<-20) y = height+(y%height); break
      }
      if (type === 'matrix') return <div key={i} style={{ position:'absolute', left:x, top:y, fontSize:sz*2, color, opacity:p.op*0.5, fontFamily:'monospace', fontWeight:700 }}>{ch}</div>
      return <div key={i} style={{
        position:'absolute', left:x-sz/2, top:y-sz/2, width:sz, height:sz,
        borderRadius: type==='sparks'?1:'50%',
        background: type==='bokeh'?`radial-gradient(circle,${color}80,transparent)`:color,
        opacity: p.op, boxShadow: type==='sparks'?`0 0 ${sz*2}px ${color}`:'none',
      }} />
    })}
  </AbsoluteFill>
}

// ═══════════════════════════════════════════════════════
// 2. ANAMORPHIC LENS FLARE
// ═══════════════════════════════════════════════════════
const Flare: React.FC<{ color: string; opacity: number }> = ({ color, opacity }) => {
  const f = useCurrentFrame(); const { fps, width } = useVideoConfig(); const t = f / fps
  const x = interpolate(Math.sin(t*0.4), [-1,1], [-width*0.3, width*0.3])
  const pulse = 0.7 + Math.sin(t*2)*0.3
  return <AbsoluteFill style={{ pointerEvents:'none', mixBlendMode:'screen' }}>
    <div style={{ position:'absolute', top:'40%', left:x, width:width*1.5, height:3, background:`linear-gradient(90deg,transparent,${color}${hex(opacity*pulse*255)},transparent)`, filter:'blur(8px)', transform:'translateX(-25%)' }} />
    <div style={{ position:'absolute', top:'42%', left:x+100, width:width, height:1, background:`linear-gradient(90deg,transparent,${color}${hex(opacity*pulse*0.5*255)},transparent)`, filter:'blur(4px)', transform:'translateX(-25%)' }} />
    <div style={{ position:'absolute', top:'38%', left:`${50+Math.sin(t*0.3)*15}%`, width:80, height:80, borderRadius:'50%', background:`radial-gradient(circle,${color}${hex(opacity*0.3*255)},transparent)`, filter:'blur(20px)', transform:'translate(-50%,-50%)' }} />
  </AbsoluteFill>
}

// ═══════════════════════════════════════════════════════
// 3. BEAT SYNC PULSE
// ═══════════════════════════════════════════════════════
const BeatPulse: React.FC<{ accent: string; bpm?: number }> = ({ accent, bpm = 120 }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig()
  const phase = ((f / fps) % (60/bpm)) / (60/bpm)
  const intensity = phase < 0.1 ? interpolate(phase, [0,0.1], [0.25,0.12]) : interpolate(phase, [0.1,1], [0.12,0])
  return <AbsoluteFill style={{ pointerEvents:'none', border:`3px solid ${accent}`, opacity:intensity, boxShadow:`inset 0 0 60px ${accent}${hex(intensity*200)}` }} />
}

// ═══════════════════════════════════════════════════════
// 4. PROGRESS BAR
// ═══════════════════════════════════════════════════════
const ProgressBar: React.FC<{ accent: string }> = ({ accent }) => {
  const f = useCurrentFrame(); const { durationInFrames } = useVideoConfig()
  const pct = (f / durationInFrames) * 100
  return <div style={{ position:'absolute', bottom:0, left:0, right:0, height:4, background:'rgba(255,255,255,0.08)', pointerEvents:'none', zIndex:50 }}>
    <div style={{ height:'100%', width:`${pct}%`, background:accent, boxShadow:`0 0 8px ${accent}, 0 0 16px ${accent}60` }} />
  </div>
}

// ═══════════════════════════════════════════════════════
// 5. EMOJI REACTION
// ═══════════════════════════════════════════════════════
const EmojiPop: React.FC<{ emoji: string; startF: number }> = ({ emoji, startF }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig()
  const lf = f - startF
  if (lf < 0 || lf > fps * 0.8) return null
  const sc = spring({ fps, frame:lf, config:{ damping:5, stiffness:350, mass:0.3 } })
  const y = interpolate(lf, [0, fps*0.8], [0, -70], { extrapolateRight:'clamp' })
  const op = interpolate(lf, [fps*0.4, fps*0.8], [1, 0], { extrapolateRight:'clamp', extrapolateLeft:'clamp' })
  const rot = interpolate(lf, [0, fps*0.3], [-15, 10], { extrapolateRight:'clamp' })
  return <div style={{ position:'absolute', right:45, top:'33%', fontSize:56, transform:`scale(${sc}) translateY(${y}px) rotate(${rot}deg)`, opacity:op, pointerEvents:'none', filter:'drop-shadow(0 4px 12px rgba(0,0,0,0.5))' }}>{emoji}</div>
}

// ═══════════════════════════════════════════════════════
// 6. HOOK SCREEN
// ═══════════════════════════════════════════════════════
const HookScreen: React.FC<{ text: string; accent: string; emoji: string }> = ({ text, accent, emoji }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig()
  const sc = spring({ fps, frame:f, config:{ damping:7, stiffness:350, mass:0.4 } })
  const shk = f > fps*0.12 && f < fps*0.5 ? Math.sin(f*3)*interpolate(f, [fps*0.12, fps*0.5], [10,0], {extrapolateRight:'clamp'}) : 0
  const flash = interpolate(f, [0,2,6], [1,1,0], { extrapolateRight:'clamp' })
  const bg = interpolate(f, [0, fps*0.25, fps*0.6], [0.4,0,0.2], { extrapolateRight:'clamp' })
  const emSc = spring({ fps, frame:Math.max(f-8,0), config:{ damping:5, stiffness:300 } })
  const ring = interpolate(f, [0, fps*2], [0,100], { extrapolateRight:'clamp' })
  return <AbsoluteFill>
    <AbsoluteFill style={{ background:`radial-gradient(circle at 50% 45%, ${accent}${hex(bg*255)}, #000 70%)` }} />
    <AbsoluteFill style={{ background:'#fff', opacity:flash }} />
    {/* Ring */}
    <div style={{ position:'absolute', top:'18%', left:'50%', transform:'translateX(-50%)', width:90, height:90, borderRadius:45, background:`conic-gradient(${accent} ${ring}%, transparent ${ring}%)`, WebkitMask:'radial-gradient(closest-side,transparent 85%,#000 86%)', mask:'radial-gradient(closest-side,transparent 85%,#000 86%)', opacity:sc }} />
    {/* Emoji */}
    <div style={{ position:'absolute', top:'20%', left:'50%', transform:`translate(-50%,-50%) scale(${emSc})`, fontSize:60, filter:'drop-shadow(0 8px 20px rgba(0,0,0,0.5))' }}>{emoji}</div>
    {/* Text */}
    <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', padding:'0 36px', paddingTop:80, transform:`scale(${sc}) translateX(${shk}px)` }}>
      <h1 style={{ fontSize:66, fontWeight:900, fontFamily:"'Inter',sans-serif", color:'#fff', textAlign:'center', textTransform:'uppercase', lineHeight:1.05, letterSpacing:'-2px', textShadow:`0 0 40px ${accent}, 0 0 80px ${accent}50, 0 8px 30px rgba(0,0,0,0.9)`, WebkitTextStroke:'2px rgba(0,0,0,0.3)' }}>{text}</h1>
    </div>
    {/* Corner brackets */}
    {[{top:50,left:50},{top:50,right:50},{bottom:50,left:50},{bottom:50,right:50}].map((p,i)=><React.Fragment key={i}><div style={{position:'absolute',...p,width:40,height:3,background:accent,opacity:sc*0.8}}/><div style={{position:'absolute',...p,width:3,height:40,background:accent,opacity:sc*0.8}}/></React.Fragment>)}
  </AbsoluteFill>
}

// ═══════════════════════════════════════════════════════
// 7. CTA END SCREEN
// ═══════════════════════════════════════════════════════
const CTAScreen: React.FC<{ text: string; accent: string; emoji: string }> = ({ text, accent, emoji }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig()
  const sc = spring({ fps, frame:f, config:{ damping:8, stiffness:250 } })
  const emSc = spring({ fps, frame:Math.max(f-10,0), config:{ damping:5, stiffness:300 } })
  const pulse = 0.85 + Math.sin(f/fps*4)*0.15
  const bgOp = interpolate(f, [0, fps*0.3], [0,1], { extrapolateRight:'clamp' })
  return <AbsoluteFill>
    <AbsoluteFill style={{ background:'#000', opacity:bgOp*0.88 }} />
    <div style={{ position:'absolute', top:'40%', left:'50%', width:400, height:400, borderRadius:'50%', background:`radial-gradient(circle,${accent}20,transparent)`, transform:`translate(-50%,-50%) scale(${pulse})`, filter:'blur(40px)' }} />
    <div style={{ position:'absolute', top:'25%', left:'50%', transform:`translate(-50%,-50%) scale(${emSc})`, fontSize:72, filter:'drop-shadow(0 8px 20px rgba(0,0,0,0.5))' }}>{emoji}</div>
    <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', paddingTop:40, transform:`scale(${sc})` }}>
      <h2 style={{ fontSize:42, fontWeight:900, fontFamily:"'Inter',sans-serif", color:'#fff', textAlign:'center', textTransform:'uppercase', lineHeight:1.1, textShadow:`0 0 30px ${accent}, 0 4px 20px rgba(0,0,0,0.8)`, marginBottom:20 }}>{text}</h2>
      {/* Animated subscribe button */}
      <div style={{ padding:'14px 36px', borderRadius:14, background:accent, transform:`scale(${pulse})`, boxShadow:`0 0 30px ${accent}60, 0 8px 25px rgba(0,0,0,0.5)` }}>
        <span style={{ fontSize:20, fontWeight:900, color:'#fff', fontFamily:"'Inter',sans-serif", textTransform:'uppercase', letterSpacing:1 }}>SUSCRÍBETE ⚡</span>
      </div>
    </div>
    {/* Animated arrows pointing up */}
    {[0,1,2].map(i => {
      const delay = i * 8
      const arrowOp = interpolate((f-delay)%30, [0,15,30], [0,1,0], { extrapolateRight:'clamp', extrapolateLeft:'clamp' })
      return <div key={i} style={{ position:'absolute', bottom:120+i*25, left:'50%', transform:'translateX(-50%)', fontSize:24, opacity:arrowOp*0.6, color:accent }}>▲</div>
    })}
  </AbsoluteFill>
}

// ═══════════════════════════════════════════════════════
// 8. SUBTITLES (TikTok viral)
// ═══════════════════════════════════════════════════════
const Subtitles: React.FC<{ words: SubtitleWord[]; accent: string; style: NicheStyle }> = ({ words, accent, style: ns }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig(); const sec = f / fps
  const GRP = 4
  let ag: SubtitleWord[] = [], gs = 0, gi = 0
  for (let i = 0; i < words.length; i += GRP) {
    const g = words.slice(i, i+GRP)
    const s = g[0]?.start??0, e = g[g.length-1]?.end??0
    if (sec >= s-0.05 && sec <= e+0.15) { ag = g; gs = s; gi = i; break }
  }
  if (ag.length === 0) return null
  const gf = Math.max((sec-gs)*fps, 0)
  const gSc = spring({ fps, frame:gf, config:{ damping:9, stiffness:300, mass:0.35 } })
  const gY = interpolate(gf, [0, fps*0.15], [12, 0], { extrapolateRight:'clamp', easing:Easing.out(Easing.exp) })
  const empWord = ag.find(w => w.emphasis && sec >= w.start && sec <= w.end)
  const emoIdx = empWord ? Math.floor((gi/GRP)%ns.emphasisEmoji.length) : -1

  return <>
    <div style={{ position:'absolute', bottom:240, left:22, right:22, display:'flex', flexWrap:'wrap', justifyContent:'center', gap:'4px 7px', transform:`scale(${gSc}) translateY(${gY}px)`, zIndex:40 }}>
      {ag.map((w, i) => {
        const act = sec >= w.start && sec <= w.end, past = sec > w.end
        const wf = act ? (sec-w.start)*fps : 0
        const pop = act ? spring({ fps, frame:wf, config:{ damping:5, stiffness:450, mass:0.25 } }) : 1
        const shk = act && w.emphasis && wf < fps*0.15 ? Math.sin(wf*4)*4 : 0
        const rot = act && w.emphasis ? interpolate(wf, [0,3,6], [0,-2,0], { extrapolateRight:'clamp' }) : 0
        const sz = act ? (w.emphasis ? 66 : 56) : 50
        return <span key={`${w.word}-${i}-${gs}`} style={{
          display:'inline-block', fontSize:sz, fontWeight:900,
          fontFamily:"'Inter',sans-serif",
          color: act ? '#fff' : past ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.2)',
          textShadow: act
            ? `0 0 30px ${accent}, 0 6px 20px rgba(0,0,0,0.95), 0 0 60px ${accent}40, 0 0 4px #000`
            : '0 3px 10px rgba(0,0,0,0.8), 0 0 2px #000',
          WebkitTextStroke: act ? '1.5px rgba(0,0,0,0.5)' : '1px rgba(0,0,0,0.4)',
          background: act ? accent : 'transparent',
          padding: act ? '6px 18px' : '4px 3px', borderRadius: act ? 12 : 0,
          transform: `scale(${pop}) translateX(${shk}px) rotate(${rot}deg)`,
          textTransform:'uppercase', letterSpacing:'-0.5px', lineHeight:1.15,
          boxShadow: act && w.emphasis ? `0 0 20px ${accent}80, inset 0 0 10px ${accent}30` : 'none',
        }}>{w.word}</span>
      })}
    </div>
    {empWord && emoIdx >= 0 && <EmojiPop emoji={ns.emphasisEmoji[emoIdx]} startF={Math.round(empWord.start*fps)} />}
  </>
}

// ═══════════════════════════════════════════════════════
// 9. SCENE VIEW
// ═══════════════════════════════════════════════════════
const SceneView: React.FC<{
  scene: Scene; idx: number; bgGrad: [string,string]; accent: string; cg: string
}> = ({ scene, idx, bgGrad, accent, cg }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig()
  const dur = scene.endSec - scene.startSec, total = Math.round(dur*fps)
  const tr = getTrans(scene.transition||'none', f, fps, total)
  const pats = [
    {z:[1,1.22],px:[0,-35],py:[0,-18]}, {z:[1.18,1],px:[-25,25],py:[12,-12]},
    {z:[1,1.12],px:[18,-18],py:[-8,8]}, {z:[1.22,1.05],px:[0,0],py:[-25,12]},
    {z:[1.05,1.2],px:[30,-10],py:[5,-15]}, {z:[1.15,1],px:[-15,15],py:[-15,5]},
  ]
  const p = pats[idx%pats.length]
  const zm = interpolate(f, [0,total], p.z as [number,number], {extrapolateRight:'clamp'})
  const px = interpolate(f, [0,total], p.px as [number,number], {extrapolateRight:'clamp'})
  const py = interpolate(f, [0,total], p.py as [number,number], {extrapolateRight:'clamp'})
  // Zoom punch on cut
  const punch = interpolate(f, [0,4,Math.round(fps*0.3)], [1.06,1.06,1], {extrapolateRight:'clamp', easing:Easing.out(Easing.cubic)})
  // B-roll
  const lSec = f/fps
  let img = scene.imageUrl
  for (const br of (scene.bRoll||[])) {
    const ls = br.startSec-scene.startSec, le = br.endSec-scene.startSec
    if (lSec >= ls && lSec < le) { img = br.url; break }
  }
  return <AbsoluteFill style={{ opacity:tr.opacity, transform:`${tr.transform} scale(${punch})`, filter:`${tr.filter} ${cg}`.trim() }}>
    {img ? <div style={{position:'absolute',inset:-35,overflow:'hidden'}}>
      <Img src={img} style={{ width:'120%', height:'120%', objectFit:'cover', transform:`scale(${zm}) translate(${px}px,${py}px)`, filter:'brightness(0.42) contrast(1.18) saturate(1.15)' }} />
    </div> : <AbsoluteFill style={{ background:`linear-gradient(${150+idx*25}deg, ${scene.bgColor||bgGrad[0]}, ${bgGrad[1]})` }} />}
    {/* Overlays */}
    <AbsoluteFill style={{ background:'radial-gradient(ellipse at 50% 50%,transparent 35%,rgba(0,0,0,0.65) 100%)' }} />
    <AbsoluteFill style={{ background:'linear-gradient(180deg,rgba(0,0,0,0.45) 0%,transparent 22%,transparent 58%,rgba(0,0,0,0.65) 100%)' }} />
    <AbsoluteFill style={{ backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`, opacity:0.035, mixBlendMode:'overlay' }} />
    <div style={{ position:'absolute', left:0, top:'15%', bottom:'15%', width:3, background:`linear-gradient(180deg,transparent,${accent}80,transparent)` }} />
  </AbsoluteFill>
}

// ═══════════════════════════════════════════════════════
// 10. MAIN COMPOSITION
// ═══════════════════════════════════════════════════════
const TRANS_SEQ: Scene['transition'][] = ['zoom-in','slide-left','flash','whip','zoom-out','slide-right','glitch','zoom-in']

export const VideoComposition: React.FC<VideoProps> = ({
  scenes, subtitles, audioUrl, musicUrl, musicVolume = 0.12,
  title, hookText, ctaText, niche, accentColor, bgGradient, fps, durationInFrames,
}) => {
  const ns = NICHE_STYLES[niche] || NICHE_STYLES.other
  const hookF = Math.round(fps * 2)
  const ctaF = Math.round(fps * 3)
  const hasHook = !!hookText
  const hasCta = !!ctaText

  return <AbsoluteFill style={{ background:'#000' }}>
    {/* Hook */}
    {hasHook && <Sequence from={0} durationInFrames={hookF}>
      <HookScreen text={hookText!} accent={accentColor} emoji={ns.hookEmoji} />
    </Sequence>}

    {/* Scenes */}
    {scenes.map((s, i) => {
      const from = Math.round(s.startSec * fps) + (hasHook ? hookF : 0)
      const dur = Math.round((s.endSec - s.startSec) * fps)
      return <Sequence key={i} from={from} durationInFrames={dur}>
        <SceneView scene={{...s, transition:s.transition||TRANS_SEQ[i%TRANS_SEQ.length]}} idx={i} bgGrad={bgGradient} accent={accentColor} cg={ns.colorGrade} />
      </Sequence>
    })}

    {/* CTA end screen */}
    {hasCta && <Sequence from={durationInFrames - ctaF} durationInFrames={ctaF}>
      <CTAScreen text={ctaText!} accent={accentColor} emoji={ns.ctaEmoji} />
    </Sequence>}

    {/* Always-on layers */}
    <Particles type={ns.particleType} color={ns.particleColor} />
    <Flare color={ns.flareColor} opacity={ns.flareOpacity} />
    <BeatPulse accent={accentColor} />
    <Subtitles words={subtitles} accent={accentColor} style={ns} />
    <ProgressBar accent={accentColor} />

    {/* Audio */}
    {audioUrl && <Audio src={audioUrl} />}
    {musicUrl && <Audio src={musicUrl} volume={musicVolume} />}

    {/* Safe area gradients */}
    <div style={{ position:'absolute', top:0, left:0, right:0, height:100, background:'linear-gradient(180deg,rgba(0,0,0,0.4) 0%,transparent 100%)', pointerEvents:'none', zIndex:30 }} />
    <div style={{ position:'absolute', bottom:0, left:0, right:0, height:160, background:'linear-gradient(0deg,rgba(0,0,0,0.4) 0%,transparent 100%)', pointerEvents:'none', zIndex:30 }} />
  </AbsoluteFill>
}
