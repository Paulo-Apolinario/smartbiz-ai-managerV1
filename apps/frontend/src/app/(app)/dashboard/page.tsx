'use client'

import { useEffect, useMemo, useState } from 'react'
import { getDashboard, DashboardData } from '@/lib/dashboard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

function moneyBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function statusBadge(status: 'PENDING' | 'COMPLETED' | 'CANCELLED') {
  const base = 'border'
  if (status === 'COMPLETED') return <Badge className={`${base} bg-emerald-500/10 text-emerald-700 border-emerald-500/25`}>COMPLETO</Badge>
  if (status === 'CANCELLED') return <Badge className={`${base} bg-red-500/10 text-red-700 border-red-500/25`}>CANCELADO</Badge>
  return <Badge className={`${base} bg-amber-500/10 text-amber-700 border-amber-500/25`}>PENDENTE</Badge>
}

function Sparkline({ data }: { data: { day: string; value: number }[] }) {
  const values = data.map(d => d.value)
  const max = Math.max(...values, 1)
  const w = 260
  const h = 48
  const points = data.map((d, i) => {
    const x = (i / Math.max(data.length - 1, 1)) * w
    const y = h - (d.value / max) * h
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} className="opacity-90">
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        points={points}
      />
    </svg>
  )
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setErr(null)
    try {
      const d = await getDashboard()
      setData(d)
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Erro ao carregar dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const kpis = useMemo(() => {
    if (!data) return null
    return [
      { title: 'Pedidos', value: String(data.kpis.ordersTotal), sub: 'Total de pedidos' },
      { title: 'Receita (30 dias)', value: moneyBRL(data.kpis.revenue30), sub: 'Somente COMPLETOS' },
      { title: 'Clientes', value: String(data.kpis.clientsCount), sub: 'Cadastrados' },
      { title: 'Estoque baixo', value: String(data.kpis.lowStockCount), sub: `Produtos ≤ ${data.kpis.stockLimit}` },
    ]
  }, [data])

  return (
    <div className="w-full px-4 sm:px-6 lg:px-10 2xl:px-16">
      <div className="mx-auto w-full max-w-screen-2xl space-y-6 py-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Visão geral do seu tenant (KPIs, estoque e vendas).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge className="border border-primary/25 bg-primary/10 text-primary">v1</Badge>
            <Button variant="outline" onClick={load} disabled={loading}>
              {loading ? 'Carregando...' : 'Atualizar'}
            </Button>
          </div>
        </div>

        {err && (
          <Card className="border-red-500/30">
            <CardHeader><CardTitle>Erro</CardTitle></CardHeader>
            <CardContent className="text-sm text-red-600">{err}</CardContent>
          </Card>
        )}

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {(kpis ?? []).map((k) => (
            <Card
              key={k.title}
              className="group relative overflow-hidden border bg-background/55 backdrop-blur transition hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-sm"
            >
              <div className="pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100">
                <div className="absolute -top-24 -right-24 h-56 w-56 rounded-full bg-primary/10 blur-2xl" />
              </div>

              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {k.title.toUpperCase()}
                </CardTitle>
              </CardHeader>

              <CardContent>
                <p className="text-2xl font-bold tracking-tight">{k.value}</p>
                <p className="text-xs text-muted-foreground">{k.sub}</p>
                <div className="mt-3 h-1 w-16 rounded-full bg-[linear-gradient(90deg,hsl(var(--primary)/0.70),hsl(var(--primary)/0.20),transparent)] opacity-70 transition group-hover:opacity-100" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* A) Status pedidos */}
        {data && (
          <div className="grid gap-4 xl:grid-cols-3">
            <Card className="border bg-background/55 backdrop-blur xl:col-span-1">
              <CardHeader>
                <CardTitle>Status dos pedidos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Pendentes</span>
                  <span className="font-semibold">{data.kpis.ordersPending}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Concluídos</span>
                  <span className="font-semibold">{data.kpis.ordersCompleted}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Cancelados</span>
                  <span className="font-semibold">{data.kpis.ordersCancelled}</span>
                </div>
                <Separator />
                <div className="text-xs text-muted-foreground">
                  Dica: pendentes altos = gargalo; cancelados altos = problema de estoque/preço/atendimento.
                </div>
              </CardContent>
            </Card>

            {/* C) Sparkline receita */}
            <Card className="border bg-background/55 backdrop-blur xl:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Receita recente (últimos dias)</CardTitle>
                <Badge variant="secondary">COMPLETED</Badge>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  Soma diária dos pedidos concluídos (sparkline).
                </div>
                <div className="text-primary">
                  <Sparkline data={data.revenueSeries7} />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{data.revenueSeries7[0]?.day}</span>
                  <span>{data.revenueSeries7[data.revenueSeries7.length - 1]?.day}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* B) Pedidos recentes + Estoque baixo */}
        {data && (
          <div className="grid gap-4 xl:grid-cols-2">
            <Card className="border bg-background/55 backdrop-blur">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Pedidos recentes</CardTitle>
                <Badge variant="secondary">Últimos 5</Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.recentOrders.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum pedido encontrado.</p>
                ) : (
                  <div className="space-y-2">
                    {data.recentOrders.map(o => (
                      <div key={o.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">{o.client?.name ?? 'Cliente'}</div>
                          <div className="truncate text-xs text-muted-foreground">
                            {o.client?.email ?? '—'} • {new Date(o.createdAt).toLocaleString('pt-BR')}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-sm font-semibold">{moneyBRL(Number(o.total))}</div>
                          {statusBadge(o.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border bg-background/55 backdrop-blur">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Produtos com estoque baixo</CardTitle>
                <Badge variant="secondary">≤ {data.kpis.stockLimit}</Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.lowStockProducts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum produto com estoque baixo ✨</p>
                ) : (
                  <div className="space-y-2">
                    {data.lowStockProducts.map(p => (
                      <div key={p.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">{p.name}</div>
                          <div className="text-xs text-muted-foreground">{moneyBRL(Number(p.price))}</div>
                        </div>
                        <Badge className="border bg-amber-500/10 text-amber-700 border-amber-500/25">
                          stock {p.stock}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
