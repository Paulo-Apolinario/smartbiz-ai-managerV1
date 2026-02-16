import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { prisma } from '../lib/prisma'
import bcrypt from 'bcrypt'

export async function authRoutes(app: FastifyInstance) {

  // ✅ REGISTER (cria tenant + admin)
  app.post(
    '/register',
    async (
      request: FastifyRequest<{
        Body: {
          companyName: string
          name: string
          email: string
          password: string
        }
      }>,
      reply: FastifyReply
    ) => {
      const { companyName, name, email, password } = request.body

      const existingUser = await prisma.user.findUnique({
        where: { email }
      })

      if (existingUser) {
        return reply.status(400).send({ message: 'User already exists' })
      }

      const tenant = await prisma.tenant.create({
        data: { name: companyName }
      })

      const hashedPassword = await bcrypt.hash(password, 10)

      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: 'ADMIN',
          tenantId: tenant.id
        }
      })

      const token = app.jwt.sign({
        userId: user.id,
        tenantId: user.tenantId,
        role: user.role
      })

      return reply.status(201).send({ token })
    }
  )

  // ✅ LOGIN (gera token para usuários já existentes)
  app.post(
    '/login',
    async (
      request: FastifyRequest<{
        Body: {
          email: string
          password: string
        }
      }>,
      reply: FastifyReply
    ) => {
      const { email, password } = request.body

      const user = await prisma.user.findUnique({
        where: { email }
      })

      if (!user) {
        return reply.status(400).send({ message: 'Invalid credentials' })
      }

      const ok = await bcrypt.compare(password, user.password)
      if (!ok) {
        return reply.status(400).send({ message: 'Invalid credentials' })
      }

      const token = app.jwt.sign({
        userId: user.id,
        tenantId: user.tenantId,
        role: user.role
      })

      return reply.send({ token })
    }
  )
}
