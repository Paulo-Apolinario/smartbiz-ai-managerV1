import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middlewares/auth.middleware'

export async function productRoutes(app: FastifyInstance) {

  // 🔒 Listar produtos do tenant
  app.get(
    '/',
    { preHandler: [authMiddleware] },
    async (request: any, reply: FastifyReply) => {

      const products = await prisma.product.findMany({
        where: {
          tenantId: request.user.tenantId
        }
      })

      return reply.send(products)
    }
  )

  // 🔒 Criar produto (ADMIN apenas)
  app.post(
    '/',
    { preHandler: [authMiddleware] },
    async (request: any, reply: FastifyReply) => {

      if (request.user.role !== 'ADMIN') {
        return reply.status(403).send({ message: 'Forbidden' })
      }

      const { name, price, stock } = request.body as {
        name: string
        price: number
        stock: number
      }

      const product = await prisma.product.create({
        data: {
          name,
          price,
          stock,
          tenantId: request.user.tenantId
        }
      })

      return reply.status(201).send(product)
    }
  )
}
