import { FastifyInstance, FastifyReply } from 'fastify'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middlewares/auth.middleware'

// helper: yyyy-mm-dd
function toDayKey(d: Date) {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export async function dashboardRoutes(app: FastifyInstance) {
  app.get(
    '/',
    { preHandler: [authMiddleware] },
    async (request: any, reply: FastifyReply) => {
      const { tenantId } = request.user

      const stockLimit = Number(request.query?.stockLimit ?? 10) // padrão 10 (você pode mudar)

      const now = new Date()
      const from30 = new Date(now)
      from30.setDate(from30.getDate() - 30)

      const from7 = new Date(now)
      from7.setDate(from7.getDate() - 7)

      // ---------- KPIs básicos (counts / sum) ----------
      const [
        ordersTotal,
        ordersPending,
        ordersCompleted,
        ordersCancelled,
        clientsCount,
        revenue30Agg,
        lowStockCount
      ] = await Promise.all([
        prisma.order.count({ where: { tenantId } }),
        prisma.order.count({ where: { tenantId, status: 'PENDING' } }),
        prisma.order.count({ where: { tenantId, status: 'COMPLETED' } }),
        prisma.order.count({ where: { tenantId, status: 'CANCELLED' } }),
        prisma.client.count({ where: { tenantId } }),
        prisma.order.aggregate({
          where: { tenantId, status: 'COMPLETED', createdAt: { gte: from30 } },
          _sum: { total: true }
        }),
        prisma.product.count({
          where: { tenantId, stock: { lte: stockLimit } }
        })
      ])

      const revenue30 = Number(revenue30Agg._sum.total ?? 0)

      // ---------- Estoque baixo (top 5) ----------
      const lowStockProducts = await prisma.product.findMany({
        where: { tenantId, stock: { lte: stockLimit } },
        orderBy: { stock: 'asc' },
        take: 5,
        select: { id: true, name: true, stock: true, price: true }
      })

      // ---------- Pedidos recentes (top 5) ----------
      const recentOrders = await prisma.order.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          client: { select: { id: true, name: true, email: true } }
        }
      })

      // ---------- Donut: distribuição por status ----------
      const statusBreakdown = [
        { status: 'PENDING', count: ordersPending },
        { status: 'COMPLETED', count: ordersCompleted },
        { status: 'CANCELLED', count: ordersCancelled }
      ]

      // ---------- Série de receita (últimos 30 dias / COMPLETED) ----------
      // Prisma não faz group by day fácil; fazemos em JS
      const completedOrders30 = await prisma.order.findMany({
        where: { tenantId, status: 'COMPLETED', createdAt: { gte: from30 } },
        select: { createdAt: true, total: true }
      })

      const seriesMap = new Map<string, number>()
      for (const o of completedOrders30) {
        const key = toDayKey(new Date(o.createdAt))
        seriesMap.set(key, (seriesMap.get(key) ?? 0) + Number(o.total))
      }

      // garante os últimos 30 dias no eixo (mesmo se 0)
      const revenueSeries30: { day: string; value: number }[] = []
      const cursor = new Date(from30)
      while (cursor <= now) {
        const key = toDayKey(cursor)
        revenueSeries30.push({ day: key, value: Number(seriesMap.get(key) ?? 0) })
        cursor.setDate(cursor.getDate() + 1)
      }

      // Série curta (7 dias) para um mini-sparkline mais bonito
      const revenueSeries7 = revenueSeries30.slice(-8) // últimos ~7 dias

      return reply.send({
        kpis: {
          ordersTotal,
          ordersPending,
          ordersCompleted,
          ordersCancelled,
          revenue30,
          clientsCount,
          lowStockCount,
          stockLimit
        },
        lowStockProducts,
        recentOrders,
        statusBreakdown,
        revenueSeries7,
        revenueSeries30
      })
    }
  )
}
