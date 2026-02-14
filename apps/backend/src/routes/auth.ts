import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { prisma } from '../lib/prisma'
import bcrypt from 'bcrypt'

export async function authRoutes(app: FastifyInstance) {

  app.post('/register', async (
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
    return reply.status(400).send({
      message: 'User already exists'
    })
  }

  // Criar empresa (tenant)
  const tenant = await prisma.tenant.create({
    data: {
      name: companyName
    }
  })

  const hashedPassword = await bcrypt.hash(password, 10)

  // Criar usuário ADMIN vinculado ao tenant
  const user = await prisma.user.create({
    data: {
      name, // 🔥 AGORA ENVIANDO
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
})
}
