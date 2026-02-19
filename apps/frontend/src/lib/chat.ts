import { api } from './api'

export async function chat(message: string) {
  return api<{ answer: string }>('/ai/chat', {
    method: 'POST',
    auth: true,
    body: JSON.stringify({ message })
  })
}
