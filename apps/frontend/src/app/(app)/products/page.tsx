"use client"

import { useEffect, useMemo, useState } from "react"
import { listProducts, createProduct, Product } from "@/lib/products"
import { useAuth } from "@/hooks/use-auth"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export default function ProductsPage() {
  const { user } = useAuth()
  const canCreate = user?.role === "ADMIN" || user?.role === "MANAGER"

  const [items, setItems] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const [name, setName] = useState("")
  const [price, setPrice] = useState("")
  const [stock, setStock] = useState("")

  const load = async () => {
    setLoading(true)
    try {
      const data = await listProducts()
      setItems(data)
    } finally {
      setLoading(false)
    }
  }

  const refresh = async () => {
    setRefreshing(true)
    try {
      const data = await listProducts()
      setItems(data)
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const resetForm = () => {
    setName("")
    setPrice("")
    setStock("")
  }

  const onCreate = async () => {
    const p = Number(price.replace(",", "."))
    const s = Number(stock)

    if (!name.trim()) return alert("Nome é obrigatório")
    if (!Number.isFinite(p) || p <= 0) return alert("Preço inválido")
    if (!Number.isInteger(s) || s < 0) return alert("Estoque inválido")

    setSaving(true)
    try {
      await createProduct({ name: name.trim(), price: p, stock: s })
      resetForm()
      setOpen(false)
      await refresh()
    } finally {
      setSaving(false)
    }
  }

  const lowStockCount = useMemo(() => items.filter((p) => p.stock <= 5).length, [items])
  const canSubmit = canCreate && !!name.trim() && !!price.trim() && !!stock.trim() && !saving

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Produtos</h1>
          <p className="text-sm text-muted-foreground">
            Estoque baixo: <b>{lowStockCount}</b>
          </p>
        </div>

        {/* Actions padronizadas */}
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={refresh} disabled={loading || refreshing}>
            {refreshing ? "Atualizando..." : "Atualizar"}
          </Button>

          <Dialog
            open={open}
            onOpenChange={(v) => {
              setOpen(v)
              if (!v) resetForm()
            }}
          >
            <DialogTrigger asChild>
              <Button disabled={!canCreate} title={!canCreate ? "Sem permissão" : ""}>
                Novo produto
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>Criar produto</DialogTitle>
                <DialogDescription>Cadastre um novo produto no tenant atual.</DialogDescription>
              </DialogHeader>

              <form
                className="space-y-5"
                onSubmit={(e) => {
                  e.preventDefault()
                  if (canSubmit) onCreate()
                }}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="product-name">Nome *</Label>
                    <Input
                      id="product-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: Camiseta Branca"
                      autoFocus
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="product-price">Preço *</Label>
                    <Input
                      id="product-price"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="79.90"
                      inputMode="decimal"
                    />
                    <p className="text-xs text-muted-foreground">Use ponto ou vírgula (ex: 79.90).</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="product-stock">Estoque *</Label>
                    <Input
                      id="product-stock"
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      placeholder="50"
                      inputMode="numeric"
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={saving}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={!canSubmit}>
                    {saving ? "Salvando..." : "Salvar"}
                  </Button>
                </DialogFooter>
              </form>
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
                      {p.stock <= 5 ? (
                        <Badge variant="destructive">Baixo</Badge>
                      ) : (
                        <Badge variant="secondary">OK</Badge>
                      )}
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