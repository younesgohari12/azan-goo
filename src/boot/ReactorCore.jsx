import { useMemo } from 'react'

const C = 300 // viewBox center (0 0 600 600)

function polar(r, deg) {
  const a = ((deg - 90) * Math.PI) / 180
  return [C + r * Math.cos(a), C + r * Math.sin(a)]
}

function Ticks({ count, r1, r2, every = 1, stroke = 'rgba(0,217,255,.32)', width = 1 }) {
  const lines = []
  for (let i = 0; i < count; i += every) {
    const [x1, y1] = polar(r1, (360 / count) * i)
    const [x2, y2] = polar(r2, (360 / count) * i)
    lines.push(<line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={stroke} strokeWidth={width} />)
  }
  return <g>{lines}</g>
}

function wedgePath(r, spreadDeg) {
  const [x1, y1] = polar(r, -spreadDeg / 2)
  const [x2, y2] = polar(r, spreadDeg / 2)
  return `M ${C} ${C} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`
}

export default function ReactorCore({ phase = 'handoff', reduced = false, idle = false }) {
  const bright = phase === 'online'

  const dataNodes = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => {
        const deg = (360 / 10) * i
        const [x, y] = polar(170, deg)
        return { x, y, delay: `${(i * 0.31).toFixed(2)}s` }
      }),
    [],
  )

  const neuralLinks = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => {
        const [x1, y1] = polar(170, (360 / 10) * i)
        const [x2, y2] = polar(118, (360 / 10) * ((i + 3.5) % 10))
        return { x1, y1, x2, y2, delay: `${(i * 0.5).toFixed(2)}s` }
      }),
    [],
  )

  const orbiters = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => ({
        r: 244 + (i % 3) * 16,
        dur: 11 + i * 2.7,
        dir: i % 2 === 0 ? 'normal' : 'reverse',
        size: i % 3 === 0 ? 3.2 : 2.2,
      })),
    [],
  )

  const beamWedge = useMemo(() => wedgePath(292, 26), [])

  return (
    <svg
      className={`reactor ${bright ? 'bright' : ''} ${idle ? 'idle' : ''}`}
      viewBox="0 0 600 600"
      role="img"
      aria-label="J.A.R.V.I.S holographic reactor core"
    >
      <defs>
        <radialGradient id="haloGrad">
          <stop offset="0%" stopColor="rgba(0,217,255,.5)" />
          <stop offset="55%" stopColor="rgba(0,217,255,.12)" />
          <stop offset="100%" stopColor="rgba(0,217,255,0)" />
        </radialGradient>
        <radialGradient id="coreGrad">
          <stop offset="0%" stopColor="#EAFBFF" />
          <stop offset="45%" stopColor="#39FFE1" />
          <stop offset="100%" stopColor="rgba(0,217,255,0.05)" />
        </radialGradient>
        <linearGradient id="beamGrad" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="rgba(0,217,255,.35)" />
          <stop offset="100%" stopColor="rgba(0,217,255,0)" />
        </linearGradient>
        <filter id="core-soft" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>

      {/* soft energy waves */}
      <circle className="energy-wave" cx={C} cy={C} r="132" fill="none" stroke="rgba(0,217,255,.5)" strokeWidth="1" />
      <circle className="energy-wave w2" cx={C} cy={C} r="196" fill="none" stroke="rgba(57,255,225,.4)" strokeWidth="1" />

      {/* outer calibration ring + ticks */}
      <g className="spin spin-slowest">
        <circle cx={C} cy={C} r="286" fill="none" stroke="rgba(0,217,255,.22)" strokeWidth="1" />
        <Ticks count={96} r1={280} r2={290} />
        <Ticks count={24} r1={274} r2={290} every={4} stroke="rgba(0,217,255,.5)" width={1.4} />
      </g>

      {/* segmented counter-rotating arcs */}
      <g className="spin-rev spin-slow">
        <circle
          cx={C} cy={C} r="252" fill="none" stroke="rgba(19,139,255,.55)" strokeWidth="2.5"
          strokeDasharray="88 44 26 18 60 30"
        />
        <circle
          cx={C} cy={C} r="240" fill="none" stroke="rgba(57,255,225,.3)" strokeWidth="1"
          strokeDasharray="12 8"
        />
      </g>

      {/* mid mechanical ring + fine ticks (eased speed) */}
      <g className="spin-varied">
        <circle cx={C} cy={C} r="206" fill="none" stroke="rgba(0,217,255,.3)" strokeWidth="1.2" />
        <circle
          cx={C} cy={C} r="196" fill="none" stroke="rgba(0,217,255,.6)" strokeWidth="3"
          strokeDasharray="40 130 22 130" strokeLinecap="butt"
        />
        <Ticks count={48} r1={212} r2={220} stroke="rgba(0,217,255,.4)" />
      </g>

      {/* inner data ring + glowing nodes */}
      <g className="spin-rev spin-fast">
        <circle cx={C} cy={C} r="170" fill="none" stroke="rgba(0,217,255,.3)" strokeWidth="1" strokeDasharray="5 9" />
        <circle cx={C} cy={C} r="118" fill="none" stroke="rgba(57,255,225,.35)" strokeWidth="1" />
        {dataNodes.map((n, i) => (
          <circle
            key={i}
            className="data-node"
            cx={n.x}
            cy={n.y}
            r="3.4"
            fill="#39FFE1"
            style={{ animationDelay: n.delay }}
          />
        ))}
      </g>

      {/* neural processing links */}
      <g>
        {neuralLinks.map((l, i) => (
          <line
            key={i}
            className="neural-line"
            x1={l.x1}
            y1={l.y1}
            x2={l.x2}
            y2={l.y2}
            stroke="rgba(57,255,225,.2)"
            strokeWidth="1"
            style={{ animationDelay: l.delay }}
          />
        ))}
      </g>

      {/* radial scanning beam */}
      <g className="spin spin-beam">
        <path d={beamWedge} fill="url(#beamGrad)" opacity="0.22" />
        <line
          x1={C} y1={C} x2={C} y2={8}
          stroke="rgba(0,217,255,.65)" strokeWidth="1.4"
        />
      </g>

      {/* orbital particles */}
      {orbiters.map((o, i) => (
        <g
          key={i}
          className={i % 2 === 0 ? 'spin spin-med' : 'spin-rev spin-med'}
          style={{ animationDuration: `${o.dur}s`, animationDirection: o.dir }}
        >
          <circle cx={C + o.r} cy={C} r={o.size} fill="#00D9FF" opacity="0.8" />
        </g>
      ))}

      {/* center core */}
      <circle className="core-halo" cx={C} cy={C} r="72" fill="url(#haloGrad)" />
      <circle cx={C} cy={C} r="46" fill="none" stroke="rgba(0,217,255,.5)" strokeWidth="1" strokeDasharray="3 5" />
      <circle className="core-glow" cx={C} cy={C} r="26" fill="url(#coreGrad)" />
      <circle className="core-dot" cx={C} cy={C} r="7" fill="#EAFBFF" />

      {/* phase-4 pulse */}
      <circle className="pulse-ring" cx={C} cy={C} r="42" fill="none" stroke="rgba(0,217,255,.7)" strokeWidth="1.6" />
    </svg>
  )
}
