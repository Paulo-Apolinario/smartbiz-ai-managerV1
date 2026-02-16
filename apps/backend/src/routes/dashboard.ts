import { FastifyInstance, FastifyReply } from 'fastify'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middlewares/auth.middleware'
import { authorize } from '../middlewares/authorize'

export async function dashboardRoutes(app: FastifyInstance) {
  app.get(
    '/',
    {
      preHandler: [authMiddleware, authorize(['ADMIN', 'MANAGER'])]
    },
    async (request: any, reply: FastifyReply) => {
      const { tenantId } = request.user

      // Datas (hoje / 7 dias / 30 dias)
      const now = new Date()
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const last7Days = new Date(now)
      last7Days.setDate(now.getDate() - 7)
      const last30Days = new Date(now)
      last30Days.setDate(now.getDate() - 30)

      // 1) Contagem de pedidos (total + por status)
      const [totalOrders, pendingOrders, completedOrders, cancelledOrders] = await Promise.all([
        prisma.order.count({ where: { tenantId } }),
        prisma.order.count({ where: { tenantId, status: 'PENDING' } }),
        prisma.order.count({ where: { tenantId, status: 'COMPLETED' } }),
        prisma.order.count({ where: { tenantId, status: 'CANCELLED' } })
      ])

      // 2) Receita (somente COMPLETED)
      const [completedTotalAgg, todayAgg, last7Agg, last30Agg] = await Promise.all([
        prisma.order.aggregate({
          where: { tenantId, status: 'COMPLETED' },
          _sum: { total: true }
        }),
        prisma.order.aggregate({
          where: { tenantId, status: 'COMPLETED', createdAt: { gte: startOfToday } },
          _sum: { total: true }
        }),
        prisma.order.aggregate({
          where: { tenantId, status: 'COMPLETED', createdAt: { gte: last7Days } },
          _sum: { total: true }
        }),
        prisma.order.aggregate({
          where: { tenantId, status: 'COMPLETED', createdAt: { gte: last30Days } },
          _sum: { total: true }
        })
      ])

      const completedTotal = completedTotalAgg._sum.total ?? 0
      const revenueToday = todayAgg._sum.total ?? 0
      const revenueLast7Days = last7Agg._sum.total ?? 0
      const revenueLast30Days = last30Agg._sum.total ?? 0

      // 3) Total de clientes
      const totalCustomers = await prisma.client.count({ where: { tenantId } })

      // 4) Estoque
      const totalProducts = await prisma.product.count({ where: { tenantId } })

      // Defina o limite de baixo estoque (padrão 5)
      const LOW_STOCK_THRESHOLD = 5

      const lowStockProducts = await prisma.product.findMany({
        where: {
          tenantId,
          stock: { lte: LOW_STOCK_THRESHOLD }
        },
        select: {
          id: true,
          name: true,
          stock: true
        },
        orderBy: { stock: 'asc' },
        take: 10
      })

      return reply.send({
        orders: {
          total: totalOrders,
          pending: pendingOrders,
          completed: completedOrders,
          cancelled: cancelledOrders
        },
        revenue: {
          completedTotal,
          today: revenueToday,
          last7Days: revenueLast7Days,
          last30Days: revenueLast30Days
        },
        customers: {
          total: totalCustomers
        },
        inventory: {
          totalProducts,
          lowStockCount: lowStockProducts.length,
          lowStockProducts
        }
      })
    }
  )
}
