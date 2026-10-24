export default function SystemControls({
  variant,
  mode,
  soundOn,
  reducedMotion,
  onModeChange,
  onSoundToggle,
  onReducedMotionToggle,
  onSkip,
  onReplay,
}) {
  return (
    <div className={`system-controls controls-${variant}`}>
      {variant === 'boot' ? (
        <button type="button" className="ctl ctl-skip" onClick={onSkip}>
          SKIP INTRO
        </button>
      ) : (
        <button type="button" className="ctl ctl-skip" onClick={onReplay}>
          REPLAY STARTUP
        </button>
      )}
      <button
        type="button"
        className="ctl"
        onClick={() => onModeChange(mode === 'cinematic' ? 'normal' : 'cinematic')}
      >
        MODE · {mode === 'cinematic' ? 'CINEMATIC' : 'NORMAL'}
      </button>
      <button type="button" className="ctl" onClick={onSoundToggle}>
        SOUND · {soundOn ? 'ON' : 'OFF'}
      </button>
      <button type="button" className="ctl" onClick={onReducedMotionToggle}>
        MOTION · {reducedMotion ? 'REDUCED' : 'FULL'}
      </button>
    </div>
  )
}
