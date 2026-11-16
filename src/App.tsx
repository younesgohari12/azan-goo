import { Link, Route, Routes } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { AppShell } from '@/components/layout/app-shell'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import ActivityPage from '@/pages/activity'
import AutomationPage from '@/pages/automation'
import DashboardPage from '@/pages/dashboard'
import DiscountsPage from '@/pages/discounts'
import InventoryPage from '@/pages/inventory'
import JobsPage from '@/pages/jobs'
import NotificationsPage from '@/pages/notifications'
import OrderDetailPage from '@/pages/orders/detail'
import OrdersPage from '@/pages/orders'
import PricingPage from '@/pages/pricing'
import ProductsPage from '@/pages/products'
import ReportsPage from '@/pages/reports'
import SettingsPage from '@/pages/settings'
import StoresPage from '@/pages/stores'
import SyncCenterPage from '@/pages/sync-center'

function NotFoundPage() {
  return (
    <Card>
      <EmptyState
        icon={Compass}
        title="صفحه پیدا نشد"
        description="آدرس واردشده در این پنل وجود ندارد یا جابه‌جا شده است."
        action={
          <Link to="/">
            <Button variant="primary" size="sm">
              بازگشت به داشبورد
            </Button>
          </Link>
        }
      />
    </Card>
  )
}

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="stores" element={<StoresPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="pricing" element={<PricingPage />} />
        <Route path="discounts" element={<DiscountsPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="orders/:id" element={<OrderDetailPage />} />
        <Route path="sync" element={<SyncCenterPage />} />
        <Route path="automation" element={<AutomationPage />} />
        <Route path="jobs" element={<JobsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="activity" element={<ActivityPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
