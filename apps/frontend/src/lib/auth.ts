import { api, setToken, clearToken } from './api'

export type LoginPayload = {
  email: string
  password: string
}

export type RegisterPayload = {
  companyName: string
  name: string
  email: string
  password: string
}

export type AuthMe = {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'MANAGER' | 'SALES' | 'USER'
  tenantId: string
}

// 🔐 LOGIN
export async function login(payload: LoginPayload) {
  const data = await api<{ token: string }>('/auth/login', {
    method: 'POST',
    auth: false,
    body: JSON.stringify(payload),
  })

  setToken(data.token)
  return data.token
}

// 🏢 REGISTER
export async function register(payload: RegisterPayload) {
  const data = await api<{ token: string }>('/auth/register', {
    method: 'POST',
    auth: false,
    body: JSON.stringify(payload),
  })

  setToken(data.token)
  return data.token
}

// 👤 ME (usuário logado)
export async function me() {
  return api<AuthMe>('/auth/me')
}

// 🚪 LOGOUT
export function logout() {
  clearToken()
}
