import { prisma } from '../../lib/prisma'
import bcrypt from 'bcryptjs'

export async function registerUser(name: string, email: string, password: string) {
  const userExists = await prisma.user.findUnique({
    where: { email }
  })

  if (userExists) {
    throw new Error('User already exists')
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  const tenant = await prisma.tenant.create({
    data: {
      name: `${name}'s Company`,
      users: {
        create: {
          name,
          email,
          password: hashedPassword,
          role: 'ADMIN'
        }
      }
    },
    include: {
      users: true
    }
  })

  return tenant.users[0]
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email }
  })

  if (!user) {
    throw new Error('Invalid credentials')
  }

  const passwordMatch = await bcrypt.compare(password, user.password)

  if (!passwordMatch) {
    throw new Error('Invalid credentials')
  }

  return user
}
