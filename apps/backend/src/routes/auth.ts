import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import bcrypt from 'bcrypt'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middlewares/auth.middleware'

export async function authRoutes(app: FastifyInstance) {
  // ✅ REGISTER (cria tenant + admin)
  app.post(
    '/register',
    {
      // ✅ ADICIONADO: schema Swagger/OpenAPI
      schema: {
        tags: ['Auth'],
        summary: 'Registrar tenant + usuário ADMIN',
        description: 'Cria um tenant e um usuário ADMIN e retorna um JWT.',
        body: {
          type: 'object',
          required: ['companyName', 'name', 'email', 'password'],
          additionalProperties: false,
          properties: {
            companyName: { type: 'string', minLength: 2, examples: ['Minha Empresa LTDA'] },
            name: { type: 'string', minLength: 2, examples: ['Paulo Roberto'] },
            email: { type: 'string', format: 'email', examples: ['paulo@email.com'] },
            password: { type: 'string', minLength: 6, examples: ['123456'] },
          },
        },
        response: {
          201: {
            type: 'object',
            required: ['token'],
            properties: { token: { type: 'string' } },
          },
          400: {
            type: 'object',
            required: ['message'],
            properties: { message: { type: 'string' } },
          },
        },
      },
    },
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
    {
      // ✅ ADICIONADO: schema Swagger/OpenAPI
      schema: {
        tags: ['Auth'],
        summary: 'Login',
        description: 'Autentica usuário e retorna um JWT.',
        body: {
          type: 'object',
          required: ['email', 'password'],
          additionalProperties: false,
          properties: {
            email: { type: 'string', format: 'email', examples: ['paulo@email.com'] },
            password: { type: 'string', minLength: 1, examples: ['123456'] },
          },
        },
        response: {
          200: {
            type: 'object',
            required: ['token'],
            properties: { token: { type: 'string' } },
          },
          400: {
            type: 'object',
            required: ['message'],
            properties: { message: { type: 'string' } },
          },
        },
      },
    },
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

  // ✅ ME (retorna dados do usuário logado)
  app.get(
    '/me',
    {
      preHandler: [authMiddleware],
      // ✅ ADICIONADO: schema Swagger/OpenAPI
      schema: {
        tags: ['Auth'],
        summary: 'Usuário logado (me)',
        description: 'Retorna os dados do usuário autenticado via JWT.',
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: 'object',
            required: ['id', 'name', 'email', 'role', 'tenantId'],
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              email: { type: 'string', format: 'email' },
              role: { type: 'string' },
              tenantId: { type: 'string' },
            },
          },
          404: {
            type: 'object',
            required: ['message'],
            properties: { message: { type: 'string' } },
          },
        },
      },
    },
    async (request: any, reply: FastifyReply) => {
      const user = await prisma.user.findUnique({
        where: { id: request.user.userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          tenantId: true
        }
      })

      if (!user) return reply.status(404).send({ message: 'User not found' })
      return reply.send(user)
    }
  )
}