const API_URL = process.env.NEXT_PUBLIC_API_URL

if (!API_URL) {
  throw new Error('NEXT_PUBLIC_API_URL não definido em .env.local')
}

const AUTH_EVENT = 'sb:auth'

export function getToken() {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem('sb_token')
  } catch {
    return null
  }
}

export function setToken(token: string) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem('sb_token', token)
    // avisa a UI que autenticação mudou (vamos usar no useAuth)
    window.dispatchEvent(new Event(AUTH_EVENT))
  } catch {
    // não quebra o app se localStorage falhar
  }
}

export function clearToken() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem('sb_token')
    window.dispatchEvent(new Event(AUTH_EVENT))
  } catch {
    // ignore
  }
}

type RequestOptions = RequestInit & {
  auth?: boolean
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = `${API_URL}${path}`
  const headers = new Headers(options.headers)

  // default JSON
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json')
  }

  // JWT
  if (options.auth !== false) {
    const token = getToken()
    if (token) headers.set('Authorization', `Bearer ${token}`)
  }

  const res = await fetch(url, {
    ...options,
    headers
  })

  if (!res.ok) {
    let message = `Erro HTTP ${res.status}`

    try {
      const data = await res.json()
      message = data?.message ?? message
    } catch {}

    // se expirar token ou não autorizado
    if (res.status === 401) {
      clearToken()
    }

    throw new Error(message)
  }

  if (res.status === 204) return null as T
  return res.json() as Promise<T>
}
