import {
  Activity,
  BarChart3,
  Bell,
  BadgePercent,
  Boxes,
  CircleDollarSign,
  Cpu,
  History,
  LayoutDashboard,
  Package,
  RefreshCw,
  Settings,
  ShoppingCart,
  Store,
  Workflow,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type NavItem = {
  to: string
  label: string
  icon: LucideIcon
  badge?: 'notifications' | 'jobs'
}

export type NavGroup = {
  label: string
  items: NavItem[]
}

export const navGroups: NavGroup[] = [
  {
    label: 'مرور کلی',
    items: [
      { to: '/', label: 'داشبورد', icon: LayoutDashboard },
      { to: '/sync', label: 'مرکز همگام‌سازی', icon: RefreshCw },
    ],
  },
  {
    label: 'مدیریت فروشگاه',
    items: [
      { to: '/stores', label: 'فروشگاه‌ها', icon: Store },
      { to: '/products', label: 'محصولات', icon: Package },
      { to: '/inventory', label: 'موجودی انبار', icon: Boxes },
      { to: '/pricing', label: 'قیمت‌گذاری', icon: CircleDollarSign },
      { to: '/discounts', label: 'تخفیف‌ها', icon: BadgePercent },
      { to: '/orders', label: 'سفارش‌ها', icon: ShoppingCart },
    ],
  },
  {
    label: 'عملیات',
    items: [
      { to: '/automation', label: 'اتوماسیون', icon: Workflow },
      { to: '/jobs', label: 'پردازش‌های پس‌زمینه', icon: Cpu, badge: 'jobs' },
    ],
  },
  {
    label: 'گزارش و پیگیری',
    items: [
      { to: '/reports', label: 'گزارش‌ها', icon: BarChart3 },
      { to: '/notifications', label: 'اعلان‌ها', icon: Bell, badge: 'notifications' },
      { to: '/activity', label: 'تاریخچه فعالیت‌ها', icon: History },
    ],
  },
  {
    label: 'سیستم',
    items: [{ to: '/settings', label: 'تنظیمات', icon: Settings }],
  },
]

export const allNavItems = navGroups.flatMap((group) => group.items)

export function findNavItem(pathname: string): NavItem | undefined {
  if (pathname === '/') return allNavItems[0]
  return allNavItems.find((item) => item.to !== '/' && pathname.startsWith(item.to))
}

export const quickActions = [
  { to: '/sync', label: 'اجرای همگام‌سازی', icon: RefreshCw },
  { to: '/pricing', label: 'ویرایش گروهی قیمت', icon: CircleDollarSign },
  { to: '/inventory', label: 'بررسی مغایرت موجودی', icon: Boxes },
  { to: '/automation', label: 'ساخت قانون اتوماسیون', icon: Workflow },
  { to: '/activity', label: 'تاریخچه فعالیت‌ها', icon: Activity },
]
