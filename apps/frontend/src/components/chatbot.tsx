'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Bot, Send, X, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/use-auth'
import { chat } from '@/lib/chat'

type ChatMsg = {
  id: string
  role: 'assistant' | 'user'
  content: string
  createdAt: number
}

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16)
}

export function Chatbot() {
  const { user } = useAuth()
  const enabled = Boolean(user && user.role === 'ADMIN')

  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)

  const [messages, setMessages] = useState<ChatMsg[]>(() => [
    {
      id: uid(),
      role: 'assistant',
      content:
        'Olá! Eu sou o assistente do SmartBiz. Posso te ajudar com pedidos, clientes, produtos e dúvidas do sistema.',
      createdAt: Date.now()
    }
  ])

  const listRef = useRef<HTMLDivElement | null>(null)

  // scroll para última mensagem
  useEffect(() => {
    if (!open) return
    const el = listRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [open, messages.length])

  // ESC fecha
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const headerSubtitle = useMemo(() => {
    if (!user) return 'Não autenticado'
    return `${user.name} • ${user.role}`
  }, [user])

  async function onSend() {
    if (!enabled) return

    const text = input.trim()
    if (!text || sending) return

    setInput('')
    setSending(true)

    const userMsg: ChatMsg = {
      id: uid(),
      role: 'user',
      content: text,
      createdAt: Date.now()
    }
    setMessages((prev) => [...prev, userMsg])

    try {
      // ✅ tenta usar o backend (quando /ai/chat existir, já funciona)
      const res = await chat(text)

      const assistantMsg: ChatMsg = {
        id: uid(),
        role: 'assistant',
        content: res.answer,
        createdAt: Date.now()
      }
      setMessages((prev) => [...prev, assistantMsg])
    } catch (err: unknown) {
      void err
      // ✅ fallback: mock (não quebra sua UI enquanto você finaliza o backend)
      const assistantMsg: ChatMsg = {
        id: uid(),
        role: 'assistant',
        content:
          `Entendi ✅\n\nVocê perguntou: “${text}”\n\n` +
          `Ainda não consegui consultar a IA no backend (rota /ai/chat). ` +
          `Mas quando ativarmos essa rota, eu vou responder com dados reais do seu tenant (clientes, produtos, pedidos e KPIs) via RAG.`,
        createdAt: Date.now()
      }
      setMessages((prev) => [...prev, assistantMsg])
    } finally {
      setSending(false)
    }
  }

  if (!enabled) return null

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Botão flutuante */}
      {!open && (
        <Button onClick={() => setOpen(true)} className="h-12 rounded-full shadow-lg">
          <MessageSquare className="mr-2 h-5 w-5" />
          Assistente
        </Button>
      )}

      {/* Janela do chat */}
      {open && (
        <Card className="w-95 overflow-hidden border bg-background/80 backdrop-blur shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Bot className="h-5 w-5" />
              </div>

              <div className="leading-tight">
                <CardTitle className="text-base">SmartBiz IA</CardTitle>
                <div className="text-xs text-muted-foreground">{headerSubtitle}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge className="border border-primary/25 bg-primary/10 text-primary">beta</Badge>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)} title="Fechar">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {/* Mensagens */}
            <div ref={listRef} className="h-90 space-y-3 overflow-auto px-3 py-3">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}
                >
                  <div
                    className={[
                      'max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm',
                      m.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    ].join(' ')}
                  >
                    {m.content}
                  </div>
                </div>
              ))}

              {sending && (
                <div className="flex justify-start">
                  <div className="rounded-2xl bg-muted px-3 py-2 text-sm text-muted-foreground">
                    Digitando…
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="flex items-center gap-2 border-t p-3">
              <Input
                placeholder="Pergunte algo sobre seu negócio..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onSend()
                }}
              />
              <Button
                onClick={onSend}
                disabled={sending || input.trim().length === 0}
                size="icon"
                title="Enviar"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
