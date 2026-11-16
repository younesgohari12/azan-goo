import { useCallback, useEffect, useState } from 'react'

/** Persisted UI state (table columns, filters, saved views). */
export function useLocalState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? (JSON.parse(raw) as T) : initial
    } catch {
      return initial
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      /* quota or privacy mode — preference is simply not persisted */
    }
  }, [key, value])

  const reset = useCallback(() => setValue(initial), [initial])

  return [value, setValue, reset] as const
}
