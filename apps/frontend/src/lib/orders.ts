import { api } from './api'

export type OrderStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED'

export type OrderItem = {
  id: string
  productId: string
  quantity: number
  price: number
  product?: { id: string; name: string }
}

export type Order = {
  id: string
  tenantId: string
  clientId: string
  total: number
  status: OrderStatus
  createdBy: string
  createdAt: string
  client?: { id: string; name: string; email?: string | null; phone?: string | null }
  items: OrderItem[]
}

export async function createOrder(payload: {
  clientId: string
  items: { productId: string; quantity: number }[]
}) {
  return api<Order>('/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function listOrders() {
  return api<Order[]>('/orders')
}

export async function completeOrder(id: string) {
  return api<Order>(`/orders/${id}/complete`, { method: 'PATCH' })
}

export async function cancelOrder(id: string) {
  return api<Order>(`/orders/${id}/cancel`, { method: 'PATCH' })
}
