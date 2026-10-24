import { useMemo } from 'react'

const WORD = 'J.A.R.V.I.S'

export default function ActivationOverlay({ active }) {
  const particles = useMemo(
    () =>
      Array.from({ length: 28 }, () => ({
        left: 8 + Math.random() * 84,
        top: 12 + Math.random() * 76,
        size: 2 + Math.random() * 3,
        delay: `${(0.3 + Math.random() * 1.4).toFixed(2)}s`,
      })),
    [],
  )

  return (
    <div className={`activation-overlay ${active ? '' : 'done'}`} aria-hidden={!active}>
      <div className="scan-beam-line" />
      {particles.map((p, i) => (
        <span
          key={i}
          className="particle"
          style={{ left: `${p.left}%`, top: `${p.top}%`, width: p.size, height: p.size, animationDelay: p.delay }}
        />
      ))}
      <div className="activation-letters">
        {WORD.split('').map((ch, i) => (
          <span key={i} style={{ animationDelay: `${(0.35 + i * 0.09).toFixed(2)}s` }}>
            {ch}
          </span>
        ))}
      </div>
      <div className="activation-sub">NEURAL INTERFACE INITIALIZING</div>
    </div>
  )
}
