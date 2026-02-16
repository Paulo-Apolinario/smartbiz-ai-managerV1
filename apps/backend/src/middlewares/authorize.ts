import { FastifyReply, FastifyRequest } from 'fastify'

export function authorize(allowedRoles: string[]) {
  return async function (
    request: FastifyRequest,
    reply: FastifyReply
  ) {

    const user = request.user as {
      userId: string
      tenantId: string
      role: string
    }

    if (!allowedRoles.includes(user.role)) {
      return reply.status(403).send({
        message: 'Forbidden'
      })
    }
  }
}
