import { api } from './api'

export type User = {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'MANAGER' | 'SALES' | 'USER'
  tenantId?: string
  createdAt?: string
}

export type CreateUserInput = {
  name: string
  email: string
  password: string
  role: 'ADMIN' | 'MANAGER' | 'SALES' | 'USER'
}

export async function listUsers() {
  return api<User[]>('/users')
}

export async function createUser(input: CreateUserInput) {
  return api<User>('/users', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}
