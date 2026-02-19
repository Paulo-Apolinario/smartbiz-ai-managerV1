import { api } from './api'

export type Client = {
  id: string
  name: string
  email?: string | null
  phone?: string | null
  tenantId: string
  createdAt?: string
  updatedAt?: string
}

export type CreateClientInput = {
  name: string
  email?: string
  phone?: string
}

export async function listClients() {
  return api<Client[]>('/clients')
}

export async function createClient(input: CreateClientInput) {
  return api<Client>('/clients', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}
