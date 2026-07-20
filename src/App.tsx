import { useEffect, useRef, type CSSProperties } from 'react'

// ─────────────────────────────────────────────────────────────────────
// RIVER PATHS  — SVG viewBox "0 0 100 200"
// Lines start WIDE (10 / 90) and funnel to centre (50) at y ≈ 175
// ─────────────────────────────────────────────────────────────────────
const PATH_L = `M 10 0 C 10 45 18 80 26 108 C 36 132 43 155 49 175 C 49 183 50 193 50 200`
const PATH_C = `M 50 0 L 50 200`
const PATH_R = `M 90 0 C 90 45 82 80 74 108 C 64 132 57 155 51 175 C 51 183 50 193 50 200`

// Exploration branches — dashed, diverge outward from the main lines
const BRANCHES = [
  `M 11 26 C 5 32 2 41 7 49`,
  `M 15 67 C 7 75 4 86 10 94`,
  `M 24 110 C 16 118 13 129 20 137`,
  `M 89 26 C 95 32 98 41 93 49`,
  `M 85 67 C 93 75 96 86 90 94`,
  `M 76 110 C 84 118 87 129 80 137`,
]

// ─────────────────────────────────────────────────────────────────────
// FRAGMENT DATA  — coordinates in the same 100 × 200 SVG space
// x values randomised ±5 around each river line for organic feel
// ─────────────────────────────────────────────────────────────────────
const PROBLEMS = [
  { text: '总重复？', x: 4,  y: 4,  d: 0.7  },
  { text: '太随机？', x: 14, y: 11, d: 0.9  },
  { text: '成本高？', x: 3,  y: 18, d: 1.1  },
  { text: '丢环节？', x: 16, y: 25, d: 1.3  },
  { text: '低人工？', x: 4,  y: 32, d: 1.5  },
  { text: '提效率？', x: 18, y: 39, d: 1.7  },
  { text: '追新潮？', x: 5,  y: 46, d: 1.9  },
  { text: '重体验？', x: 20, y: 53, d: 2.1  },
  { text: '要便捷？', x: 6,  y: 60, d: 2.3  },
  { text: '看结果？', x: 22, y: 67, d: 2.5  },
]

const TECH = [
  { text: 'IT 设施',     x: 96, y: 4,   d: 0.8,  mono: false },
  { text: '系统集成',    x: 84, y: 11,  d: 1.0,  mono: false },
  { text: '软件开发',    x: 95, y: 18,  d: 1.2,  mono: false },
  { text: '跨平台',     x: 82, y: 25,  d: 1.4,  mono: false },
  { text: '兼容性',     x: 94, y: 32,  d: 1.6,  mono: false },
  { text: '安全性',     x: 80, y: 39,  d: 1.8,  mono: false },
  { text: '可靠性',     x: 91, y: 46,  d: 2.0,  mono: false },
  { text: 'AI',         x: 79, y: 53,  d: 2.2,  mono: true  },
  { text: 'Agent',      x: 89, y: 60,  d: 2.4,  mono: true  },
  { text: 'RAG',        x: 76, y: 67,  d: 2.6,  mono: true  },
  { text: '知识库',     x: 85, y: 74,  d: 2.8,  mono: false },
  { text: '大模型',     x: 72, y: 81,  d: 3.0,  mono: false },
  { text: 'LLM',        x: 81, y: 88,  d: 3.2,  mono: true  },
  { text: 'skill',      x: 69, y: 95,  d: 3.4,  mono: true  },
  { text: 'SCP',        x: 77, y: 102, d: 3.6,  mono: true  },
  { text: 'codex',      x: 65, y: 109, d: 3.8,  mono: true  },
  { text: 'claude code',x: 73, y: 116, d: 4.0,  mono: true  },
  { text: 'trae',       x: 61, y: 123, d: 4.2,  mono: true  },
  { text: 'openclaw',   x: 68, y: 130, d: 4.4,  mono: true  },
]

// Convergence: SVG y=175 → CSS top = 175/200*100 = 87.5%
const CONV_TOP = `87.5%`

// Solution Journey steps
const JOURNEY = [
  {
    num: '01', zh: '问题捕捉', en: 'Problem Discovery',
    desc: '从真实业务场景中发现并定义值得解决的问题',
  },
  {
    num: '02', zh: '场景理解', en: 'Context Mapping',
    desc: '深入用户场景，理解工作流程与真实痛点',
  },
  {
    num: '03', zh: '技术组合', en: 'Tech Assembly',
    desc: '选择最适合的 AI 与数字技术能力进行组合',
  },
  {
    num: '04', zh: '快速验证', en: 'Rapid Validation',
    desc: '构建 MVP，在真实环境中测试并快速迭代',
  },
  {
    num: '05', zh: '系统交付', en: 'System Delivery',
    desc: '形成可持续运行、可维护的数字解决方案',
  },
]

// ─────────────────────────────────────────────────────────────────────
// GALAXY CANVAS — dense Milky Way, purple-blue tones
// ─────────────────────────────────────────────────────────────────────
type Star = {
  x: number; y: number; r: number
  op: number; tw: number; sp: number
  r8: number; g8: number; b8: number   // colour
}

function GalaxyCanvas() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const cx = cv.getContext('2d')
    if (!cx) return

    let raf: number
    let frame = 0
    let stars: Star[] = []
    let dustStars: Star[] = []

    const isMobile = () => window.innerWidth < 768

    const randomColor = (): [number, number, number] => {
      const r = Math.random()
      if (r < 0.38) return [218, 228, 248]   // cold white-blue
      if (r < 0.60) return [200, 215, 255]   // blue-white
      if (r < 0.72) return [240, 240, 248]   // near-white
      if (r < 0.82) return [255, 224, 185]   // warm amber
      if (r < 0.90) return [205, 180, 255]   // violet
      return [158, 202, 187]                  // jade accent
    }

    const makeStar = (W: number, H: number, inBand = false): Star => {
      const bw = W * 0.24
      const cx2 = W * 0.5
      const x = inBand ? cx2 + (Math.random() - 0.5) * bw * 2 : Math.random() * W
      const [r8, g8, b8] = randomColor()
      return {
        x, y: Math.random() * H,
        r: inBand
          ? (Math.random() < 0.04 ? Math.random() * 1.4 + 0.5 : Math.random() * 0.7 + 0.1)
          : (Math.random() < 0.03 ? Math.random() * 1.8 + 0.7 : Math.random() * 1.0 + 0.1),
        op: inBand ? Math.random() * 0.55 + 0.12 : Math.random() * 0.45 + 0.05,
        tw: Math.random() * Math.PI * 2,
        sp: Math.random() * 0.014 + 0.003,
        r8, g8, b8,
      }
    }

    const init = () => {
      const W = cv.width, H = cv.height
      const mobile = isMobile()
      const total = mobile ? 1800 : 3200
      const bandFrac = 0.42

      stars = Array.from({ length: Math.round(total * (1 - bandFrac)) }, () => makeStar(W, H, false))
      dustStars = Array.from({ length: Math.round(total * bandFrac) }, () => makeStar(W, H, true))
    }

    const resize = () => {
      cv.width = window.innerWidth
      cv.height = window.innerHeight
      init()
    }
    resize()
    window.addEventListener('resize', resize)

    const drawNebula = (W: number, H: number) => {
      // Deep purple glow — upper band
      const g1 = cx.createRadialGradient(W * 0.52, H * 0.28, 0, W * 0.52, H * 0.28, W * 0.32)
      g1.addColorStop(0, 'rgba(110,60,180,0.032)')
      g1.addColorStop(0.4, 'rgba(90,50,160,0.016)')
      g1.addColorStop(1, 'rgba(60,30,120,0)')
      cx.fillStyle = g1; cx.fillRect(0, 0, W, H)

      // Blue-violet mid cloud
      const g2 = cx.createRadialGradient(W * 0.46, H * 0.56, 0, W * 0.46, H * 0.56, W * 0.25)
      g2.addColorStop(0, 'rgba(60,80,200,0.028)')
      g2.addColorStop(0.5, 'rgba(40,60,180,0.012)')
      g2.addColorStop(1, 'rgba(20,40,140,0)')
      cx.fillStyle = g2; cx.fillRect(0, 0, W, H)

      // Warm dust lane (orange-rose)
      const g3 = cx.createRadialGradient(W * 0.38, H * 0.42, 0, W * 0.38, H * 0.42, W * 0.2)
      g3.addColorStop(0, 'rgba(180,80,40,0.018)')
      g3.addColorStop(0.6, 'rgba(150,60,30,0.007)')
      g3.addColorStop(1, 'rgba(120,40,20,0)')
      cx.fillStyle = g3; cx.fillRect(0, 0, W, H)

      // Jade accent (brand tint)
      const g4 = cx.createRadialGradient(W * 0.54, H * 0.72, 0, W * 0.54, H * 0.72, W * 0.18)
      g4.addColorStop(0, 'rgba(80,160,140,0.022)')
      g4.addColorStop(1, 'rgba(40,120,100,0)')
      cx.fillStyle = g4; cx.fillRect(0, 0, W, H)
    }

    const draw = () => {
      // On mobile throttle to ~30 fps
      if (isMobile() && frame % 2 !== 0) { frame++; raf = requestAnimationFrame(draw); return }

      const W = cv.width, H = cv.height
      cx.clearRect(0, 0, W, H)

      // Deep space background
      cx.fillStyle = '#08061a'
      cx.fillRect(0, 0, W, H)

      // Milky way luminance band (vertical, centred)
      const band = cx.createLinearGradient(W * 0.26, 0, W * 0.74, 0)
      band.addColorStop(0, 'rgba(100,80,180,0)')
      band.addColorStop(0.18, 'rgba(120,100,200,0.016)')
      band.addColorStop(0.42, 'rgba(160,140,230,0.038)')
      band.addColorStop(0.58, 'rgba(180,160,255,0.042)')
      band.addColorStop(0.82, 'rgba(120,100,200,0.016)')
      band.addColorStop(1, 'rgba(100,80,180,0)')
      cx.fillStyle = band; cx.fillRect(0, 0, W, H)

      // Nebula layers
      drawNebula(W, H)

      // Dust stars (milky way micro-fog — static)
      dustStars.forEach(s => {
        cx.beginPath()
        cx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        cx.fillStyle = `rgba(${s.r8},${s.g8},${s.b8},${s.op})`
        cx.fill()
      })

      // Main stars (twinkling)
      stars.forEach(s => {
        const fl = Math.sin(s.tw + frame * s.sp)
        const op = Math.max(0.02, s.op * (0.68 + 0.32 * fl))
        cx.beginPath()
        cx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        cx.fillStyle = `rgba(${s.r8},${s.g8},${s.b8},${op})`
        cx.fill()
        // Soft halo on brighter stars
        if (s.r > 0.9) {
          const hg = cx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 5)
          hg.addColorStop(0, `rgba(${s.r8},${s.g8},${s.b8},${op * 0.3})`)
          hg.addColorStop(1, `rgba(${s.r8},${s.g8},${s.b8},0)`)
          cx.beginPath()
          cx.arc(s.x, s.y, s.r * 5, 0, Math.PI * 2)
          cx.fillStyle = hg; cx.fill()
        }
      })

      frame++
      raf = requestAnimationFrame(draw)
    }

    draw()
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])

  return (
    <canvas ref={ref} style={{
      position: 'fixed', inset: 0,
      width: '100%', height: '100%',
      zIndex: 0, pointerEvents: 'none',
    }} />
  )
}

// ─────────────────────────────────────────────────────────────────────
// ZEROSOLO LOGO MARK — SVG
// ─────────────────────────────────────────────────────────────────────
function ZeroMark({ size = 40, jade = '#9ECABB', bright = '#D4EDE5' }: {
  size?: number; jade?: string; bright?: string
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      {/* Outer ring — almost-complete circle, gap at lower-right = 破界 */}
      <circle cx="20" cy="20" r="17"
        stroke={jade} strokeWidth="1.6" strokeLinecap="round"
        strokeDasharray="89 18"
        style={{ transform: 'rotate(-100deg)', transformOrigin: '20px 20px' }} />
      {/* Mid orbit (lighter) */}
      <circle cx="20" cy="20" r="11"
        stroke={jade} strokeWidth="0.7" strokeOpacity={0.35} fill="none"
        strokeDasharray="6 4" />
      {/* Zero-dimension core — single point */}
      <circle cx="20" cy="20" r="3" fill={bright} opacity={0.92} />
      {/* Emergence dot at the break */}
      <circle cx="30.8" cy="28.2" r="1.6" fill={jade} opacity={0.65} />
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────
// TOP BANNER  — logo only, no nav
// ─────────────────────────────────────────────────────────────────────
function TopBanner() {
  return (
    <header style={{
      position: 'relative', zIndex: 10,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 'clamp(18px,3vw,32px) 0 clamp(12px,2vw,20px)',
      background: 'rgba(8,6,26,0.6)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(158,202,187,0.08)',
      animation: 'logoReveal 1s ease-out 0.2s both',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(10px,1.5vw,16px)' }}>
        <ZeroMark size={window.innerWidth < 768 ? 32 : 40} />
        <div>
          <div style={{
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontWeight: 700,
            fontSize: 'clamp(18px,2.2vw,28px)',
            letterSpacing: '-0.03em',
            color: '#D8E8E2',
            lineHeight: 1,
          }}>zeroSolo</div>
          <div style={{
            fontFamily: "'Noto Sans SC', sans-serif",
            fontWeight: 300,
            fontSize: 'clamp(9px,0.9vw,12px)',
            color: 'rgba(158,202,187,0.65)',
            letterSpacing: '0.12em',
            marginTop: 3,
          }}>零维破界</div>
        </div>
      </div>
    </header>
  )
}

// ─────────────────────────────────────────────────────────────────────
// FRAGMENT CHIP
// ─────────────────────────────────────────────────────────────────────
function Chip({ text, x, y, delay, mono = false, type }: {
  text: string; x: number; y: number; delay: number; mono?: boolean; type: 'problem' | 'tech'
}) {
  const floatDur = 4 + ((x * 7 + y * 3) % 5) * 0.5

  return (
    // Outer: position + bloom reveal
    <div style={{
      position: 'absolute',
      left: `${x}%`,
      top: `${y / 2}%`,   // SVG y 0-200 → CSS 0-100%
      transform: 'translate(-50%,-50%)',
      zIndex: 8,
      animation: `fragmentIn 0.5s ease-out ${delay}s both`,
    }}>
      {/* Inner: float only */}
      <div style={{ animation: `fragmentFloat ${floatDur}s ease-in-out ${delay + 0.3}s infinite` }}>
        <div className={`chip ${mono ? 'mono' : ''} ${type}`}>{text}</div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────
// CONVERGENCE CIRCLE  — branded circle with zeroSolo mark
// ─────────────────────────────────────────────────────────────────────
function ConvergenceCircle() {
  const sz = 'clamp(92px, 9vw, 130px)'

  return (
    <div style={{
      position: 'absolute',
      left: '50%', top: CONV_TOP,
      transform: 'translate(-50%,-50%)',
      zIndex: 20,
      animation: `nodeBloom 1s cubic-bezier(0.34,1.56,0.64,1) 4.4s both`,
    }}>
      {/* Outer radial glow */}
      <div style={{
        position: 'absolute', inset: '-65%',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(158,202,187,0.14) 0%, rgba(100,140,160,0.04) 50%, transparent 70%)',
        animation: 'nodePulse 3.5s ease-in-out 5.2s infinite',
        pointerEvents: 'none',
      }} />

      {/* Outer dashed orbit ring */}
      <div style={{
        position: 'absolute', inset: '-18%',
        borderRadius: '50%',
        border: '1px dashed rgba(158,202,187,0.22)',
        animation: 'ringRotate 22s linear infinite',
      }} />

      {/* Main circle */}
      <div style={{
        width: sz, height: sz,
        borderRadius: '50%',
        background: 'rgba(6,6,20,0.94)',
        border: '1.5px solid rgba(158,202,187,0.45)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        position: 'relative',
        boxShadow: '0 0 32px rgba(158,202,187,0.1), inset 0 0 24px rgba(80,120,110,0.08)',
      }}>
        {/* Inner ring */}
        <div style={{
          position: 'absolute', inset: 8,
          borderRadius: '50%',
          border: '1px solid rgba(158,202,187,0.15)',
          animation: 'ringRotateRev 35s linear infinite',
        }} />

        {/* Logo mark */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <ZeroMark
            size={window.innerWidth < 768 ? 26 : 34}
            jade="#9ECABB"
            bright="#D4EDE5"
          />
        </div>

        {/* Text */}
        <div style={{
          position: 'relative', zIndex: 1,
          textAlign: 'center', marginTop: 3,
        }}>
          <div style={{
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontWeight: 700,
            fontSize: 'clamp(9px,1vw,13px)',
            letterSpacing: '-0.02em',
            color: '#D8E8E2',
          }}>zeroSolo</div>
          <div style={{
            fontFamily: "'Noto Sans SC', sans-serif",
            fontWeight: 300,
            fontSize: 'clamp(7px,0.7vw,9px)',
            color: 'rgba(158,202,187,0.6)',
            letterSpacing: '0.1em',
            marginTop: 1,
          }}>零维破界</div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────
// RIVER SVG  — funnel-shaped, fills section absolutely
// ─────────────────────────────────────────────────────────────────────
function RiverSVG() {
  const line = (d: string, color: string, w: number, delay: number): CSSProperties => ({
    stroke: color, strokeWidth: w, fill: 'none',
    strokeDasharray: 5200, strokeDashoffset: 5200, opacity: 0,
    animation: `drawPath 3.2s ease-in-out ${delay}s both`,
  })
  const glow = (d: string, color: string, w: number, delay: number): CSSProperties => ({
    ...line(d, color, w, delay), filter: 'url(#sg)',
  })

  return (
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}
      viewBox="0 0 100 200" preserveAspectRatio="none">
      <defs>
        <filter id="rg" x="-20%" y="-5%" width="140%" height="110%">
          <feGaussianBlur stdDeviation="0.6" result="b" />
          <feComposite in="SourceGraphic" in2="b" operator="over" />
        </filter>
        <filter id="sg" x="-60%" y="-8%" width="220%" height="116%">
          <feGaussianBlur stdDeviation="1.8" result="b" />
          <feComposite in="SourceGraphic" in2="b" operator="over" />
        </filter>
        <radialGradient id="cg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(158,202,187,0.18)" />
          <stop offset="60%" stopColor="rgba(100,160,140,0.05)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>

      {/* Left line */}
      <path id="pL" d={PATH_L} style={line(PATH_L, 'rgba(158,202,187,0.5)', 0.35, 0.2)} />
      <path d={PATH_L} style={glow(PATH_L, 'rgba(158,202,187,0.12)', 2.5, 0.2)} />

      {/* Centre line — brightest */}
      <path id="pC" d={PATH_C} style={{ ...line(PATH_C, 'rgba(210,232,222,0.68)', 0.4, 0), filter: 'url(#rg)' }} />
      <path d={PATH_C} style={glow(PATH_C, 'rgba(210,232,222,0.1)', 4, 0)} />

      {/* Right line */}
      <path id="pR" d={PATH_R} style={line(PATH_R, 'rgba(158,202,187,0.46)', 0.35, 0.4)} />
      <path d={PATH_R} style={glow(PATH_R, 'rgba(158,202,187,0.11)', 2.5, 0.4)} />

      {/* Exploration branches */}
      {BRANCHES.map((d, i) => (
        <path key={i} d={d} style={{
          stroke: 'rgba(158,202,187,0.3)',
          strokeWidth: 0.25, fill: 'none',
          strokeDasharray: '1.2 1.2',
          strokeDashoffset: 600,
          animation: `drawBranch 2s ease-in-out ${0.9 + i * 0.12}s both`,
        }} />
      ))}

      {/* Flowing particles */}
      {[
        { href: '#pL', dur: 10, begin: 2,   r: 0.55, fill: 'rgba(200,218,212,0.75)' },
        { href: '#pL', dur: 10, begin: 6.5, r: 0.35, fill: 'rgba(158,202,187,0.55)' },
        { href: '#pC', dur: 9,  begin: 1.5, r: 0.65, fill: 'rgba(220,235,226,0.85)' },
        { href: '#pC', dur: 9,  begin: 5.5, r: 0.4,  fill: 'rgba(200,228,218,0.55)' },
        { href: '#pR', dur: 11, begin: 3,   r: 0.55, fill: 'rgba(158,202,187,0.7)'  },
        { href: '#pR', dur: 11, begin: 8,   r: 0.35, fill: 'rgba(200,218,212,0.45)' },
      ].map((p, i) => (
        <circle key={i} r={p.r} fill={p.fill}
          style={{ animation: `particleFlow ${p.dur}s ease-in-out ${p.begin}s infinite` }}>
          <animateMotion dur={`${p.dur}s`} repeatCount="indefinite" begin={`${p.begin}s`}>
            <mpath href={p.href} />
          </animateMotion>
        </circle>
      ))}

      {/* Convergence ambient glow */}
      <ellipse cx="50" cy="175" rx="18" ry="8" fill="url(#cg)"
        style={{ animation: 'nodePulse 3.5s ease-in-out 5s infinite' }} />
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────
// ZERO FLOW SECTION  — river + fragments + convergence
// ─────────────────────────────────────────────────────────────────────
function ZeroFlowSection() {
  return (
    <section style={{ position: 'relative', width: '100%', height: '280vh', zIndex: 1, overflow: 'hidden' }}>

      {/* Section micro-label */}
      <div style={{
        position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)',
        zIndex: 10, textAlign: 'center',
        animation: 'fadeUp 0.8s ease-out 0.4s both',
      }}>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 'clamp(8px,0.7vw,10px)',
          color: 'rgba(158,202,187,0.32)',
          letterSpacing: '0.2em', textTransform: 'uppercase',
        }}>§ Zero Flow · 零维流</span>
      </div>

      {/* Side labels */}
      {[
        { side: 'left'  as const, label: '现实碎片', col: 'rgba(220,175,130,0.32)' },
        { side: 'right' as const, label: '技术能力', col: 'rgba(158,202,187,0.32)' },
      ].map(({ side, label, col }) => (
        <div key={side} style={{
          position: 'absolute', top: '6%', [side]: 'clamp(8px,1.5vw,22px)',
          zIndex: 10, writingMode: 'vertical-rl', textOrientation: 'mixed',
          animation: 'fadeUp 0.8s ease-out 1.4s both',
        }}>
          <span style={{
            fontFamily: "'Noto Sans SC', sans-serif",
            fontSize: 'clamp(8px,0.7vw,10px)',
            color: col, letterSpacing: '0.12em',
          }}>{label}</span>
        </div>
      ))}

      <RiverSVG />

      {/* Problem chips */}
      {PROBLEMS.map((f, i) => (
        <Chip key={i} text={f.text} x={f.x} y={f.y} delay={f.d} type="problem" />
      ))}

      {/* Tech chips */}
      {TECH.map((f, i) => (
        <Chip key={i} text={f.text} x={f.x} y={f.y} delay={f.d} mono={f.mono} type="tech" />
      ))}

      {/* Convergence circle */}
      <ConvergenceCircle />

      {/* Scroll hint — visible bottom of first screen */}
      <div style={{
        position: 'absolute', left: '50%', bottom: 0,
        height: '35.7%',  // = 100vh / 280vh
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'flex-end',
        paddingBottom: 28, zIndex: 10,
        pointerEvents: 'none',
      }}>
        <div style={{ animation: 'arrowBob 2s ease-in-out 1.5s infinite' }}>
          <svg width="12" height="16" viewBox="0 0 12 16" fill="none">
            <path d="M6 0 L6 12 M2 8 L6 12 L10 8"
              stroke="rgba(158,202,187,0.28)" strokeWidth="1"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────
// SOLUTION JOURNEY SECTION
// ─────────────────────────────────────────────────────────────────────
function SolutionJourneySection() {
  const divider: CSSProperties = {
    width: 1, background: 'linear-gradient(180deg, rgba(158,202,187,0.4) 0%, rgba(158,202,187,0) 100%)',
    flexShrink: 0,
  }

  return (
    <section style={{
      position: 'relative', zIndex: 1,
      padding: 'clamp(60px,8vw,100px) clamp(20px,6vw,80px) clamp(80px,10vw,140px)',
    }}>
      {/* Top connector from river */}
      <div style={{
        position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: 1, height: 'clamp(40px,5vw,70px)',
        background: 'linear-gradient(180deg, rgba(158,202,187,0.3) 0%, rgba(158,202,187,0.06) 100%)',
      }} />

      {/* Section heading */}
      <div style={{
        textAlign: 'center',
        marginBottom: 'clamp(48px,6vw,80px)',
        animation: 'fadeUp 0.8s ease-out 0.2s both',
      }}>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 'clamp(9px,0.7vw,11px)',
          color: 'rgba(158,202,187,0.45)',
          letterSpacing: '0.2em', textTransform: 'uppercase',
          marginBottom: 10,
        }}>Solution Journey</div>
        <h2 style={{
          fontFamily: "'Noto Sans SC', 'Bricolage Grotesque', sans-serif",
          fontWeight: 700,
          fontSize: 'clamp(20px,2.4vw,34px)',
          letterSpacing: '-0.01em',
          color: '#D8E8E2', margin: 0,
        }}>从问题到系统</h2>
        <p style={{
          fontFamily: "'Noto Sans SC', sans-serif",
          fontWeight: 300,
          fontSize: 'clamp(12px,1vw,14px)',
          color: 'rgba(200,218,212,0.42)',
          marginTop: 10, letterSpacing: '0.02em',
        }}>把复杂的问题，转化为可运行的系统</p>
      </div>

      {/* Journey steps */}
      <div style={{
        maxWidth: 680, margin: '0 auto',
        display: 'flex', flexDirection: 'column', gap: 0,
      }}>
        {JOURNEY.map((step, i) => (
          <div key={step.num} style={{
            display: 'flex', gap: 'clamp(16px,2.5vw,32px)',
            animation: `stepReveal 0.6s ease-out ${0.3 + i * 0.15}s both`,
          }}>
            {/* Timeline */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 28, flexShrink: 0 }}>
              {/* Dot */}
              <div style={{
                width: 10, height: 10, borderRadius: '50%',
                background: i === 0 ? '#9ECABB' : 'rgba(158,202,187,0.35)',
                border: '1.5px solid rgba(158,202,187,0.6)',
                flexShrink: 0, marginTop: 4,
                boxShadow: i === 0 ? '0 0 10px rgba(158,202,187,0.4)' : 'none',
                transition: 'background 0.3s',
              }} />
              {/* Connector line */}
              {i < JOURNEY.length - 1 && (
                <div style={{
                  ...divider,
                  flex: 1,
                  minHeight: 'clamp(40px,5vw,64px)',
                  marginTop: 4,
                }} />
              )}
            </div>

            {/* Content */}
            <div style={{
              paddingBottom: i < JOURNEY.length - 1 ? 'clamp(24px,3.5vw,48px)' : 0,
            }}>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 'clamp(8px,0.65vw,10px)',
                color: 'rgba(158,202,187,0.45)',
                letterSpacing: '0.14em', marginBottom: 5,
              }}>{step.num} / {step.en}</div>
              <div style={{
                fontFamily: "'Noto Sans SC', sans-serif",
                fontWeight: 500,
                fontSize: 'clamp(14px,1.3vw,18px)',
                color: '#D8E8E2',
                letterSpacing: '0.02em', marginBottom: 6,
              }}>{step.zh}</div>
              <div style={{
                fontFamily: "'Noto Sans SC', sans-serif",
                fontWeight: 300,
                fontSize: 'clamp(11px,0.85vw,13px)',
                color: 'rgba(200,218,212,0.48)',
                lineHeight: 1.65, letterSpacing: '0.01em',
              }}>{step.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom separator */}
      <div style={{
        width: 'clamp(60px,8vw,120px)', height: 1, margin: 'clamp(48px,6vw,80px) auto 0',
        background: 'linear-gradient(90deg, transparent, rgba(158,202,187,0.25), transparent)',
      }} />
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────
// FOOTER
// ─────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{
      position: 'relative', zIndex: 1,
      padding: 'clamp(36px,5vw,60px) clamp(20px,6vw,80px) clamp(24px,3vw,36px)',
      borderTop: '1px solid rgba(158,202,187,0.07)',
      background: 'rgba(6,5,18,0.6)',
    }}>
      {/* Logo + tagline */}
      <div style={{ textAlign: 'center', marginBottom: 'clamp(24px,3vw,36px)' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center',
          gap: 'clamp(8px,1.2vw,14px)', marginBottom: 14,
        }}>
          <ZeroMark size={window.innerWidth < 768 ? 24 : 30} jade="#7AADA0" bright="#B8D4CC" />
          <span style={{
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontWeight: 700,
            fontSize: 'clamp(14px,1.4vw,18px)',
            letterSpacing: '-0.025em',
            color: 'rgba(216,232,226,0.65)',
          }}>zeroSolo</span>
        </div>
        <p style={{
          fontFamily: "'Noto Sans SC', sans-serif",
          fontWeight: 300,
          fontSize: 'clamp(11px,0.85vw,13px)',
          color: 'rgba(200,218,212,0.35)',
          lineHeight: 1.8, letterSpacing: '0.02em',
          margin: 0,
        }}>
          AI Solution Studio · 零维破界将现实中的复杂问题，转化为可运行的数字解决方案。
        </p>
      </div>

      {/* Divider */}
      <div style={{
        width: '100%', maxWidth: 440, height: 1, margin: '0 auto clamp(18px,2.5vw,28px)',
        background: 'linear-gradient(90deg, transparent, rgba(158,202,187,0.12), transparent)',
      }} />

      {/* Copyright + ICP */}
      <div style={{
        textAlign: 'center',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 'clamp(9px,0.65vw,10px)',
        color: 'rgba(158,202,187,0.2)',
        letterSpacing: '0.05em',
        lineHeight: 2,
      }}>
        <div>© 2026 zeroSolo · v4.0</div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 'clamp(8px,1.5vw,20px)', flexWrap: 'wrap' }}>
          <a href="https://beian.miit.gov.cn/" target="_blank" rel="noreferrer"
            style={{ color: 'rgba(158,202,187,0.2)', textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseEnter={e => ((e.target as HTMLElement).style.color = 'rgba(158,202,187,0.5)')}
            onMouseLeave={e => ((e.target as HTMLElement).style.color = 'rgba(158,202,187,0.2)')}
          >粤ICP备2024000000号</a>
          <span style={{ opacity: 0.4 }}>·</span>
          <a href="http://www.beian.gov.cn/" target="_blank" rel="noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              color: 'rgba(158,202,187,0.2)', textDecoration: 'none', transition: 'color 0.2s',
            }}
            onMouseEnter={e => ((e.target as HTMLElement).style.color = 'rgba(158,202,187,0.5)')}
            onMouseLeave={e => ((e.target as HTMLElement).style.color = 'rgba(158,202,187,0.2)')}
          >
            {/* 公安备案盾标 */}
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 1 L10.5 3 L10.5 6.5 C10.5 8.8 8.5 10.7 6 11 C3.5 10.7 1.5 8.8 1.5 6.5 L1.5 3 Z"
                stroke="currentColor" strokeWidth="0.8" fill="none" />
            </svg>
            粤公网安备44000000000000号
          </a>
        </div>
      </div>
    </footer>
  )
}

// ─────────────────────────────────────────────────────────────────────
// ROOT
// ─────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <div style={{ background: '#08061a', minHeight: '100vh' }}>
      <GalaxyCanvas />
      <TopBanner />
      <ZeroFlowSection />
      <SolutionJourneySection />
      <Footer />
    </div>
  )
}
