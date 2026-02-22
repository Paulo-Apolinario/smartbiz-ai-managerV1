"use client"

import { useEffect, useMemo, useState } from "react"
import { listClients, createClient, Client } from "@/lib/clients"
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

export default function ClientsPage() {
  const { user } = useAuth()

  const canCreate = useMemo(() => {
    const role = user?.role
    return role === "ADMIN" || role === "MANAGER" || role === "SALES"
  }, [user?.role])

  const [items, setItems] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const data = await listClients()
      setItems(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const resetForm = () => {
    setName("")
    setEmail("")
    setPhone("")
  }

  const onCreate = async () => {
    if (!name.trim()) return alert("Nome é obrigatório")

    setSaving(true)
    try {
      await createClient({
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
      })

      resetForm()
      setOpen(false)
      await load()
    } finally {
      setSaving(false)
    }
  }

  const canSubmit = canCreate && !!name.trim() && !saving

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clientes</h1>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={load} disabled={loading}>
            Atualizar
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
                Novo cliente
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>Criar cliente</DialogTitle>
                <DialogDescription>Adicione um cliente ao tenant atual.</DialogDescription>
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
                    <Label htmlFor="client-name">Nome *</Label>
                    <Input
                      id="client-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: Fernanda Alves"
                      autoFocus
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="client-email">Email</Label>
                    <Input
                      id="client-email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="fernanda@email.com"
                      inputMode="email"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="client-phone">Telefone</Label>
                    <Input
                      id="client-phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="11999998888"
                      inputMode="tel"
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                    disabled={saving}
                  >
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
                  <TableHead>Email</TableHead>
                  <TableHead>Telefone</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {items.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.email ?? "—"}</TableCell>
                    <TableCell>{c.phone ?? "—"}</TableCell>
                  </TableRow>
                ))}

                {items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-sm text-muted-foreground">
                      Nenhum cliente cadastrado.
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