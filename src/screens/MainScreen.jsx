import ReactorCore from '../boot/ReactorCore'
import SystemControls from '../boot/SystemControls'

export default function MainScreen({
  modules,
  mode,
  soundOn,
  reducedMotion,
  onModeChange,
  onSoundToggle,
  onReducedMotionToggle,
  onReplay,
}) {
  return (
    <div className={`main-screen ${reducedMotion ? 'reduced' : ''}`}>
      <div className="bg-grid" />
      <div className="bg-vignette" />
      <div className="main-content">
        <ReactorCore phase="handoff" idle reduced={reducedMotion} />
        <h1 className="wordmark main-wordmark">
          J.A.R.V.I.S <span className="ready">— SYSTEM READY</span>
        </h1>
        <ul className="module-chips">
          {modules.map((m, i) => (
            <li key={m.id} className="module-chip" style={{ animationDelay: `${0.2 + i * 0.08}s` }}>
              <span className={`chip-dot s-${m.status}`} />
              <span>{m.label}</span>
              {m.simulated && <span className="chip-sim">SIM</span>}
            </li>
          ))}
        </ul>
      </div>
      <SystemControls
        variant="main"
        mode={mode}
        soundOn={soundOn}
        reducedMotion={reducedMotion}
        onModeChange={onModeChange}
        onSoundToggle={onSoundToggle}
        onReducedMotionToggle={onReducedMotionToggle}
        onReplay={onReplay}
      />
    </div>
  )
}
