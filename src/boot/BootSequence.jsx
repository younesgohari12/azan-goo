import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ReactorCore from './ReactorCore'
import ActivationOverlay from './ActivationOverlay'
import DiagnosticsPanel from './DiagnosticsPanel'
import HudSides from './HudSides'
import SystemControls from './SystemControls'
import { playStartupSound } from '../lib/audio'

const PHASE_NAMES = ['activation', 'bootstrap', 'diagnostics', 'online', 'handoff']

// Cinematic mode targets ~9.5s total; normal mode compresses the same phases.
const TIMELINES = {
  cinematic: { activation: 2200, bootstrap: 2600, diagnostics: 2000, online: 2000, handoff: 1000 },
  normal: { activation: 700, bootstrap: 900, diagnostics: 700, online: 800, handoff: 500 },
}

const REDUCED_TIMELINE = { activation: 450, bootstrap: 350, diagnostics: 350, online: 800, handoff: 350 }

const BOOT_MESSAGES = [
  'CORE SYSTEM INITIALIZING',
  'LOADING VOICE INTERFACE',
  'PREPARING AI ENGINE',
  'INITIALIZING COMMAND PROCESSOR',
  'LOADING NEURAL AUDIO SYSTEM',
]

export default function BootSequence({
  modules,
  mode,
  soundOn,
  reducedMotion,
  onModeChange,
  onSoundToggle,
  onReducedMotionToggle,
  onSkip,
  onBootComplete,
}) {
  const timeline = useMemo(
    () => (reducedMotion ? REDUCED_TIMELINE : TIMELINES[mode] || TIMELINES.cinematic),
    [mode, reducedMotion],
  )

  const [phaseIndex, setPhaseIndex] = useState(0)
  const [leaving, setLeaving] = useState(false)
  const [msgIndex, setMsgIndex] = useState(0)
  const phase = PHASE_NAMES[phaseIndex] || 'handoff'
  const finishedRef = useRef(false)
  const soundPlayedRef = useRef(false)
  const onBootCompleteRef = useRef(onBootComplete)
  onBootCompleteRef.current = onBootComplete

  const finish = useCallback((holdMs) => {
    if (finishedRef.current) return
    finishedRef.current = true
    setLeaving(true)
    window.setTimeout(() => onBootCompleteRef.current(), holdMs)
  }, [])

  // Phase state machine — each phase advances after its slice of the timeline.
  useEffect(() => {
    if (leaving) return undefined
    const name = PHASE_NAMES[phaseIndex]
    if (!name) {
      finish(reducedMotion ? 200 : 750)
      return undefined
    }
    const t = window.setTimeout(() => setPhaseIndex((i) => i + 1), timeline[name])
    return () => window.clearTimeout(t)
  }, [phaseIndex, leaving, timeline, reducedMotion, finish])

  // SKIP INTRO — jump straight to handoff.
  const skip = useCallback(() => finish(320), [finish])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') skip()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [skip])

  // Bootstrap technical messages cycle.
  useEffect(() => {
    if (phase !== 'bootstrap' || leaving) return undefined
    const step = Math.max(140, timeline.bootstrap / BOOT_MESSAGES.length)
    const t = window.setInterval(() => setMsgIndex((i) => (i + 1) % BOOT_MESSAGES.length), step)
    return () => window.clearInterval(t)
  }, [phase, leaving, timeline])

  // Original synthesized startup sound, played once when the core comes online.
  useEffect(() => {
    if (phase === 'online' && soundOn && !reducedMotion && !soundPlayedRef.current) {
      soundPlayedRef.current = true
      playStartupSound().catch(() => {})
    }
  }, [phase, soundOn, reducedMotion])

  // Sequence progress bar — driven by the real phase timeline (demo mode).
  const barRef = useRef(null)
  useEffect(() => {
    if (reducedMotion) {
      if (barRef.current) barRef.current.style.transform = 'scaleX(1)'
      return undefined
    }
    const total = Object.values(timeline).reduce((a, b) => a + b, 0)
    const start = performance.now()
    let raf
    const tick = (now) => {
      const p = Math.min(1, (now - start) / total)
      if (barRef.current) barRef.current.style.transform = `scaleX(${p})`
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [timeline, reducedMotion])

  // Subtle parallax depth on pointer move.
  const rootRef = useRef(null)
  useEffect(() => {
    if (reducedMotion) return undefined
    const el = rootRef.current
    if (!el) return undefined
    const onMove = (e) => {
      const r = el.getBoundingClientRect()
      const mx = (e.clientX - r.left) / r.width - 0.5
      const my = (e.clientY - r.top) / r.height - 0.5
      el.style.setProperty('--mx', mx.toFixed(3))
      el.style.setProperty('--my', my.toFixed(3))
    }
    el.addEventListener('pointermove', onMove)
    return () => el.removeEventListener('pointermove', onMove)
  }, [reducedMotion])

  return (
    <div
      ref={rootRef}
      className={`boot-screen phase-${phase} mode-${mode} ${reducedMotion ? 'reduced' : ''} ${leaving ? 'leaving' : ''}`}
    >
      <div className="bg-grid" />
      <div className="bg-vignette" />

      <ActivationOverlay active={phase === 'activation'} />

      <div className="stage">
        <HudSides phase={phase} reduced={reducedMotion} side="left" />
        <div className="core-column">
          <ReactorCore phase={phase} reduced={reducedMotion} />
          <div className="core-label">
            <h1 className="wordmark">J.A.R.V.I.S</h1>
            <p className="tagline">Just A Rather Very Intelligent System</p>
          </div>
          {phase === 'bootstrap' && (
            <div className="boot-message" key={msgIndex}>
              {BOOT_MESSAGES[msgIndex]}
            </div>
          )}
        </div>
        <HudSides phase={phase} reduced={reducedMotion} side="right" />
      </div>

      {(phase === 'diagnostics' || phase === 'online') && (
        <DiagnosticsPanel modules={modules} reduced={reducedMotion} />
      )}

      {!reducedMotion && (phase === 'online' || phase === 'handoff') && (
        <div className={`online-banner ${phase === 'handoff' ? 'fade-out' : ''}`}>
          <div className="online-line1">ALL AVAILABLE SYSTEMS INITIALIZED</div>
          <div className="online-line2">J.A.R.V.I.S ONLINE</div>
          <div className="online-fa" dir="rtl" lang="fa">
            سیستم جارویس آماده است
          </div>
        </div>
      )}

      <div className="progress-meter">
        <div className="progress-track">
          <div ref={barRef} className="progress-fill" />
        </div>
        <span className="progress-label">SEQUENCE PROGRESS · DEMO MODE</span>
      </div>

      <SystemControls
        variant="boot"
        mode={mode}
        soundOn={soundOn}
        reducedMotion={reducedMotion}
        onModeChange={onModeChange}
        onSoundToggle={onSoundToggle}
        onReducedMotionToggle={onReducedMotionToggle}
        onSkip={skip}
      />
    </div>
  )
}
