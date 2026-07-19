import { useEffect, useRef, type CSSProperties } from 'react'

// ── SVG river paths — tight channel, viewBox 1920 × 2900 ─────────────
// Left + right lines hug the center, max ~380px spread at widest
const PATH_LEFT = [
  'M 882 0',
  'C 862 295 690 458 578 718',
  'C 498 888 542 1078 648 1258',
  'C 728 1398 868 1518 918 1638',
  'C 948 1718 942 2008 922 2320',
  'C 905 2600 890 2740 875 2900',
].join(' ')

const PATH_CENTER = [
  'M 960 0',
  'C 958 360 962 720 960 1080',
  'C 958 1360 960 1540 960 1638',
  'C 960 1818 960 2100 960 2480',
  'C 960 2700 960 2820 960 2900',
].join(' ')

const PATH_RIGHT = [
  'M 1038 0',
  'C 1058 295 1230 458 1342 718',
  'C 1422 888 1378 1078 1272 1258',
  'C 1192 1398 1052 1518 1002 1638',
  'C 972 1718 978 2008 998 2320',
  'C 1015 2600 1030 2740 1045 2900',
].join(' ')

// Exploration branches — dashed, uncertainty paths
const BRANCHES = [
  'M 746 432 C 630 538 568 660 638 768',
  'M 492 762 C 362 844 298 972 408 1072',
  'M 418 1122 C 286 1194 222 1308 338 1408',
  'M 1174 432 C 1290 538 1352 660 1282 768',
  'M 1428 762 C 1558 844 1622 972 1512 1072',
  'M 1502 1122 C 1634 1194 1698 1308 1582 1408',
]

// ── Fragment data — tight to river channel ────────────────────────────
type Fragment = { text: string; svgX: number; svgY: number; delay: number; id: string; mono?: boolean }

// Left fragments: outside left river line by ~150–220px
const PROBLEMS: Fragment[] = [
  { text: '总重复？', svgX: 630,  svgY: 380,  delay: 1.5, id: 'p1' },
  { text: '成本高？', svgX: 488,  svgY: 600,  delay: 1.8, id: 'p2' },
  { text: '丢环节？', svgX: 382,  svgY: 820,  delay: 2.1, id: 'p3' },
  { text: '太随机？', svgX: 342,  svgY: 1040, delay: 2.4, id: 'p4' },
  { text: '看结果？', svgX: 382,  svgY: 1280, delay: 2.7, id: 'p5' },
  { text: '要便捷？', svgX: 462,  svgY: 1488, delay: 2.5, id: 'p6' },
  { text: '提效率？', svgX: 658,  svgY: 1680, delay: 2.9, id: 'p7' },
]

// Right fragments: outside right river line by ~150–220px
const TECH: Fragment[] = [
  { text: 'AI Agent',    svgX: 1290, svgY: 380,  delay: 1.6, id: 't1', mono: true },
  { text: 'RAG 知识库', svgX: 1432, svgY: 600,  delay: 1.9, id: 't2' },
  { text: '软件开发',   svgX: 1538, svgY: 820,  delay: 2.2, id: 't3' },
  { text: 'NFC + H5',  svgX: 1578, svgY: 1040, delay: 2.5, id: 't4', mono: true },
  { text: '大模型 LLM', svgX: 1538, svgY: 1280, delay: 2.8, id: 't5' },
  { text: 'claude code',svgX: 1458, svgY: 1488, delay: 2.6, id: 't6', mono: true },
  { text: '系统集成',   svgX: 1262, svgY: 1680, delay: 3.0, id: 't7' },
]

// Convergence: SVG (960, 1638) → 50% / 56.5%
const CONV_X = 50
const CONV_Y = (1638 / 2900) * 100   // 56.5%

// Solution flow: SVG y=2040 → 70.3%
const FLOW_Y = (2040 / 2900) * 100

const SOLUTION_STEPS = ['问题', '场景理解', '需求拆解', '技术组合', '系统形成']

function toPercent(svgX: number, svgY: number) {
  return { left: `${(svgX / 1920) * 100}%`, top: `${(svgY / 2900) * 100}%` }
}

// ── Galaxy Canvas ─────────────────────────────────────────────────────
type Star = {
  x: number; y: number; r: number
  baseOpacity: number; twinkle: number; speed: number
  cr: number; cg: number; cb: number
}

function GalaxyCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    let frame = 0
    let stars: Star[] = []
    let mwStars: Star[] = []

    const getStarColor = (): [number, number, number] => {
      const rnd = Math.random()
      if (rnd < 0.11) return [255, 232, 198]   // warm amber
      if (rnd < 0.26) return [175, 202, 255]   // blue-white
      if (rnd < 0.33) return [158, 202, 187]   // jade (brand tint)
      return [218, 230, 240]                    // neutral cold white
    }

    const init = () => {
      const W = canvas.width
      const H = canvas.height
      const bandCX = W * 0.5

      // Main starfield — biased toward centre band (milky way)
      stars = Array.from({ length: 720 }, () => {
        const inBand = Math.random() < 0.32
        const bSpread = W * 0.18
        const x = inBand
          ? bandCX + (Math.random() - 0.5) * bSpread * 2
          : Math.random() * W
        const [cr, cg, cb] = getStarColor()
        return {
          x,
          y: Math.random() * H,
          r: Math.random() < 0.06 ? Math.random() * 1.6 + 0.7 : Math.random() * 0.85 + 0.12,
          baseOpacity: inBand
            ? Math.random() * 0.55 + 0.15
            : Math.random() * 0.38 + 0.05,
          twinkle: Math.random() * Math.PI * 2,
          speed: Math.random() * 0.016 + 0.004,
          cr, cg, cb,
        }
      })

      // Dense milky way micro-stars (no twinkling — fog-like)
      mwStars = Array.from({ length: 420 }, () => ({
        x: bandCX + (Math.random() - 0.5) * W * 0.28,
        y: Math.random() * H,
        r: Math.random() * 0.45 + 0.08,
        baseOpacity: Math.random() * 0.22 + 0.04,
        twinkle: 0, speed: 0,
        cr: 205, cg: 220, cb: 238,
      }))
    }

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      init()
    }
    resize()
    window.addEventListener('resize', resize)

    const draw = () => {
      const W = canvas.width
      const H = canvas.height
      ctx.clearRect(0, 0, W, H)

      // Milky way soft luminance band — vertical, centred
      const bandGrd = ctx.createLinearGradient(W * 0.28, 0, W * 0.72, 0)
      bandGrd.addColorStop(0,    'rgba(140,178,198,0)')
      bandGrd.addColorStop(0.22, 'rgba(158,202,187,0.009)')
      bandGrd.addColorStop(0.5,  'rgba(180,215,240,0.016)')
      bandGrd.addColorStop(0.78, 'rgba(158,202,187,0.009)')
      bandGrd.addColorStop(1,    'rgba(140,178,198,0)')
      ctx.fillStyle = bandGrd
      ctx.fillRect(0, 0, W, H)

      // Nebula patches — soft branded glows
      const nebulae = [
        { x: W * 0.50, y: H * 0.18, rx: W * 0.17, ry: H * 0.13, c: '158,202,187', a: 0.024 },
        { x: W * 0.49, y: H * 0.54, rx: W * 0.13, ry: H * 0.11, c: '175,205,235', a: 0.018 },
        { x: W * 0.51, y: H * 0.82, rx: W * 0.11, ry: H * 0.09, c: '195,188,155', a: 0.012 },
      ]
      nebulae.forEach(({ x, y, rx, ry, c, a }) => {
        ctx.save()
        ctx.translate(x, y)
        ctx.scale(1, ry / rx)
        const grd = ctx.createRadialGradient(0, 0, 0, 0, 0, rx)
        grd.addColorStop(0,   `rgba(${c},${a})`)
        grd.addColorStop(0.4, `rgba(${c},${a * 0.45})`)
        grd.addColorStop(1,   `rgba(${c},0)`)
        ctx.beginPath()
        ctx.arc(0, 0, rx, 0, Math.PI * 2)
        ctx.fillStyle = grd
        ctx.fill()
        ctx.restore()
      })

      // Milky way dense star fog
      mwStars.forEach(s => {
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${s.cr},${s.cg},${s.cb},${s.baseOpacity})`
        ctx.fill()
      })

      // Regular stars — twinkling
      stars.forEach(s => {
        const flicker = Math.sin(s.twinkle + frame * s.speed)
        const op = Math.max(0, s.baseOpacity * (0.7 + 0.3 * flicker))
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${s.cr},${s.cg},${s.cb},${op})`
        ctx.fill()
        // Soft halo on larger stars
        if (s.r > 0.85) {
          const hgrd = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 4.5)
          hgrd.addColorStop(0, `rgba(${s.cr},${s.cg},${s.cb},${op * 0.28})`)
          hgrd.addColorStop(1, `rgba(${s.cr},${s.cg},${s.cb},0)`)
          ctx.beginPath()
          ctx.arc(s.x, s.y, s.r * 4.5, 0, Math.PI * 2)
          ctx.fillStyle = hgrd
          ctx.fill()
        }
      })

      frame++
      animId = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas ref={canvasRef} style={{
      position: 'fixed', inset: 0,
      width: '100%', height: '100%',
      zIndex: 0, pointerEvents: 'none',
    }} />
  )
}

// ── Nav ───────────────────────────────────────────────────────────────
function Nav() {
  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      padding: '20px 80px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      borderBottom: '1px solid rgba(200,220,215,0.06)',
      background: 'rgba(6,8,12,0.75)',
      backdropFilter: 'blur(16px)',
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
        <span style={{
          fontFamily: "'Bricolage Grotesque', sans-serif",
          fontWeight: 700, fontSize: 19, letterSpacing: '-0.025em', color: '#D8E8E2',
        }}>zeroSolo</span>
        <span style={{
          fontFamily: "'Noto Sans SC', sans-serif",
          fontWeight: 300, fontSize: 12,
          color: 'rgba(158,202,187,0.68)', letterSpacing: '0.1em',
        }}>零维破界</span>
      </div>
      <div style={{ display: 'flex', gap: 44 }}>
        {['Home', 'Archive', 'Capability', 'About'].map(item => (
          <a key={item} href="#" style={{
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontWeight: 300, fontSize: 13, letterSpacing: '0.04em',
            color: 'rgba(200,220,215,0.42)', textDecoration: 'none',
            transition: 'color 0.2s',
          }}
            onMouseEnter={e => ((e.target as HTMLElement).style.color = 'rgba(200,220,215,0.9)')}
            onMouseLeave={e => ((e.target as HTMLElement).style.color = 'rgba(200,220,215,0.42)')}
          >{item}</a>
        ))}
      </div>
    </nav>
  )
}

// ── Fragment Card ─────────────────────────────────────────────────────
function FragmentCard({ fragment, type }: { fragment: Fragment; type: 'problem' | 'tech' }) {
  const pos = toPercent(fragment.svgX, fragment.svgY)
  return (
    // Outer: position + fade-in reveal
    <div style={{
      position: 'absolute', left: pos.left, top: pos.top,
      transform: 'translate(-50%, -50%)', zIndex: 10,
      animation: `fragmentIn 0.55s ease-out ${fragment.delay}s both`,
    }}>
      {/* Inner: float only — separate element avoids transform conflict */}
      <div style={{
        animation: `fragmentFloat ${4.5 + (fragment.svgX % 4) * 0.6}s ease-in-out ${fragment.delay + 0.4}s infinite`,
      }}>
        <div className={`fragment-card-inner ${fragment.mono ? 'mono' : ''} ${type}`}>
          {fragment.text}
        </div>
      </div>
    </div>
  )
}

// ── Convergence Node ──────────────────────────────────────────────────
function ConvergenceNode() {
  return (
    <div style={{
      position: 'absolute',
      left: `${CONV_X}%`, top: `${CONV_Y}%`,
      transform: 'translate(-50%, -50%)',
      animation: 'nodeBloom 0.9s cubic-bezier(0.34,1.56,0.64,1) 4.0s both',
      zIndex: 20, textAlign: 'center',
    }}>
      {/* Outer radial glow — galaxy-core feel */}
      <div style={{
        position: 'absolute', inset: -64, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(158,202,187,0.11) 0%, rgba(158,202,187,0.03) 50%, transparent 70%)',
        animation: 'nodePulse 3.2s ease-in-out 4.8s infinite',
        pointerEvents: 'none',
      }} />

      <div style={{
        padding: '22px 42px',
        background: 'rgba(6,10,8,0.92)',
        border: '1px solid rgba(158,202,187,0.38)',
        backdropFilter: 'blur(24px)',
        clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))',
      }}>
        <div style={{
          fontFamily: "'Bricolage Grotesque', sans-serif",
          fontWeight: 700, fontSize: 26, letterSpacing: '-0.025em',
          color: '#D8E8E2', marginBottom: 5,
        }}>zeroSolo</div>
        <div style={{
          fontFamily: "'Noto Sans SC', sans-serif",
          fontWeight: 300, fontSize: 12,
          color: 'rgba(158,202,187,0.7)', letterSpacing: '0.14em',
        }}>零维破界</div>
        <div style={{ display: 'flex', gap: 5, justifyContent: 'center', marginTop: 11 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 4, height: 4, borderRadius: '50%',
              background: `rgba(158,202,187,${0.28 + i * 0.22})`,
            }} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── SVG River ─────────────────────────────────────────────────────────
function RiverSVG() {
  const mainLine = (color: string, w: number, delay: number): CSSProperties => ({
    stroke: color, strokeWidth: w, fill: 'none',
    strokeDasharray: 5200, strokeDashoffset: 5200, opacity: 0,
    animation: `drawPath 3.4s ease-in-out ${delay}s both`,
  })
  const glowLine = (color: string, w: number, delay: number, filt: string): CSSProperties => ({
    stroke: color, strokeWidth: w, fill: 'none',
    strokeDasharray: 5200, strokeDashoffset: 5200, opacity: 0,
    animation: `drawPath 3.4s ease-in-out ${delay}s both`,
    filter: `url(#${filt})`,
  })
  const branchLine: CSSProperties = {
    stroke: 'rgba(158,202,187,0.28)', strokeWidth: 0.9, fill: 'none',
    strokeDasharray: '8 8', strokeDashoffset: 900,
    animation: 'drawBranch 2.2s ease-in-out 0.8s both',
  }

  return (
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}
      viewBox="0 0 1920 2900" preserveAspectRatio="none">
      <defs>
        <filter id="rGlow" x="-12%" y="-4%" width="124%" height="108%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feComposite in="SourceGraphic" in2="b" operator="over" />
        </filter>
        <filter id="sGlow" x="-25%" y="-8%" width="150%" height="116%">
          <feGaussianBlur stdDeviation="7" result="b" />
          <feComposite in="SourceGraphic" in2="b" operator="over" />
        </filter>
        <radialGradient id="convAura" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(158,202,187,0.16)" />
          <stop offset="60%" stopColor="rgba(158,202,187,0.05)" />
          <stop offset="100%" stopColor="rgba(158,202,187,0)" />
        </radialGradient>
      </defs>

      {/* ── Left ── */}
      <path id="pathLeft" d={PATH_LEFT}
        style={mainLine('rgba(158,202,187,0.46)', 1.2, 0.2)} />
      <path d={PATH_LEFT}
        style={glowLine('rgba(158,202,187,0.11)', 9, 0.2, 'sGlow')} />

      {/* ── Centre — brightest artery ── */}
      <path id="pathCenter" d={PATH_CENTER}
        style={mainLine('rgba(216,232,226,0.65)', 1.5, 0)}
        filter="url(#rGlow)" />
      <path d={PATH_CENTER}
        style={glowLine('rgba(216,232,226,0.1)', 16, 0, 'sGlow')} />

      {/* ── Right ── */}
      <path id="pathRight" d={PATH_RIGHT}
        style={mainLine('rgba(158,202,187,0.42)', 1.2, 0.4)} />
      <path d={PATH_RIGHT}
        style={glowLine('rgba(158,202,187,0.1)', 9, 0.4, 'sGlow')} />

      {/* ── Branches ── */}
      {BRANCHES.map((d, i) => (
        <path key={i} d={d}
          style={{ ...branchLine, animationDelay: `${0.8 + i * 0.13}s` }} />
      ))}

      {/* ── Particles ── */}
      {[
        { href: '#pathLeft',   dur: 10, begin: 2,   r: 2.8, fill: 'rgba(200,220,215,0.72)' },
        { href: '#pathLeft',   dur: 10, begin: 6.5, r: 1.6, fill: 'rgba(158,202,187,0.5)'  },
        { href: '#pathCenter', dur: 9,  begin: 1.5, r: 3.2, fill: 'rgba(220,235,228,0.82)' },
        { href: '#pathCenter', dur: 9,  begin: 5.5, r: 1.8, fill: 'rgba(200,225,215,0.52)' },
        { href: '#pathRight',  dur: 11, begin: 3.2, r: 2.8, fill: 'rgba(158,202,187,0.65)' },
        { href: '#pathRight',  dur: 11, begin: 8,   r: 1.6, fill: 'rgba(200,220,215,0.42)' },
      ].map((p, i) => (
        <circle key={i} r={p.r} fill={p.fill}
          style={{ animation: `particleFlow ${p.dur}s ease-in-out ${p.begin}s infinite` }}>
          <animateMotion dur={`${p.dur}s`} repeatCount="indefinite" begin={`${p.begin}s`}>
            <mpath href={p.href} />
          </animateMotion>
        </circle>
      ))}

      {/* Convergence ambient ellipse */}
      <ellipse cx="960" cy="1638" rx="240" ry="110"
        fill="url(#convAura)"
        style={{ animation: 'glowPulse 3.2s ease-in-out 4.5s infinite' }} />
    </svg>
  )
}

// ── Solution Flow ─────────────────────────────────────────────────────
function SolutionFlow() {
  return (
    <div style={{
      position: 'absolute', left: '50%', top: `${FLOW_Y}%`,
      transform: 'translateX(-50%)', zIndex: 15,
      display: 'flex', alignItems: 'center',
      animation: 'nodeBloom 0.8s ease-out 4.8s both',
    }}>
      {SOLUTION_STEPS.map((step, i) => (
        <div key={step} style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{
            padding: '8px 18px',
            background: i === 2 ? 'rgba(158,202,187,0.09)' : 'rgba(255,255,255,0.02)',
            border: `1px solid ${i === 2 ? 'rgba(158,202,187,0.35)' : 'rgba(200,220,215,0.1)'}`,
            backdropFilter: 'blur(6px)',
            animation: `fadeUp 0.5s ease-out ${4.9 + i * 0.11}s both`,
          }}>
            <span style={{
              fontFamily: "'Noto Sans SC', sans-serif",
              fontSize: 12, letterSpacing: '0.05em',
              color: i === 2 ? 'rgba(158,202,187,0.92)' : 'rgba(200,220,215,0.46)',
              fontWeight: i === 2 ? 500 : 300,
            }}>{step}</span>
          </div>
          {i < SOLUTION_STEPS.length - 1 && (
            <svg width="24" height="12" viewBox="0 0 24 12"
              style={{ animation: `fadeUp 0.4s ease-out ${4.95 + i * 0.11}s both`, opacity: 0 }}>
              <path d="M0 6 L17 6 M13 2 L17 6 L13 10"
                stroke="rgba(158,202,187,0.22)" strokeWidth="1" fill="none"
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      ))}
    </div>
  )
}

// ── Zero Flow Section — also serves as hero ───────────────────────────
function ZeroFlowSection() {
  return (
    <section style={{ position: 'relative', width: '100%', height: '260vh', overflow: 'hidden' }}>

      {/* Brand identity overlay — top centre, fades in with river */}
      <div style={{
        position: 'absolute', top: 92, left: '50%', transform: 'translateX(-50%)',
        zIndex: 10, textAlign: 'center',
        animation: 'fadeUp 1s ease-out 0.1s both',
      }}>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10, color: 'rgba(158,202,187,0.38)',
          letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 6,
        }}>
          § Zero Flow · 零维流
        </div>
        <div style={{
          fontFamily: "'Noto Sans SC', sans-serif",
          fontSize: 11, color: 'rgba(200,220,215,0.18)', letterSpacing: '0.1em',
        }}>
          把复杂的问题，转化为可运行的系统
        </div>
      </div>

      {/* Axis labels */}
      {[
        { side: 'left'  as const, label: '现实碎片', color: 'rgba(225,185,145,0.35)' },
        { side: 'right' as const, label: '技术能力', color: 'rgba(158,202,187,0.35)' },
      ].map(({ side, label, color }) => (
        <div key={side} style={{
          position: 'absolute', top: '9%', [side]: 32, zIndex: 10,
          writingMode: 'vertical-rl', textOrientation: 'mixed',
          animation: 'fadeUp 0.8s ease-out 1.8s both',
        }}>
          <span style={{
            fontFamily: "'Noto Sans SC', sans-serif",
            fontSize: 10, color, letterSpacing: '0.12em',
          }}>{label}</span>
        </div>
      ))}

      <RiverSVG />

      {PROBLEMS.map(f => <FragmentCard key={f.id} fragment={f} type="problem" />)}
      {TECH.map(f    => <FragmentCard key={f.id} fragment={f} type="tech"    />)}

      <ConvergenceNode />
      <SolutionFlow />

      {/* Scroll hint — bottom of first viewport */}
      <div style={{
        position: 'absolute', bottom: 0, left: '50%',
        height: '38.5%',  // = 100vh / 260vh, positions hint at bottom of first screen
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
        alignItems: 'center', paddingBottom: 36, zIndex: 10,
        animation: 'arrowDrop 2.2s ease-in-out 1.8s infinite',
      }}>
        <svg width="14" height="18" viewBox="0 0 14 18" fill="none">
          <path d="M7 0 L7 13 M3 9 L7 13 L11 9"
            stroke="rgba(158,202,187,0.28)" strokeWidth="1"
            strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </section>
  )
}

// ── Footer ────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{
      position: 'relative', padding: '88px 80px 68px',
      textAlign: 'center', borderTop: '1px solid rgba(200,220,215,0.05)',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: 1, height: 88,
        background: 'linear-gradient(180deg, rgba(158,202,187,0.3) 0%, rgba(158,202,187,0) 100%)',
      }} />
      <p style={{
        fontFamily: "'Bricolage Grotesque', sans-serif",
        fontWeight: 200, fontSize: 'clamp(22px, 2.4vw, 40px)',
        color: 'rgba(216,232,226,0.6)', letterSpacing: '0.02em',
        margin: '0 0 10px', fontStyle: 'italic',
      }}>The flow continues.</p>
      <p style={{
        fontFamily: "'Noto Sans SC', sans-serif",
        fontWeight: 300, fontSize: 13,
        color: 'rgba(200,220,215,0.26)', letterSpacing: '0.14em',
        margin: '0 0 44px',
      }}>未来仍在形成</p>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 9 }}>
        <span style={{
          fontFamily: "'Bricolage Grotesque', sans-serif",
          fontWeight: 700, fontSize: 13, color: 'rgba(158,202,187,0.45)',
        }}>zeroSolo</span>
        <div style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgba(158,202,187,0.26)' }} />
        <span style={{
          fontFamily: "'Noto Sans SC', sans-serif",
          fontWeight: 300, fontSize: 11,
          color: 'rgba(200,220,215,0.2)', letterSpacing: '0.07em',
        }}>零维破界 · AI Solution Studio</span>
      </div>
    </footer>
  )
}

// ── Root ──────────────────────────────────────────────────────────────
export default function App() {
  return (
    <div style={{ background: '#06080C', minHeight: '100vh', position: 'relative' }}>
      <GalaxyCanvas />
      <Nav />
      <ZeroFlowSection />
      <Footer />
    </div>
  )
}
