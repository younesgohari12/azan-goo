import { useEffect, useRef, useState } from 'react'

function WaveCanvas({ active }) {
  const ref = useRef(null)

  useEffect(() => {
    if (!active) return undefined
    const canvas = ref.current
    if (!canvas) return undefined
    const ctx = canvas.getContext('2d')
    let raf
    const draw = (t) => {
      const w = canvas.width
      const h = canvas.height
      ctx.clearRect(0, 0, w, h)
      const layers = [
        { color: 'rgba(0,217,255,.85)', amp: 0.5, freq: 0.055, speed: 0.0016, y: 0.5 },
        { color: 'rgba(57,255,225,.45)', amp: 0.3, freq: 0.09, speed: -0.0023, y: 0.5 },
        { color: 'rgba(19,139,255,.3)', amp: 0.68, freq: 0.032, speed: 0.0011, y: 0.5 },
      ]
      layers.forEach((l) => {
        ctx.beginPath()
        for (let x = 0; x <= w; x += 2) {
          const envelope = Math.sin((x / w) * Math.PI)
          const y =
            h / 2 +
            Math.sin(x * l.freq + t * l.speed * 1000) *
              l.amp *
              (h / 2 - 4) *
              (0.55 + 0.45 * Math.sin(t * 0.0013 + x * 0.004)) *
              envelope
          if (x === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.strokeStyle = l.color
        ctx.lineWidth = 1.2
        ctx.stroke()
      })
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [active])

  return <canvas ref={ref} className="wave-canvas" width="250" height="64" />
}

function Gauge({ percent }) {
  const r = 30
  const circ = 2 * Math.PI * r
  return (
    <svg viewBox="0 0 80 80" className="gauge" aria-hidden="true">
      <circle className="gauge-track" cx="40" cy="40" r={r} />
      <circle
        className="gauge-arc"
        cx="40"
        cy="40"
        r={r}
        style={{ strokeDasharray: circ, '--dash-full': circ, '--target': circ * (1 - percent / 100) }}
      />
      <text x="40" y="44" textAnchor="middle" fill="#00D9FF" fontSize="13" fontFamily="'Share Tech Mono', monospace">
        {percent}%
      </text>
    </svg>
  )
}

const TELEMETRY = [
  { label: 'CPU', unit: '%', base: 12, jitter: 6 },
  { label: 'MEM', unit: '%', base: 38, jitter: 8 },
  { label: 'LAT', unit: 'ms', base: 9, jitter: 7 },
  { label: 'PKT', unit: '/s', base: 142, jitter: 40 },
]

function Telemetry({ active }) {
  const [rows, setRows] = useState(() => TELEMETRY.map((t) => ({ ...t, value: t.base })))

  useEffect(() => {
    if (!active) return undefined
    const t = window.setInterval(() => {
      setRows((prev) =>
        prev.map((r) => ({
          ...r,
          value: Math.max(0, r.base + (Math.random() - 0.5) * 2 * r.jitter),
        })),
      )
    }, 900)
    return () => window.clearInterval(t)
  }, [active])

  return (
    <div className="tele-rows">
      {rows.map((r) => (
        <div key={r.label} className="tele-row">
          <span>{r.label}</span>
          <b>
            {r.value.toFixed(r.unit === '/s' ? 0 : 1)}
            {r.unit}
          </b>
        </div>
      ))}
    </div>
  )
}

function Coordinates({ active }) {
  const [vals, setVals] = useState({ x: 1024.88, y: 220.14, scan: 12 })

  useEffect(() => {
    if (!active) return undefined
    const t = window.setInterval(() => {
      setVals((v) => ({
        x: v.x + (Math.random() - 0.5) * 1.6,
        y: v.y + (Math.random() - 0.5) * 1.6,
        scan: (v.scan + 7) % 100,
      }))
    }, 620)
    return () => window.clearInterval(t)
  }, [active])

  return (
    <div className="coord-lines">
      <span>X · {vals.x.toFixed(2)}</span>
      <span>Y · {vals.y.toFixed(2)}</span>
      <span className="coord-sub">SCAN {String(vals.scan).padStart(2, '0')}% · GRID LOCK</span>
    </div>
  )
}

function MiniDiagram() {
  const nodes = [
    { x: 100, y: 46 },
    { x: 30, y: 16 },
    { x: 30, y: 76 },
    { x: 170, y: 16 },
    { x: 170, y: 76 },
  ]
  return (
    <svg viewBox="0 0 200 92" className="mini-diagram" aria-hidden="true">
      {nodes.slice(1).map((n, i) => (
        <line key={i} x1={nodes[0].x} y1={nodes[0].y} x2={n.x} y2={n.y} stroke="rgba(0,217,255,.3)" strokeWidth="1" />
      ))}
      {nodes.map((n, i) => (
        <circle
          key={i}
          className="data-node"
          cx={n.x}
          cy={n.y}
          r={i === 0 ? 5 : 3}
          fill={i === 0 ? '#00D9FF' : '#39FFE1'}
          style={{ animationDelay: `${i * 0.4}s` }}
        />
      ))}
    </svg>
  )
}

export default function HudSides({ phase, reduced, side }) {
  const visible = phase === 'bootstrap' || phase === 'diagnostics' || phase === 'online' || phase === 'handoff'
  if (!visible) return null
  const active = phase === 'bootstrap' || phase === 'diagnostics'

  const left = (
    <>
      <div className="hud-card">
        <h3>AUDIO SPECTRUM</h3>
        <WaveCanvas active={active && !reduced} />
      </div>
      <div className="hud-card">
        <h3>CORE LOAD</h3>
        <Gauge percent={68} />
        <div className="gauge-readout">
          <span>68.2%</span>
          <span>NOMINAL</span>
        </div>
      </div>
      <div className="hud-card">
        <h3>TELEMETRY</h3>
        <Telemetry active={active && !reduced} />
      </div>
    </>
  )

  const right = (
    <>
      <div className="hud-card">
        <h3>SPATIAL SCAN</h3>
        <Coordinates active={active && !reduced} />
      </div>
      <div className="hud-card">
        <h3>SYSTEM LINK</h3>
        <MiniDiagram />
      </div>
      <div className="hud-card">
        <h3>STATUS</h3>
        <div className="status-rows">
          <div>
            UPLINK · <b>STANDBY</b>
          </div>
          <div>
            ENCRYPTION · <b>AES-256</b>
          </div>
          <div>
            BUFFER · <b>98%</b>
          </div>
        </div>
      </div>
    </>
  )

  return (
    <div className={`hud-side hud-${side}`}>
      {side === 'left' ? left : right}
    </div>
  )
}
