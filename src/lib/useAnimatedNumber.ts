import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'

const easeOut = (progress: number) => 1 - Math.pow(1 - progress, 3)

/**
 * انتقال کوتاه عدد هنگام تغییر مقدار.
 * - فقط وقتی مقدار هدف تغییر کند اجرا می‌شود (ورود اولیه از صفر شمارش نمی‌کند).
 * - با prefers-reduced-motion مقدار بدون انیمیشن عوض می‌شود.
 */
export function useAnimatedNumber(target: number, duration = 0.52): number {
  const reduceMotion = useReducedMotion()
  const [displayed, setDisplayed] = useState(target)
  const displayedRef = useRef(target)
  const frameRef = useRef<number | null>(null)

  useEffect(() => {
    if (reduceMotion) {
      displayedRef.current = target
      setDisplayed(target)
      return
    }
    const from = displayedRef.current
    if (from === target) return

    const startedAt = performance.now()
    const total = duration * 1000

    const tick = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / total)
      const value = from + (target - from) * easeOut(progress)
      displayedRef.current = value
      setDisplayed(value)
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick)
      } else {
        displayedRef.current = target
        setDisplayed(target)
      }
    }

    frameRef.current = requestAnimationFrame(tick)
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [target, duration, reduceMotion])

  return Math.round(displayed)
}
