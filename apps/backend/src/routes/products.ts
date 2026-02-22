import { FastifyInstance, FastifyReply } from 'fastify'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middlewares/auth.middleware'
import { authorize } from '../middlewares/authorize'

export async function productRoutes(app: FastifyInstance) {

  // 🔒 Listar produtos do tenant
  app.get(
    '/',
    {
      preHandler: [authMiddleware],
      schema: {
        description: 'Lista todos os produtos.',
        tags: ['Products'],
        security: [{ bearerAuth: [] }], // 🔑 exige token
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                price: { type: 'number' },
                stock: { type: 'number' },
                tenantId: { type: 'string' }
              }
            }
          }
        }
      }
    },
    async (request: any, reply: FastifyReply) => {
      const products = await prisma.product.findMany({
        where: {
          tenantId: request.user.tenantId
        }
      })

      return reply.send(products)
    }
  )

  // 🔒 Criar produto (ADMIN e MANAGER)
  app.post(
    '/',
    {
      preHandler: [authMiddleware, authorize(['ADMIN', 'MANAGER'])],
      schema: {
        description: 'Cria um novo produto (ADMIN e MANAGER)',
        tags: ['Products'],
        security: [{ bearerAuth: [] }], // 🔑 exige token
        body: {
          type: 'object',
          required: ['name', 'price', 'stock'],
          properties: {
            name: { type: 'string' },
            price: { type: 'number' },
            stock: { type: 'number' }
          }
        },
        response: {
          201: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              price: { type: 'number' },
              stock: { type: 'number' },
              tenantId: { type: 'string' }
            }
          }
        }
      }
    },
    async (request: any, reply: FastifyReply) => {
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
