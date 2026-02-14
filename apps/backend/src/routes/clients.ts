import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middlewares/auth.middleware'

export async function clientRoutes(app: FastifyInstance) {

  // 🔒 Listar clientes do tenant
  app.get(
    '/',
    { preHandler: [authMiddleware] },
    async (request: any, reply: FastifyReply) => {

      const clients = await prisma.client.findMany({
        where: {
          tenantId: request.user.tenantId
        }
      })

      return reply.send(clients)
    }
  )

  // 🔒 Criar cliente (ADMIN apenas)
  app.post(
    '/',
    { preHandler: [authMiddleware] },
    async (request: any, reply: FastifyReply) => {

      if (request.user.role !== 'ADMIN') {
        return reply.status(403).send({ message: 'Forbidden' })
      }

      const { name, email, phone } = request.body as {
        name: string
        email?: string
        phone?: string
      }

      const client = await prisma.client.create({
        data: {
          name,
          email,
          phone,
          tenantId: request.user.tenantId
        }
      })

      return reply.status(201).send(client)
    }
  )
}
