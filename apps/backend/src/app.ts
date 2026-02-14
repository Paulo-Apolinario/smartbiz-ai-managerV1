import Fastify from 'fastify'
import { prisma } from './lib/prisma'
import fastifyJwt from '@fastify/jwt'
import { authRoutes } from './modules/auth/auth.routes'
import { authMiddleware } from './middlewares/auth.middleware'


// Rotas (por enquanto básicas)
export const app = Fastify({
  logger: true
})
app.register(fastifyJwt, {
  secret: 'supersecretkey'
})
app.register(authRoutes)


// 🔓 Pública
app.get('/', async () => {
  return { message: 'SmartBiz AI Backend Running 🚀' }
})

// 🔒 Protegidas
app.get('/tenants', { preHandler: [authMiddleware] }, async () => {
  return prisma.tenant.findMany()
})

app.get('/products', { preHandler: [authMiddleware] }, async (request: any) => {
  return prisma.product.findMany({
    where: {
      tenantId: request.user.tenantId
    }
  })
})

app.get('/clients', { preHandler: [authMiddleware] }, async (request: any) => {
  return prisma.client.findMany({
    where: {
      tenantId: request.user.tenantId
    }
  })
})

app.get('/full', { preHandler: [authMiddleware] }, async (request: any) => {
  return prisma.tenant.findMany({
    where: {
      id: request.user.tenantId
    },
    include: {
      users: true,
      clients: true,
      products: true
    }
  })
})

