import { FastifyInstance, FastifyReply } from 'fastify'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middlewares/auth.middleware'
import { authorize } from '../middlewares/authorize'

export async function clientRoutes(app: FastifyInstance) {

  // 🔒 Listar clientes do tenant
  app.get(
    '/',
    {
      preHandler: [authMiddleware]
    },
    async (request: any, reply: FastifyReply) => {
      const clients = await prisma.client.findMany({
        where: {
          tenantId: request.user.tenantId
        }
      })

      return reply.send(clients)
    }
  )

  // 🔒 Criar cliente (ADMIN, MANAGER, SALES)
  app.post(
    '/',
    {
      preHandler: [authMiddleware, authorize(['ADMIN', 'MANAGER', 'SALES'])]
    },
    async (request: any, reply: FastifyReply) => {

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
