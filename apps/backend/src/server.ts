import { app } from './app'
import { prisma } from './lib/prisma'

app.get('/tenants', async () => {
  return prisma.tenant.findMany()
})

const start = async () => {
  try {
    await app.listen({ port: 3333, host: '0.0.0.0' })
    console.log('Server running at http://localhost:3333')
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
