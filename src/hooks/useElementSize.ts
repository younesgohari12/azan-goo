import { useEffect, useRef, useState } from 'react'

export interface ElementSize {
  width: number
  height: number
}

/**
 * Observes an element's content box. Used by the preview workspace to decide how
 * much the device frame must shrink to stay fully visible (fit-to-canvas) and
 * whether two comparison frames still fit side by side.
 */
export function useElementSize<T extends HTMLElement>(): {
  ref: React.RefObject<T>
  size: ElementSize
} {
  const ref = useRef<T>(null)
  const [size, setSize] = useState<ElementSize>({ width: 0, height: 0 })

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const update = () => {
      const rect = element.getBoundingClientRect()
      setSize((previous) =>
        Math.abs(previous.width - rect.width) < 1 && Math.abs(previous.height - rect.height) < 1
          ? previous
          : { width: rect.width, height: rect.height },
      )
    }

    update()
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', update)
      return () => window.removeEventListener('resize', update)
    }
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return { ref, size }
}
