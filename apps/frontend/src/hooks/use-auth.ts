'use client'

import { useEffect, useState } from 'react'
import { me, logout } from '@/lib/auth'

export type AuthUser = {
  id: string
  name: string
  email: string
  role: string
  tenantId: string
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const data = await me()
      setUser(data)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const signOut = () => {
    logout()
    setUser(null)
  }

  useEffect(() => {
    load()
  }, [])

  return { user, loading, reload: load, signOut }
}
