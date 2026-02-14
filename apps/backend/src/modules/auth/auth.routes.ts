import { FastifyInstance } from 'fastify'
import { registerUser, loginUser } from './auth.service'

export async function authRoutes(app: FastifyInstance) {

  app.post('/register', async (request, reply) => {
    const { name, email, password } = request.body as any

    const user = await registerUser(name, email, password)

    const token = app.jwt.sign({
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role
    })

    return { token }
  })

  app.post('/login', async (request, reply) => {
    const { email, password } = request.body as any

    const user = await loginUser(email, password)

    const token = app.jwt.sign({
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role
    })

    return { token }
  })

}
