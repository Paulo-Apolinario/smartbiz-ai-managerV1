import { api } from './api'

export type DashboardData = {
  kpis: {
    ordersTotal: number
    ordersPending: number
    ordersCompleted: number
    ordersCancelled: number
    revenue30: number
    clientsCount: number
    lowStockCount: number
    stockLimit: number
  }
  lowStockProducts: { id: string; name: string; stock: number; price: number }[]
  recentOrders: {
    id: string
    total: number
    status: 'PENDING' | 'COMPLETED' | 'CANCELLED'
    createdAt: string
    client: { id: string; name: string; email: string | null }
  }[]
  statusBreakdown: { status: 'PENDING' | 'COMPLETED' | 'CANCELLED'; count: number }[]
  revenueSeries7: { day: string; value: number }[]
}

export async function getDashboard() {
  return api<DashboardData>('/dashboard')
}
