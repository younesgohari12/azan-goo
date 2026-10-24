import { useEffect, useState } from 'react'

const STATUS_TEXT = {
  ready: 'READY',
  disconnected: 'DISCONNECTED',
  unavailable: 'UNAVAILABLE',
  error: 'ERROR',
}

export default function DiagnosticsPanel({ modules, reduced }) {
  const [resolved, setResolved] = useState(() => modules.map(() => false))

  useEffect(() => {
    if (reduced) {
      setResolved(modules.map(() => true))
      return undefined
    }
    const timers = modules.map((_, i) =>
      window.setTimeout(() => {
        setResolved((r) => {
          const next = [...r]
          next[i] = true
          return next
        })
      }, 380 + i * 165),
    )
    return () => timers.forEach((t) => window.clearTimeout(t))
  }, [modules, reduced])

  const anySimulated = modules.some((m) => m.simulated)

  return (
    <div className="diag-panel">
      <header className="diag-head">
        <h2>MODULE DIAGNOSTICS</h2>
        {anySimulated && <span className="sim-badge">DEMO · SIMULATED STATUS</span>}
      </header>
      <ul className="diag-grid" style={{ listStyle: 'none' }}>
        {modules.map((m, i) => (
          <li key={m.id} className="diag-row" style={{ animationDelay: `${i * 0.06}s` }}>
            <span className="diag-index">{String(i + 1).padStart(2, '0')}</span>
            <span className="diag-label">{m.label}</span>
            <span className={`diag-status ${resolved[i] ? `s-${m.status}` : 's-init'}`}>
              {resolved[i] ? STATUS_TEXT[m.status] || m.status : 'INITIALIZING'}
            </span>
            <span className={`diag-dot ${resolved[i] ? `s-${m.status}` : 's-init'}`} />
          </li>
        ))}
      </ul>
    </div>
  )
}
