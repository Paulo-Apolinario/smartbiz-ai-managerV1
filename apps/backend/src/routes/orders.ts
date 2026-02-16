import { FastifyInstance, FastifyReply } from 'fastify'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middlewares/auth.middleware'
import { authorize } from '../middlewares/authorize'

export async function ordersRoutes(app: FastifyInstance) {
  /**
   * ✅ POST /orders
   * Cria pedido + itens + baixa estoque (transação)
   * Roles: ADMIN, MANAGER, SALES
   */
  app.post(
    '/',
    {
      preHandler: [authMiddleware, authorize(['ADMIN', 'MANAGER', 'SALES'])]
    },
    async (request: any, reply: FastifyReply) => {
      const { clientId, items } = request.body as {
        clientId: string
        items: { productId: string; quantity: number }[]
      }

      const { tenantId, userId } = request.user

      if (!items || items.length === 0) {
        return reply.status(400).send({ message: 'Order precisa ter pelo menos 1 item' })
      }

      try {
        const order = await prisma.$transaction(async (tx) => {
          // 1) validar cliente do tenant
          const client = await tx.client.findFirst({
            where: { id: clientId, tenantId }
          })
          if (!client) throw new Error('CLIENT_NOT_FOUND')

          // 2) buscar produtos do tenant
          const products = await tx.product.findMany({
            where: {
              id: { in: items.map((i) => i.productId) },
              tenantId
            }
          })
          if (products.length !== items.length) throw new Error('PRODUCT_NOT_FOUND')

          // 3) calcular total + debitar estoque + montar itens
          let total = 0
          const orderItemsData: { productId: string; quantity: number; price: number }[] = []

          for (const item of items) {
            const product = products.find((p) => p.id === item.productId)!

            if (product.stock < item.quantity) {
              throw new Error(`INSUFFICIENT_STOCK:${product.name}`)
            }

            // debitar estoque (transacional)
            await tx.product.update({
              where: { id: product.id },
              data: {
                stock: { decrement: item.quantity }
              }
            })

            total += product.price * item.quantity

            orderItemsData.push({
              productId: product.id,
              quantity: item.quantity,
              price: product.price
            })
          }

          // 4) criar order + items
          const createdOrder = await tx.order.create({
            data: {
              tenantId,
              clientId,
              total,
              createdBy: userId,
              items: { create: orderItemsData }
            },
            include: { items: true }
          })

          return createdOrder
        })

        return reply.status(201).send(order)
      } catch (err: any) {
        const msg = String(err?.message ?? '')

        if (msg === 'CLIENT_NOT_FOUND') {
          return reply.status(400).send({ message: 'Cliente não encontrado para este tenant' })
        }
        if (msg === 'PRODUCT_NOT_FOUND') {
          return reply.status(400).send({ message: 'Um ou mais produtos são inválidos para este tenant' })
        }
        if (msg.startsWith('INSUFFICIENT_STOCK:')) {
          return reply.status(400).send({ message: `Estoque insuficiente: ${msg.split(':')[1]}` })
        }

        request.log.error(err)
        return reply.status(500).send({ message: 'Internal Server Error' })
      }
    }
  )

  /**
   * ✅ GET /orders
   * Lista pedidos do tenant com detalhes
   * Roles: ADMIN, MANAGER, SALES
   */
  app.get(
    '/',
    {
      preHandler: [authMiddleware, authorize(['ADMIN', 'MANAGER', 'SALES'])]
    },
    async (request: any, reply: FastifyReply) => {
      const { tenantId } = request.user

      const orders = await prisma.order.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        include: {
          client: {
            select: { id: true, name: true, email: true, phone: true }
          },
          items: {
            include: {
              product: {
                select: { id: true, name: true }
              }
            }
          }
        }
      })

      return reply.send(orders)
    }
  )

  /**
   * ✅ PATCH /orders/:id/complete
   * Marca pedido como COMPLETED
   * Roles: ADMIN, MANAGER
   */
  app.patch(
    '/:id/complete',
    {
      preHandler: [authMiddleware, authorize(['ADMIN', 'MANAGER'])]
    },
    async (request: any, reply: FastifyReply) => {
      const { tenantId } = request.user
      const { id } = request.params as { id: string }

      const order = await prisma.order.findFirst({
        where: { id, tenantId }
      })

      if (!order) return reply.status(404).send({ message: 'Order not found' })
      if (order.status === 'CANCELLED') return reply.status(400).send({ message: 'Order já está CANCELLED' })
      if (order.status === 'COMPLETED') return reply.status(400).send({ message: 'Order já está COMPLETED' })

      const updated = await prisma.order.update({
        where: { id },
        data: { status: 'COMPLETED' }
      })

      return reply.send(updated)
    }
  )

  /**
   * ✅ PATCH /orders/:id/cancel
   * Cancela pedido e DEVOLVE estoque (transação)
   * Roles: ADMIN, MANAGER
   */
  app.patch(
    '/:id/cancel',
    {
      preHandler: [authMiddleware, authorize(['ADMIN', 'MANAGER'])]
    },
    async (request: any, reply: FastifyReply) => {
      const { tenantId } = request.user
      const { id } = request.params as { id: string }

      try {
        const cancelled = await prisma.$transaction(async (tx) => {
          const order = await tx.order.findFirst({
            where: { id, tenantId },
            include: { items: true }
          })

          if (!order) throw new Error('ORDER_NOT_FOUND')
          if (order.status === 'CANCELLED') throw new Error('ALREADY_CANCELLED')
          if (order.status === 'COMPLETED') throw new Error('ALREADY_COMPLETED')

          // devolver estoque
          for (const item of order.items) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { increment: item.quantity } }
            })
          }

          // cancelar order
          const updated = await tx.order.update({
            where: { id },
            data: { status: 'CANCELLED' }
          })

          return updated
        })

        return reply.send(cancelled)
      } catch (err: any) {
        const msg = String(err?.message ?? '')

        if (msg === 'ORDER_NOT_FOUND') return reply.status(404).send({ message: 'Order not found' })
        if (msg === 'ALREADY_CANCELLED') return reply.status(400).send({ message: 'Order já está CANCELLED' })
        if (msg === 'ALREADY_COMPLETED') return reply.status(400).send({ message: 'Order já está COMPLETED' })

        request.log.error(err)
        return reply.status(500).send({ message: 'Internal Server Error' })
      }
    }
  )
}
