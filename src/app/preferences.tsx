import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { configureDisplay } from '@/lib/format'

type Theme = 'light' | 'dark' | 'system'

export interface Preferences {
  theme: Theme
  sidebarCollapsed: boolean
  density: 'comfortable' | 'compact'
  dateDisplay: 'jalali' | 'gregorian'
  numberDisplay: 'fa' | 'en'
  activeStoreId: number
  dashboardRange: string
  showDemoData: boolean
}

const STORAGE_KEY = 'snappshop:preferences'

const defaults: Preferences = {
  theme: 'dark',
  sidebarCollapsed: false,
  density: 'comfortable',
  dateDisplay: 'jalali',
  numberDisplay: 'fa',
  activeStoreId: 1,
  dashboardRange: '30d',
  showDemoData: true,
}

type PreferencesContextValue = {
  preferences: Preferences
  resolvedTheme: 'light' | 'dark'
  setPreference: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void
  toggleTheme: () => void
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null)

function readStored(): Preferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaults
    return { ...defaults, ...(JSON.parse(raw) as Partial<Preferences>) }
  } catch {
    return defaults
  }
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<Preferences>(readStored)
  const [systemDark, setSystemDark] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)').matches : true,
  )

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (event: MediaQueryListEvent) => setSystemDark(event.matches)
    media.addEventListener('change', handler)
    return () => media.removeEventListener('change', handler)
  }, [])

  const resolvedTheme: 'light' | 'dark' =
    preferences.theme === 'system' ? (systemDark ? 'dark' : 'light') : preferences.theme

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', resolvedTheme === 'dark')
    root.style.colorScheme = resolvedTheme
  }, [resolvedTheme])

  useEffect(() => {
    configureDisplay({ number: preferences.numberDisplay, date: preferences.dateDisplay })
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
  }, [preferences])

  const setPreference = useCallback(<K extends keyof Preferences>(key: K, value: Preferences[K]) => {
    setPreferences((prev) => ({ ...prev, [key]: value }))
  }, [])

  const toggleTheme = useCallback(() => {
    setPreferences((prev) => ({
      ...prev,
      theme: (prev.theme === 'dark' ? 'light' : 'dark') as Theme,
    }))
  }, [])

  const value = useMemo(
    () => ({ preferences, resolvedTheme, setPreference, toggleTheme }),
    [preferences, resolvedTheme, setPreference, toggleTheme],
  )

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>
}

export function usePreferences() {
  const context = useContext(PreferencesContext)
  if (!context) throw new Error('usePreferences must be used inside PreferencesProvider')
  return context
}
