'use client'

import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export function Topbar() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()

  // Se entrou no app e não tem user, é porque o token não existe/expirou
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login')
    }
  }, [loading, user, router])

  function handleLogout() {
    signOut()
    router.replace('/login')
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {loading ? (
          <span>Carregando...</span>
        ) : user ? (
          <>
            <span>
              Logado como <b className="text-foreground">{user.name}</b>
            </span>
            <Badge className="border border-primary/25 bg-primary/10 text-primary">
              {user.role}
            </Badge>
          </>
        ) : (
          <span>Redirecionando...</span>
        )}
      </div>

      {user && (
        <Button
          variant="outline"
          size="icon"
          title="Sair"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
        </Button>
      )}
    </header>
  )
}
