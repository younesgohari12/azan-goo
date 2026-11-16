import { Link, useLocation } from 'react-router-dom'
import {
  AlertTriangle,
  Bell,
  CheckCheck,
  CheckCircle2,
  ChevronDown,
  Info,
  Menu,
  Moon,
  Search,
  Settings,
  Sun,
  UserRound,
  XCircle,
  Zap,
} from 'lucide-react'
import { useMarkNotifications, useNotifications, useStores, useSyncOverview } from '@/api/hooks'
import { findNavItem, navGroups, quickActions } from '@/app/nav'
import { usePreferences } from '@/app/preferences'
import { formatRelative } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button, IconButton } from '@/components/ui/button'
import { MenuItem, MenuSeparator, Popover } from '@/components/ui/popover'
import { StoreMark } from '@/components/ui/product-thumb'
import { useToast } from '@/components/ui/toast'
import { Tooltip } from '@/components/ui/tooltip'

const notificationIcons = {
  success: <CheckCircle2 className="h-4 w-4 text-success" />,
  error: <XCircle className="h-4 w-4 text-danger" />,
  warning: <AlertTriangle className="h-4 w-4 text-warning" />,
  info: <Info className="h-4 w-4 text-info" />,
}

function SyncStatusPill() {
  const { preferences } = usePreferences()
  const { data } = useSyncOverview(preferences.activeStoreId)
  const running = Boolean(data?.running_job)

  return (
    <Tooltip
      content={
        running
          ? `همگام‌سازی در حال اجراست — ${data?.running_job?.progress ?? 0}٪`
          : data?.next_sync_at
            ? `همگام‌سازی بعدی: ${formatRelative(data.next_sync_at)}`
            : 'زمان همگام‌سازی بعدی مشخص نیست'
      }
    >
      <Link
        to="/sync"
        className="hidden h-8 items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 text-[11px] text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground xl:flex"
      >
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            running ? 'animate-pulse-soft bg-info' : data?.connected ? 'bg-success' : 'bg-danger',
          )}
        />
        <span className="max-w-[130px] truncate">
          {running ? 'همگام‌سازی جاری' : data?.last_sync_at ? `آخرین همگام‌سازی ${formatRelative(data.last_sync_at)}` : 'بدون همگام‌سازی'}
        </span>
      </Link>
    </Tooltip>
  )
}

function StoreSwitcher() {
  const { preferences, setPreference } = usePreferences()
  const { data: stores, isLoading } = useStores()
  const active = stores?.find((store) => store.id === preferences.activeStoreId) ?? stores?.[0]

  return (
    <Popover
      align="end"
      contentClassName="w-64"
      trigger={({ toggle }) => (
        <button
          type="button"
          onClick={toggle}
          aria-label="انتخاب فروشگاه فعال"
          className="flex h-8 max-w-[210px] items-center gap-2 rounded-lg border border-border bg-card px-2 text-[11.5px] font-medium text-foreground transition-colors hover:border-primary/30"
        >
          <span
            className={cn(
              'h-1.5 w-1.5 shrink-0 rounded-full',
              active?.status === 'connected' ? 'bg-success' : active?.status === 'error' ? 'bg-danger' : 'bg-muted-foreground/50',
            )}
          />
          <span className="truncate">{isLoading ? 'در حال بارگذاری…' : active?.name ?? 'فروشگاهی نیست'}</span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </button>
      )}
    >
      <div className="px-2.5 py-1.5 text-[10px] font-medium text-muted-foreground">فروشگاه فعال</div>
      {stores?.map((store) => (
        <MenuItem
          key={store.id}
          active={store.id === preferences.activeStoreId}
          onClick={() => setPreference('activeStoreId', store.id)}
          icon={<StoreMark name={store.name} className="h-5 w-5 text-[10px]" />}
        >
          <span className="flex items-center justify-between gap-2">
            <span className="truncate">{store.name}</span>
            <Badge variant={store.status === 'connected' ? 'success' : store.status === 'error' ? 'danger' : 'neutral'} dot>
              {store.status === 'connected' ? 'متصل' : store.status === 'error' ? 'خطا' : 'قطع'}
            </Badge>
          </span>
        </MenuItem>
      ))}
      <MenuSeparator />
      <Link to="/stores" className="block">
        <MenuItem icon={<Settings className="h-3.5 w-3.5" />}>مدیریت فروشگاه‌ها</MenuItem>
      </Link>
    </Popover>
  )
}

function NotificationsMenu() {
  const { data: notifications } = useNotifications()
  const markRead = useMarkNotifications()
  const unread = notifications?.filter((item) => !item.read) ?? []

  return (
    <Popover
      align="end"
      contentClassName="w-[340px] p-0"
      trigger={({ toggle }) => (
        <IconButton aria-label="اعلان‌ها" onClick={toggle} className="relative" variant="ghost">
          <Bell className="h-[18px] w-[18px]" />
          {unread.length > 0 && (
            <span className="absolute end-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground ring-2 ring-background">
              {unread.length}
            </span>
          )}
        </IconButton>
      )}
    >
      <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
        <p className="text-xs font-semibold text-foreground">اعلان‌ها</p>
        <button
          type="button"
          onClick={() => markRead.mutate({ all: true })}
          className="flex items-center gap-1 text-[10.5px] text-muted-foreground transition-colors hover:text-primary"
        >
          <CheckCheck className="h-3 w-3" />
          خواندن همه
        </button>
      </div>
      <div className="max-h-[320px] overflow-y-auto">
        {notifications?.slice(0, 5).map((item) => (
          <Link
            key={item.id}
            to={item.link ?? '/notifications'}
            className={cn(
              'flex gap-2.5 border-b border-border/60 px-3 py-2.5 transition-colors last:border-0 hover:bg-muted/50',
              !item.read && 'bg-primary-soft/25',
            )}
          >
            <span className="mt-0.5">{notificationIcons[item.type]}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[11.5px] font-medium text-foreground">{item.title}</span>
              <span className="mt-0.5 block truncate text-[10.5px] text-muted-foreground">{item.body}</span>
              <span className="mt-1 block text-[9.5px] text-muted-foreground/70">{formatRelative(item.created_at)}</span>
            </span>
          </Link>
        ))}
        {notifications?.length === 0 && <p className="px-3 py-6 text-center text-[11px] text-muted-foreground">اعلانی وجود ندارد.</p>}
      </div>
      <Link to="/notifications" className="block border-t border-border px-3 py-2 text-center text-[11px] font-medium text-primary hover:bg-muted/50">
        مشاهده مرکز اعلان‌ها
      </Link>
    </Popover>
  )
}

export function Topbar({ onOpenSearch, onOpenMobileMenu }: { onOpenSearch: () => void; onOpenMobileMenu: () => void }) {
  const location = useLocation()
  const { resolvedTheme, toggleTheme } = usePreferences()
  const { toast } = useToast()
  const activeItem = findNavItem(location.pathname)
  const group = navGroups.find((entry) => entry.items.some((item) => item.to === activeItem?.to))

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/85 px-3 backdrop-blur-md sm:px-4">
      <IconButton aria-label="باز کردن منو" onClick={onOpenMobileMenu} className="lg:hidden">
        <Menu className="h-[18px] w-[18px]" />
      </IconButton>

      <nav aria-label="breadcrumb" className="hidden min-w-0 items-center gap-1.5 text-[11px] sm:flex">
        <span className="text-muted-foreground">{group?.label ?? 'پنل'}</span>
        <span className="text-muted-foreground/40">/</span>
        <span className="truncate font-medium text-foreground">{activeItem?.label ?? 'داشبورد'}</span>
      </nav>

      <div className="flex-1" />

      <button
        type="button"
        onClick={onOpenSearch}
        className="hidden h-8 w-44 items-center gap-2 rounded-lg border border-border bg-card px-2.5 text-[11.5px] text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground md:flex xl:w-56"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="flex-1 text-start">جست‌وجوی سراسری…</span>
        <kbd className="rounded border border-border bg-muted px-1 text-[9px] font-medium">⌘K</kbd>
      </button>
      <IconButton aria-label="جست‌وجو" onClick={onOpenSearch} className="md:hidden">
        <Search className="h-[18px] w-[18px]" />
      </IconButton>

      <SyncStatusPill />
      <StoreSwitcher />

      <Popover
        align="end"
        contentClassName="w-56"
        trigger={({ toggle }) => (
          <IconButton aria-label="عملیات سریع" onClick={toggle} variant="ghost">
            <Zap className="h-[18px] w-[18px]" />
          </IconButton>
        )}
      >
        <div className="px-2.5 py-1.5 text-[10px] font-medium text-muted-foreground">عملیات سریع</div>
        {quickActions.map((action) => {
          const Icon = action.icon
          return (
            <Link key={action.to} to={action.to} className="block">
              <MenuItem icon={<Icon className="h-3.5 w-3.5" />}>{action.label}</MenuItem>
            </Link>
          )
        })}
      </Popover>

      <NotificationsMenu />

      <Tooltip content={resolvedTheme === 'dark' ? 'حالت روشن' : 'حالت تاریک'}>
        <IconButton aria-label="تغییر تم" onClick={toggleTheme} variant="ghost">
          {resolvedTheme === 'dark' ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
        </IconButton>
      </Tooltip>

      <Popover
        align="end"
        contentClassName="w-60"
        trigger={({ toggle }) => (
          <button
            type="button"
            onClick={toggle}
            aria-label="پروفایل کاربر"
            className="ms-0.5 flex items-center gap-2 rounded-full border border-border bg-card p-0.5 pe-2 transition-colors hover:border-primary/30"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-slate-600 to-slate-800 text-[10px] font-semibold text-white">
              م
            </span>
            <span className="hidden text-[11px] font-medium text-foreground sm:block">مدیر فروشگاه</span>
            <ChevronDown className="hidden h-3 w-3 text-muted-foreground sm:block" />
          </button>
        )}
      >
        <div className="border-b border-border px-2.5 py-2">
          <p className="text-[12px] font-medium text-foreground">مدیر فروشگاه</p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">نقش: administrator — از وردپرس</p>
        </div>
        <Link to="/settings?tab=general" className="block">
          <MenuItem icon={<UserRound className="h-3.5 w-3.5" />}>تنظیمات حساب</MenuItem>
        </Link>
        <Link to="/settings" className="block">
          <MenuItem icon={<Settings className="h-3.5 w-3.5" />}>تنظیمات پنل</MenuItem>
        </Link>
        <MenuSeparator />
        <div className="px-2.5 py-1">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-[11px]"
            onClick={() => toast({ title: 'نشست وردپرس', description: 'خروج از حساب از طریق وردپرس مدیریت می‌شود.', variant: 'info' })}
          >
            درباره نشست وردپرس
          </Button>
        </div>
      </Popover>
    </header>
  )
}
