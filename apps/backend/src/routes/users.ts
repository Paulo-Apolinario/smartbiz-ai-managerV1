import { FastifyInstance, FastifyReply } from 'fastify'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middlewares/auth.middleware'
import bcrypt from 'bcrypt'

export async function userRoutes(app: FastifyInstance) {

  // 🔒 Listar usuários do tenant (ADMIN apenas)
  app.get(
    '/',
    { preHandler: [authMiddleware] },
    async (request: any, reply: FastifyReply) => {

      if (request.user.role !== 'ADMIN') {
        return reply.status(403).send({ message: 'Forbidden' })
      }

      const users = await prisma.user.findMany({
        where: {
          tenantId: request.user.tenantId
        },
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true
        }
      })

      return reply.send(users)
    }
  )

  // 🔒 Criar usuário interno (ADMIN apenas)
  app.post(
    '/',
    { preHandler: [authMiddleware] },
    async (request: any, reply: FastifyReply) => {

      if (request.user.role !== 'ADMIN') {
        return reply.status(403).send({ message: 'Forbidden' })
      }

      const { email, password, role } = request.body as {
        email: string
        password: string
        role: 'ADMIN' | 'MANAGER' | 'SALES' | 'USER'
      }

      const hashedPassword = await bcrypt.hash(password, 10)

      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          role,
          tenantId: request.user.tenantId
        }
      })

      return reply.status(201).send({
        id: user.id,
        email: user.email,
        role: user.role
      })
    }
  )
}
