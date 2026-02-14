import Fastify from 'fastify'

const app = Fastify({
  logger: true
})

app.get('/', async () => {
  return { message: 'SmartBiz AI Backend Running 🚀' }
})

const start = async () => {
  try {
    await app.listen({ port: 3333 })
    console.log('Server running at http://localhost:3333')
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
