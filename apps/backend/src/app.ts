import Fastify from 'fastify'
import fastifyJwt from '@fastify/jwt'
import cors from '@fastify/cors'

// Rotas
import { ordersRoutes } from "./routes/orders"
import { authRoutes } from './routes/auth'
import { clientRoutes } from './routes/clients'
import { productRoutes } from './routes/products'
import { userRoutes } from './routes/users'
import { dashboardRoutes } from './routes/dashboard'
import { aiRoutes } from './routes/ai'

// ✅ Swagger
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'

export const app = Fastify({
  logger: true
})

// Configuração do CORS
app.register(cors, {
  origin: ['http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
})

// Configuração do JWT
app.register(fastifyJwt, {
  secret: 'supersecretkey'
})

// ✅ Swagger (OpenAPI) + UI
app.register(swagger, {
  openapi: {
    info: {
      title: 'SmartBiz AI API',
      description: 'Documentação da API do SmartBiz AI (Fastify + Prisma).',
      version: '1.0.0',
    },
    servers: [
      { url: 'http://localhost:3333' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }], // 🔑 segurança global
  },
})

app.register(swaggerUi, {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'list',
    deepLinking: false
  }
})

// ✅ Rotas organizadas
// Todas as rotas que precisam de token devem declarar security no schema
app.register(authRoutes, { prefix: '/auth' }) // login/register não precisam
app.register(clientRoutes, { prefix: '/clients' })
app.register(productRoutes, { prefix: '/products' })
app.register(userRoutes, { prefix: '/users' })
app.register(ordersRoutes, { prefix: '/orders' })
app.register(dashboardRoutes, { prefix: '/dashboard' })
app.register(aiRoutes, { prefix: '/ai' })

// Health check
app.get('/', {
  schema: {
    description: 'Verifica se o backend está rodando',
    tags: ['Health'],
    security: [], // rota pública, sem token
    response: {
      200: {
        type: 'object',
        properties: {
          message: { type: 'string' }
        }
      }
    }
  }
}, async () => {
  return { message: 'SmartBiz AI Backend Running 🚀' }
})

// Inicialização do servidor
app.listen({ port: 3333 }, (err, address) => {
  if (err) {
    console.error(err)
    process.exit(1)
  }
  console.log(`Servidor rodando em ${address}`)
})
