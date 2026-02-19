'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ShoppingBag, Users, Receipt, UserCog } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/products', label: 'Produtos', icon: ShoppingBag },
  { href: '/clients', label: 'Clientes', icon: Users },
  { href: '/orders', label: 'Vendas', icon: Receipt },
  { href: '/users', label: 'Usuários', icon: UserCog }
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex h-screen w-64 flex-col border-r bg-background">
      <div className="px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-primary/15 flex items-center justify-center">
            <span className="text-primary font-bold">SB</span>
          </div>
          <div>
            <p className="text-sm font-semibold leading-none">SmartBiz AI</p>
            <p className="text-xs text-muted-foreground">Painel administrativo</p>
          </div>
        </div>
      </div>

      <nav className="px-3 py-2 space-y-1">
        {navItems.map((item) => {
          const active = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto px-6 py-4">
        <div className="rounded-xl border bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground">Status</p>
          <p className="text-sm font-medium">Backend online ✅</p>
        </div>
      </div>
    </aside>
  )
}
