import { useEffect, useState } from 'react'

/**
 * Ticking clock for the "AI is working" elapsed time and relative timestamps.
 * Ticks only while `active`, so an idle screen costs nothing.
 */
export function useNow(active: boolean, intervalMs = 500): number {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!active) return
    setNow(Date.now())
    const id = window.setInterval(() => setNow(Date.now()), intervalMs)
    return () => window.clearInterval(id)
  }, [active, intervalMs])

  return now
}
