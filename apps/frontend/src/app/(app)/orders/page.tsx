'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { listClients, Client } from '@/lib/clients'
import { listProducts, Product } from '@/lib/products'
import { createOrder, listOrders, completeOrder, cancelOrder, Order } from '@/lib/orders'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

function moneyBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function StatusBadge({ status }: { status: Order['status'] }) {
  if (status === 'COMPLETED') {
    return <Badge className="border bg-emerald-500/10 text-emerald-700 border-emerald-500/25">COMPLETO</Badge>
  }
  if (status === 'CANCELLED') {
    return <Badge className="border bg-red-500/10 text-red-700 border-red-500/25">CANCELADO</Badge>
  }
  return <Badge className="border bg-amber-500/10 text-amber-700 border-amber-500/25">PENDENTE</Badge>
}

export default function OrdersPage() {
  const { user } = useAuth()

  const canSell = user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.role === 'SALES'
  const canManage = user?.role === 'ADMIN' || user?.role === 'MANAGER' // completar/cancelar

  const [clients, setClients] = useState<Client[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  const [clientId, setClientId] = useState('')
  const [productId, setProductId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [busyId, setBusyId] = useState<string | null>(null)

  const selectedProduct = useMemo(
    () => products.find(p => p.id === productId),
    [products, productId]
  )

  const totalPreview = useMemo(() => {
    const q = Number(quantity)
    if (!selectedProduct || !Number.isFinite(q) || q <= 0) return null
    return selectedProduct.price * q
  }, [selectedProduct, quantity])

  const load = async () => {
    setLoading(true)
    try {
      const [c, p, o] = await Promise.all([listClients(), listProducts(), listOrders()])
      setClients(c)
      setProducts(p)
      setOrders(o)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const onCreateOrder = async () => {
    if (!clientId) return alert('Selecione um cliente')
    if (!productId) return alert('Selecione um produto')

    const q = Number(quantity)
    if (!Number.isInteger(q) || q <= 0) return alert('Quantidade inválida')

    await createOrder({
      clientId,
      items: [{ productId, quantity: q }]
    })

    alert('Pedido criado com sucesso!')
    setQuantity('1')
    await load()
  }

  const onComplete = async (id: string) => {
    try {
      setBusyId(id)
      await completeOrder(id)
      await load()
    } catch (e: unknown) {
      alert((e instanceof Error ? e.message : String(e)) ?? 'Erro ao completar')
    } finally {
      setBusyId(null)
    }
  }

  const onCancel = async (id: string) => {
    const ok = confirm('Cancelar pedido e devolver estoque?')
    if (!ok) return
    try {
      setBusyId(id)
      await cancelOrder(id)
      await load()
    } catch (e: unknown) {
      alert((e instanceof Error ? e.message : String(e)) ?? 'Erro ao cancelar')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Vendas</h1>
          </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={load} disabled={loading}>
            {loading ? 'Carregando...' : 'Atualizar'}
          </Button>
          
        </div>
      </div>

      {/* Criar pedido */}
      <Card className="border bg-background/55 backdrop-blur">
        <CardHeader>
          <CardTitle>Criar pedido</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Cliente</Label>
                  <select
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                  >
                    <option value="">Selecione</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Produto</Label>
                  <select
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                    value={productId}
                    onChange={(e) => setProductId(e.target.value)}
                  >
                    <option value="">Selecione</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} (stock {p.stock})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Quantidade</Label>
                  <Input value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label>Prévia total</Label>
                  <div className="h-10 w-full rounded-md border bg-background px-3 flex items-center text-sm">
                    {totalPreview === null ? '—' : moneyBRL(totalPreview)}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button onClick={onCreateOrder} disabled={!canSell} title={!canSell ? 'Sem permissão' : ''}>
                  Criar pedido
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                SALES pode criar pedido. Completar/Cancelar somente ADMIN/MANAGER.
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Lista / Status / Ações */}
      <Card className="border bg-background/55 backdrop-blur">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Pedidos</CardTitle>
          <Badge variant="secondary">{orders.length}</Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando pedidos...</p>
          ) : orders.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum pedido encontrado.</p>
          ) : (
            <div className="space-y-2">
              {orders.map((o) => (
                <div key={o.id} className="rounded-md border px-3 py-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">
                        {o.client?.name ?? 'Cliente'}{' '}
                        <span className="text-xs text-muted-foreground">
                          • {o.client?.email ?? '—'}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(o.createdAt).toLocaleString('pt-BR')}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-sm font-semibold">{moneyBRL(Number(o.total))}</div>
                      <StatusBadge status={o.status} />
                    </div>
                  </div>

                  <Separator className="my-2" />

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs text-muted-foreground">
                      Itens:{' '}
                      {o.items.map((it) => (
                        <span key={it.id} className="mr-2">
                          {it.product?.name ?? it.productId} x{it.quantity}
                        </span>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => onComplete(o.id)}
                        disabled={!canManage || o.status !== 'PENDING' || busyId === o.id}
                        title={!canManage ? 'Sem permissão' : ''}
                      >
                        Completar
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => onCancel(o.id)}
                        disabled={!canManage || o.status !== 'PENDING' || busyId === o.id}
                        title={!canManage ? 'Sem permissão' : ''}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
