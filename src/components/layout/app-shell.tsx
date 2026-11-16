import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { usePreferences } from '@/app/preferences'
import { CommandPalette } from './command-palette'
import { Sidebar } from './sidebar'
import { Topbar } from './topbar'

export function AppShell() {
  const { preferences, setPreference } = usePreferences()
  const [searchOpen, setSearchOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setMobileOpen(false)
    window.scrollTo({ top: 0 })
  }, [location.pathname])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen((open) => !open)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        collapsed={preferences.sidebarCollapsed}
        onToggleCollapse={() => setPreference('sidebarCollapsed', !preferences.sidebarCollapsed)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenSearch={() => setSearchOpen(true)} onOpenMobileMenu={() => setMobileOpen(true)} />
        <main className="mx-auto w-full max-w-[1680px] flex-1 px-3 py-4 sm:px-5 sm:py-5">
          <Outlet />
        </main>
        <footer className="mx-auto flex w-full max-w-[1680px] flex-wrap items-center justify-between gap-2 border-t border-border/60 px-4 py-3 text-[10px] text-muted-foreground">
          <span>اسنپ‌شاپ اتومیشن — پنل مدیریت یکپارچه ووکامرس</span>
          <span>تمام زمان‌ها به وقت محلی و تاریخ شمسی نمایش داده می‌شوند.</span>
        </footer>
      </div>

      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  )
}
