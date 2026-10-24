import { useCallback, useEffect, useState } from 'react'
import BootSequence from './boot/BootSequence'
import MainScreen from './screens/MainScreen'
import { DEFAULT_MODULES } from './boot/defaultModules'

export default function App() {
  const [bootDone, setBootDone] = useState(false)
  const [bootRunId, setBootRunId] = useState(0)
  const [mode, setMode] = useState('cinematic')
  const [soundOn, setSoundOn] = useState(true)
  const [reducedMotion, setReducedMotion] = useState(
    () =>
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  const [modules] = useState(DEFAULT_MODULES)

  const handleBootComplete = useCallback(() => setBootDone(true), [])

  const replayBoot = useCallback(() => {
    setBootDone(false)
    setBootRunId((id) => id + 1)
  }, [])

  // Changing the mode restarts the sequence so the timing applies cleanly.
  const changeMode = useCallback((nextMode) => {
    setMode(nextMode)
    setBootDone(false)
    setBootRunId((id) => id + 1)
  }, [])

  return bootDone ? (
    <MainScreen
      modules={modules}
      mode={mode}
      soundOn={soundOn}
      reducedMotion={reducedMotion}
      onModeChange={changeMode}
      onSoundToggle={() => setSoundOn((s) => !s)}
      onReducedMotionToggle={() => setReducedMotion((r) => !r)}
      onReplay={replayBoot}
    />
  ) : (
    <BootSequence
      key={bootRunId}
      modules={modules}
      mode={mode}
      soundOn={soundOn}
      reducedMotion={reducedMotion}
      onModeChange={changeMode}
      onSoundToggle={() => setSoundOn((s) => !s)}
      onReducedMotionToggle={() => setReducedMotion((r) => !r)}
      onSkip={handleBootComplete}
      onBootComplete={handleBootComplete}
    />
  )
}
