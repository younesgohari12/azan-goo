import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, type QueryValue } from './client'
import type { Automation, Product, SettingsPayload } from './types'

export const queryKeys = {
  dashboard: (params: { store_id?: number; range?: string }) => ['dashboard', params] as const,
  activity: (params: { limit?: number; type?: string }) => ['activity', params] as const,
  stores: () => ['stores'] as const,
  products: (params: Record<string, unknown>) => ['products', params] as const,
  product: (id: number) => ['product', id] as const,
  priceHistory: (params: { product_id?: number; limit?: number }) => ['price-history', params] as const,
  inventory: (storeId?: number) => ['inventory', storeId] as const,
  orders: (params: Record<string, unknown>) => ['orders', params] as const,
  order: (id: number) => ['order', id] as const,
  sync: (storeId?: number) => ['sync', storeId] as const,
  jobs: (params: Record<string, unknown>) => ['jobs', params] as const,
  job: (id: number) => ['job', id] as const,
  automations: () => ['automations'] as const,
  discounts: () => ['discounts'] as const,
  report: (params: Record<string, unknown>) => ['report', params] as const,
  notifications: () => ['notifications'] as const,
  settings: () => ['settings'] as const,
}

export function useDashboard(params: { store_id?: number; range?: string }) {
  return useQuery({ queryKey: queryKeys.dashboard(params), queryFn: () => api.dashboard(params), placeholderData: keepPreviousData })
}

export function useActivity(params: { limit?: number; type?: string } = {}) {
  return useQuery({ queryKey: queryKeys.activity(params), queryFn: () => api.activity(params) })
}

export function useStores() {
  return useQuery({ queryKey: queryKeys.stores(), queryFn: api.stores, staleTime: 60_000 })
}

export function useProducts(params: Record<string, QueryValue>) {
  return useQuery({ queryKey: queryKeys.products(params), queryFn: () => api.products(params), placeholderData: keepPreviousData })
}

export function useProduct(id: number | null) {
  return useQuery({ queryKey: queryKeys.product(id ?? 0), queryFn: () => api.product(id as number), enabled: id !== null })
}

export function usePriceHistory(params: { product_id?: number; limit?: number } = {}) {
  return useQuery({ queryKey: queryKeys.priceHistory(params), queryFn: () => api.priceHistory(params) })
}

export function useInventory(storeId?: number) {
  return useQuery({ queryKey: queryKeys.inventory(storeId), queryFn: () => api.inventorySummary({ store_id: storeId }) })
}

export function useOrders(params: Record<string, QueryValue>) {
  return useQuery({ queryKey: queryKeys.orders(params), queryFn: () => api.orders(params), placeholderData: keepPreviousData })
}

export function useOrder(id: number | null) {
  return useQuery({ queryKey: queryKeys.order(id ?? 0), queryFn: () => api.order(id as number), enabled: id !== null })
}

export function useSyncOverview(storeId?: number) {
  return useQuery({
    queryKey: queryKeys.sync(storeId),
    queryFn: () => api.syncStatus({ store_id: storeId }),
    refetchInterval: (query) => (query.state.data?.running_job ? 2000 : 20_000),
  })
}

export function useJobs(params: Record<string, QueryValue>) {
  return useQuery({ queryKey: queryKeys.jobs(params), queryFn: () => api.jobs(params), placeholderData: keepPreviousData, refetchInterval: 5000 })
}

export function useJob(id: number | null) {
  return useQuery({ queryKey: queryKeys.job(id ?? 0), queryFn: () => api.job(id as number), enabled: id !== null })
}

export function useAutomations() {
  return useQuery({ queryKey: queryKeys.automations(), queryFn: api.automations })
}

export function useDiscounts() {
  return useQuery({ queryKey: queryKeys.discounts(), queryFn: api.discounts })
}

export function useReport(params: Record<string, unknown>) {
  return useQuery({ queryKey: queryKeys.report(params), queryFn: () => api.report(params as { type: string; from?: string; to?: string }), placeholderData: keepPreviousData })
}

export function useNotifications() {
  return useQuery({ queryKey: queryKeys.notifications(), queryFn: api.notifications, refetchInterval: 60_000 })
}

export function useSettings() {
  return useQuery({ queryKey: queryKeys.settings(), queryFn: api.settings })
}

/* --------------------------------- mutations -------------------------------- */

export function useUpdateProduct() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: Partial<Pick<Product, 'wc_price' | 'wc_stock' | 'sync_status' | 'stock_source'>> }) =>
      api.updateProduct(id, body),
    onSuccess: (product) => {
      client.invalidateQueries({ queryKey: ['products'] })
      client.setQueryData(queryKeys.product(product.id), product)
      client.invalidateQueries({ queryKey: queryKeys.priceHistory({}) })
      client.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useBulkProducts() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: api.bulkProducts,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['products'] })
      client.invalidateQueries({ queryKey: ['inventory'] })
      client.invalidateQueries({ queryKey: ['price-history'] })
      client.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useCheckStore() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.checkStore(id),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.stores() }),
  })
}

export function useRunSync() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: api.runSync,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['sync'] })
      client.invalidateQueries({ queryKey: ['jobs'] })
      client.invalidateQueries({ queryKey: ['stores'] })
    },
  })
}

export function useCancelJob() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.cancelJob(id),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['jobs'] })
      client.invalidateQueries({ queryKey: ['sync'] })
    },
  })
}

export function useRetryJob() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.retryJob(id),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['jobs'] })
      client.invalidateQueries({ queryKey: ['sync'] })
    },
  })
}

export function useToggleAutomation() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.toggleAutomation(id),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.automations() }),
  })
}

export function useRunAutomation() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.runAutomation(id),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: queryKeys.automations() })
      client.invalidateQueries({ queryKey: queryKeys.activity({}) })
    },
  })
}

export function useCreateAutomation() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (body: Omit<Automation, 'id' | 'last_run_at' | 'next_run_at' | 'last_result' | 'runs_count'>) => api.createAutomation(body),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.automations() }),
  })
}

export function useUpdateAutomation() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: Partial<Automation> }) => api.updateAutomation(id, body),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.automations() }),
  })
}

export function useMarkNotifications() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: api.markNotifications,
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.notifications() }),
  })
}

export function useSaveSettings() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (body: SettingsPayload) => api.saveSettings(body),
    onSuccess: (data) => client.setQueryData(queryKeys.settings(), data),
  })
}
