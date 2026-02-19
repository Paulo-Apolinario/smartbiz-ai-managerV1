import Fastify from 'fastify'
import fastifyJwt from '@fastify/jwt'
import { ordersRoutes } from "./routes/orders"
import { authRoutes } from './routes/auth'
import { clientRoutes } from './routes/clients'
import { productRoutes } from './routes/products'
import { userRoutes } from './routes/users'
import { dashboardRoutes } from './routes/dashboard'
import cors from '@fastify/cors'
import { aiRoutes } from './routes/ai'



export const app = Fastify({
  logger: true
})

app.register(cors, {
  origin: ['http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
})

app.register(fastifyJwt, {
  secret: 'supersecretkey'
})

// Rotas organizadas
app.register(authRoutes, { prefix: '/auth' })
app.register(clientRoutes, { prefix: '/clients' })
app.register(productRoutes, { prefix: '/products' })
app.register(userRoutes, { prefix: '/users' })
app.register(ordersRoutes, { prefix: '/orders' })
app.register(dashboardRoutes, { prefix: '/dashboard' })
app.register(aiRoutes, { prefix: '/ai' })

// Health check
app.get('/', async () => {
  return { message: 'SmartBiz AI Backend Running 🚀' }
})
