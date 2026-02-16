import { FastifyInstance, FastifyReply } from 'fastify'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middlewares/auth.middleware'
import { authorize } from '../middlewares/authorize'
import bcrypt from 'bcrypt'

export async function userRoutes(app: FastifyInstance) {
  // 🔒 Listar usuários do tenant (ADMIN apenas)
  app.get(
    '/',
    {
      preHandler: [authMiddleware, authorize(['ADMIN'])]
    },
    async (request: any, reply: FastifyReply) => {
      const users = await prisma.user.findMany({
        where: {
          tenantId: request.user.tenantId
        },
        select: {
          id: true,
          name: true,
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
    {
      preHandler: [authMiddleware, authorize(['ADMIN'])]
    },
    async (request: any, reply: FastifyReply) => {
      const { name, email, password, role } = request.body as {
        name: string
        email: string
        password: string
        role: 'ADMIN' | 'MANAGER' | 'SALES' | 'USER'
      }

      // Evita duplicar e-mail dentro do sistema (global, já que email é unique)
      const existingUser = await prisma.user.findUnique({
        where: { email }
      })

      if (existingUser) {
        return reply.status(400).send({ message: 'User already exists' })
      }

      const hashedPassword = await bcrypt.hash(password, 10)

      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role,
          tenantId: request.user.tenantId
        }
      })

      return reply.status(201).send({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      })
    }
  )
}
