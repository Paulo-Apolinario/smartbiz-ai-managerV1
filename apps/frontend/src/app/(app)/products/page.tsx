'use client'

import { useEffect, useMemo, useState } from 'react'
import { listProducts, createProduct, Product } from '@/lib/products'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export default function ProductsPage() {
  const { user } = useAuth()
  const canCreate = user?.role === 'ADMIN' || user?.role === 'MANAGER'

  const [items, setItems] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)

  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const data = await listProducts()
      setItems(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const onCreate = async () => {
    const p = Number(price)
    const s = Number(stock)

    if (!name.trim()) return alert('Nome é obrigatório')
    if (!Number.isFinite(p) || p <= 0) return alert('Preço inválido')
    if (!Number.isInteger(s) || s < 0) return alert('Estoque inválido')

    await createProduct({ name: name.trim(), price: p, stock: s })
    setName('')
    setPrice('')
    setStock('')
    setOpen(false)
    await load()
  }

  const lowStockCount = useMemo(() => items.filter(p => p.stock <= 5).length, [items])

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Produtos</h1>
          <p className="text-sm text-muted-foreground">
            Catálogo do tenant. Estoque baixo: <b>{lowStockCount}</b>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={load}>Atualizar</Button>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button disabled={!canCreate} title={!canCreate ? 'Sem permissão' : ''}>
                Novo produto
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar produto</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Camiseta Branca" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Preço</Label>
                    <Input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="79.90" />
                  </div>
                  <div className="space-y-2">
                    <Label>Estoque</Label>
                    <Input value={stock} onChange={(e) => setStock(e.target.value)} placeholder="50" />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                  <Button onClick={onCreate} disabled={!canCreate}>Salvar</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="text-right">Preço</TableHead>
                  <TableHead className="text-right">Estoque</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-right">R$ {Number(p.price).toFixed(2)}</TableCell>
                    <TableCell className="text-right">{p.stock}</TableCell>
                    <TableCell className="text-right">
                      {p.stock <= 5 ? <Badge variant="destructive">Baixo</Badge> : <Badge variant="secondary">OK</Badge>}
                    </TableCell>
                  </TableRow>
                ))}
                {items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-sm text-muted-foreground">
                      Nenhum produto cadastrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
