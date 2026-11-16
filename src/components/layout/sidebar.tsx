import { NavLink } from 'react-router-dom'
import { ChevronLeft, Sparkles, X, Zap } from 'lucide-react'
import { API_MODE } from '@/api/client'
import { useJobs, useNotifications } from '@/api/hooks'
import { navGroups } from '@/app/nav'
import { usePreferences } from '@/app/preferences'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { IconButton } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip'

function Brand({ collapsed }: { collapsed: boolean }) {
  return (
    <div className={cn('flex items-center gap-2.5 px-3', collapsed && 'justify-center px-0')}>
      <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-[0_6px_16px_-6px_rgba(239,68,68,0.8)]">
        <Zap className="h-[18px] w-[18px]" strokeWidth={2.4} />
      </span>
      {!collapsed && (
        <div className="min-w-0 leading-tight">
          <p className="truncate text-[13px] font-bold text-foreground">اسنپ‌شاپ اتومیشن</p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">پنل مدیریت فروشگاه</p>
        </div>
      )}
    </div>
  )
}

export function Sidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}: {
  collapsed: boolean
  onToggleCollapse: () => void
  mobileOpen: boolean
  onCloseMobile: () => void
}) {
  const { preferences } = usePreferences()
  const { data: notifications } = useNotifications()
  const { data: runningJobs } = useJobs({ status: 'running', per_page: 1 })
  const unread = notifications?.filter((item) => !item.read).length ?? 0
  const running = runningJobs?.total ?? 0

  const body = (isCollapsed: boolean) => (
    <>
      <div className="flex h-14 items-center justify-between gap-2 border-b border-border/70 px-1">
        <Brand collapsed={isCollapsed} />
        {!isCollapsed && (
          <IconButton aria-label="جمع کردن منو" onClick={onToggleCollapse} className="hidden h-7 w-7 lg:flex">
            <ChevronLeft className="h-4 w-4" />
          </IconButton>
        )}
        <IconButton aria-label="بستن منو" onClick={onCloseMobile} className="lg:hidden">
          <X className="h-4 w-4" />
        </IconButton>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto overflow-x-hidden px-2.5 py-4 no-scrollbar">
        {navGroups.map((group) => (
          <div key={group.label}>
            {!isCollapsed && (
              <p className="mb-1.5 px-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground/70">
                {group.label}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon
                const badgeCount = item.badge === 'notifications' ? unread : item.badge === 'jobs' ? running : 0
                const link = (
                  <NavLink
                    to={item.to}
                    end={item.to === '/'}
                    onClick={onCloseMobile}
                    className={({ isActive }) =>
                      cn(
                        'group relative flex h-9 items-center rounded-lg text-[12.5px] font-medium transition-colors duration-150',
                        isCollapsed ? 'justify-center px-0' : 'gap-2.5 px-2.5',
                        isActive
                          ? 'bg-sidebar-active text-primary'
                          : 'text-sidebar-foreground hover:bg-sidebar-hover hover:text-foreground',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <span className="absolute start-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full bg-primary" />
                        )}
                        <Icon className={cn('h-4 w-4 shrink-0', isActive && 'text-primary')} strokeWidth={isActive ? 2.1 : 1.8} />
                        {!isCollapsed && <span className="flex-1 truncate text-start">{item.label}</span>}
                        {badgeCount > 0 &&
                          (isCollapsed ? (
                            <span className="absolute end-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
                          ) : (
                            <span
                              className={cn(
                                'flex h-4 min-w-4 items-center justify-center rounded px-1 text-[10px] font-semibold',
                                isActive ? 'bg-primary text-primary-foreground' : 'bg-primary-soft text-primary',
                              )}
                            >
                              {badgeCount}
                            </span>
                          ))}
                      </>
                    )}
                  </NavLink>
                )
                return (
                  <li key={item.to}>
                    {isCollapsed ? (
                      <Tooltip content={item.label} side="bottom">
                        <div className="w-full">{link}</div>
                      </Tooltip>
                    ) : (
                      link
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-border/70 p-2.5">
        {API_MODE === 'mock' && preferences.showDemoData && (
          <div className={cn('mb-2 rounded-lg border border-warning/25 bg-warning-soft/60 p-2', isCollapsed && 'px-1 py-1.5')}>
            {isCollapsed ? (
              <Tooltip content="داده‌های نمایشی — بک‌اند متصل نیست">
                <span className="flex justify-center text-warning">
                  <Sparkles className="h-4 w-4" />
                </span>
              </Tooltip>
            ) : (
              <div className="flex items-start gap-1.5">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
                <div>
                  <p className="text-[10.5px] font-medium text-warning">حالت نمایشی</p>
                  <p className="mt-0.5 text-[9.5px] leading-4 text-muted-foreground">
                    داده‌ها نمونه‌اند و به افزونه وردپرس متصل نیستند.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
        {isCollapsed ? (
          <Tooltip content="باز کردن منو" side="bottom">
            <IconButton aria-label="باز کردن منو" onClick={onToggleCollapse} className="w-full">
              <ChevronLeft className="h-4 w-4 rotate-180" />
            </IconButton>
          </Tooltip>
        ) : (
          <div className="flex items-center justify-between px-1">
            <Badge variant="outline" className="text-[9.5px]">
              نسخه ۰.۱.۰
            </Badge>
            <span className="text-[9.5px] text-muted-foreground">وردپرس + ووکامرس</span>
          </div>
        )}
      </div>
    </>
  )

  return (
    <>
      {/* Desktop */}
      <aside
        className={cn(
          'sticky top-0 z-30 hidden h-screen shrink-0 flex-col border-e border-border bg-sidebar transition-[width] duration-300 ease-smooth lg:flex',
          collapsed ? 'w-[72px]' : 'w-[264px]',
        )}
      >
        {body(collapsed)}
      </aside>

      {/* Mobile drawer */}
      <div className={cn('fixed inset-0 z-[60] overflow-hidden lg:hidden', !mobileOpen && 'pointer-events-none')}>
        <div
          className={cn('absolute inset-0 bg-slate-950/50 backdrop-blur-[1px] transition-opacity', mobileOpen ? 'opacity-100' : 'opacity-0')}
          onClick={onCloseMobile}
        />
        <aside
          className={cn(
            'absolute inset-y-0 start-0 flex w-[276px] flex-col border-e border-border bg-sidebar shadow-pop transition-transform duration-300 ease-smooth',
            mobileOpen ? 'translate-x-0' : 'translate-x-full',
          )}
        >
          {body(false)}
        </aside>
      </div>
    </>
  )
}
