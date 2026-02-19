import { FastifyInstance, FastifyReply } from 'fastify'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middlewares/auth.middleware'

type ChatBody = { message: string }

function normalize(text: string) {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

function moneyBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function includesAny(text: string, keys: string[]) {
  return keys.some((k) => text.includes(k))
}

/**
 * Extrai limite de estoque a partir de frases tipo:
 * "estoque baixo menor que 10", "<= 8", "até 5", "menos de 12"
 */
function extractStockLimit(q: string): number | null {
  // padrões com operador
  const m1 = q.match(/(<=|=<|menor\s+que|menos\s+de|ate|até)\s*(\d{1,3})/)
  if (m1?.[2]) return Number(m1[2])

  // padrão: "estoque baixo 10"
  const m2 = q.match(/estoque\s+baixo\s+(\d{1,3})/)
  if (m2?.[1]) return Number(m2[1])

  return null
}

/**
 * Detecta status de pedido na mensagem
 */
function extractOrderStatus(q: string): 'PENDING' | 'COMPLETED' | 'CANCELLED' | null {
  if (includesAny(q, ['pendente', 'pendentes', 'em aberto', 'nao finalizado', 'não finalizado'])) return 'PENDING'
  if (includesAny(q, ['completo', 'completos', 'concluido', 'concluidos', 'concluído', 'concluídos', 'entregue', 'entregues'])) return 'COMPLETED'
  if (includesAny(q, ['cancelado', 'cancelados', 'cancelada', 'canceladas'])) return 'CANCELLED'
  return null
}

/**
 * Tenta extrair um "nome" após palavras-chave:
 * "cliente fernanda", "produto camiseta", "pedido joao"
 */
function extractNameAfter(q: string, keyword: string): string | null {
  const m = q.match(new RegExp(`${keyword}\\s+([\\p{L}\\d\\s\\-_.]{2,})`, 'iu'))
  if (!m?.[1]) return null

  // corta caso a frase continue com "com", "do", "da", etc
  const raw = m[1]
  const stopWords = [' com ', ' do ', ' da ', ' de ', ' no ', ' na ', ' dos ', ' das ', ' e ']
  let cut = raw.length
  for (const sw of stopWords) {
    const idx = raw.indexOf(sw)
    if (idx !== -1) cut = Math.min(cut, idx)
  }
  return raw.slice(0, cut).trim()
}

export async function aiRoutes(app: FastifyInstance) {
  app.post(
    '/chat',
    { preHandler: [authMiddleware] },
    async (request: any, reply: FastifyReply) => {
      const { message } = request.body as ChatBody
      const q = normalize(message)

      if (!message || message.trim().length < 2) {
        return reply.status(400).send({ answer: 'Escreva uma mensagem com mais detalhes 🙂' })
      }

      // ✅ Somente ADMIN (como você pediu)
      if (request.user?.role !== 'ADMIN') {
        return reply.status(403).send({
          answer: 'A IA do SmartBiz está disponível apenas para usuários ADMIN.'
        })
      }

      const tenantId = request.user.tenantId

      // intenções
      const wantsClients = includesAny(q, ['cliente', 'clientes', 'nome do cliente', 'cadastro de cliente'])
      const wantsProducts = includesAny(q, ['produto', 'produtos', 'catalogo', 'catálogo'])
      const wantsStock = includesAny(q, ['estoque', 'estoque baixo', 'baixo estoque', 'faltando', 'acabando', 'sem estoque'])
      const wantsOrders = includesAny(q, ['pedido', 'pedidos', 'venda', 'vendas', 'order', 'orders'])
      const wantsKpis = includesAny(q, ['kpi', 'dashboard', 'resumo', 'visao geral', 'visão geral', 'numeros', 'números', 'indicadores', 'desempenho', 'receita', 'faturamento', 'lucro'])

      const wantsList = includesAny(q, ['quais', 'liste', 'listar', 'mostre', 'mostrar', 'me traga', 'me mostre'])
      const statusFilter = extractOrderStatus(q)

      // limites
      const DEFAULT_LOW_STOCK = 5
      const stockLimit = extractStockLimit(q) ?? DEFAULT_LOW_STOCK
      const LIST_LIMIT = 15

      // busca por nome
      const clientName = extractNameAfter(q, 'cliente')
      const productName = extractNameAfter(q, 'produto')

      // Se não tiver intenção clara, ajuda
      const hasIntent = wantsClients || wantsProducts || wantsStock || wantsOrders || wantsKpis || clientName || productName
      if (!hasIntent) {
        return reply.send({
          answer:
            `Posso responder usando dados do seu tenant.\n\n` +
            `Exemplos:\n` +
            `• "Resumo do dashboard"\n` +
            `• "Produtos com estoque baixo menor que 10"\n` +
            `• "Pedidos pendentes"\n` +
            `• "Cliente Carla"\n` +
            `• "Produto Camiseta"\n`
        })
      }

      const parts: string[] = []

      // ✅ KPIs
      if (wantsKpis) {
        const [clientsCount, productsCount, lowStockCount, ordersTotal, ordersCompleted, ordersCancelled, ordersPending] =
          await Promise.all([
            prisma.client.count({ where: { tenantId } }),
            prisma.product.count({ where: { tenantId } }),
            prisma.product.count({ where: { tenantId, stock: { lte: stockLimit } } }),
            prisma.order.count({ where: { tenantId } }),
            prisma.order.count({ where: { tenantId, status: 'COMPLETED' } }),
            prisma.order.count({ where: { tenantId, status: 'CANCELLED' } }),
            prisma.order.count({ where: { tenantId, status: 'PENDING' } }),
          ])

        const revenueAgg = await prisma.order.aggregate({
          where: { tenantId, status: 'COMPLETED' },
          _sum: { total: true }
        })
        const revenue = revenueAgg._sum.total ?? 0

        parts.push(
          `📊 **Resumo**`,
          `• Clientes: **${clientsCount}**`,
          `• Produtos: **${productsCount}**`,
          `• Estoque baixo (≤ ${stockLimit}): **${lowStockCount}**`,
          `• Pedidos: **${ordersTotal}** (🕒 ${ordersPending} pendentes | ✅ ${ordersCompleted} completos | ❌ ${ordersCancelled} cancelados)`,
          `• Receita : **${moneyBRL(revenue)}**`
        )
      }

      // ✅ Cliente por nome (prioridade se o usuário pediu "cliente X")
      if (clientName) {
        const clients = await prisma.client.findMany({
          where: { tenantId, name: { contains: clientName, mode: 'insensitive' } },
          orderBy: { createdAt: 'desc' },
          take: LIST_LIMIT,
          select: { id: true, name: true, email: true, phone: true }
        })

        if (clients.length === 0) {
          parts.push(`👥 Não encontrei cliente com nome parecido com **"${clientName}"**.`)
        } else {
          const lines = clients.map(c => {
            const email = c.email ? ` • ${c.email}` : ''
            const phone = c.phone ? ` • ${c.phone}` : ''
            return `- ${c.name}${email}${phone}`
          })
          parts.push(`👥 **Clientes encontrados (${clients.length})**:\n${lines.join('\n')}`)
        }
      } else if (wantsClients) {
        const count = await prisma.client.count({ where: { tenantId } })
        parts.push(`👥 Clientes cadastrados: **${count}**`)

        if (wantsList) {
          const clients = await prisma.client.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
            take: LIST_LIMIT,
            select: { name: true, email: true, phone: true }
          })

          if (clients.length === 0) parts.push(`Nenhum cliente cadastrado ainda.`)
          else {
            const lines = clients.map(c => {
              const email = c.email ? ` • ${c.email}` : ''
              const phone = c.phone ? ` • ${c.phone}` : ''
              return `- ${c.name}${email}${phone}`
            })
            parts.push(`**Últimos clientes:**\n${lines.join('\n')}`)
          }
        }
      }

      // ✅ Produto por nome (prioridade se o usuário pediu "produto X")
      if (productName) {
        const products = await prisma.product.findMany({
          where: { tenantId, name: { contains: productName, mode: 'insensitive' } },
          orderBy: { createdAt: 'desc' },
          take: LIST_LIMIT,
          select: { id: true, name: true, stock: true, price: true }
        })

        if (products.length === 0) {
          parts.push(`📦 Não encontrei produto com nome parecido com **"${productName}"**.`)
        } else {
          const lines = products.map(p => `- ${p.name} • estoque: ${p.stock} • preço: ${moneyBRL(p.price)}`)
          parts.push(`📦 **Produtos encontrados (${products.length})**:\n${lines.join('\n')}`)
        }
      } else if (wantsProducts || wantsStock) {
        if (wantsStock) {
          const low = await prisma.product.findMany({
            where: { tenantId, stock: { lte: stockLimit } },
            orderBy: [{ stock: 'asc' }, { name: 'asc' }],
            take: LIST_LIMIT,
            select: { name: true, stock: true, price: true }
          })

          if (low.length === 0) parts.push(`✅ Nenhum produto com estoque baixo (≤ ${stockLimit}).`)
          else {
            const lines = low.map(p => `- ${p.name} • estoque: ${p.stock} • preço: ${moneyBRL(p.price)}`)
            parts.push(`⚠️ **Estoque baixo (≤ ${stockLimit}):**\n${lines.join('\n')}`)
          }
        } else if (wantsProducts && wantsList) {
          const products = await prisma.product.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
            take: LIST_LIMIT,
            select: { name: true, stock: true, price: true }
          })

          if (products.length === 0) parts.push(`Nenhum produto cadastrado ainda.`)
          else {
            const lines = products.map(p => `- ${p.name} • estoque: ${p.stock} • preço: ${moneyBRL(p.price)}`)
            parts.push(`📦 **Últimos produtos:**\n${lines.join('\n')}`)
          }
        }
      }

      // ✅ Pedidos com filtro de status (pendente/completo/cancelado)
      if (wantsOrders) {
        const where: any = { tenantId }
        if (statusFilter) where.status = statusFilter

        const [total, completed, cancelled, pending] = await Promise.all([
          prisma.order.count({ where: { tenantId } }),
          prisma.order.count({ where: { tenantId, status: 'COMPLETED' } }),
          prisma.order.count({ where: { tenantId, status: 'CANCELLED' } }),
          prisma.order.count({ where: { tenantId, status: 'PENDING' } }),
        ])

        parts.push(
          `🧾 Pedidos: **${total}** (🕒 ${pending} pendentes | ✅ ${completed} completos | ❌ ${cancelled} cancelados)` +
            (statusFilter ? `\n\n🔎 Filtro aplicado: **${statusFilter}**` : '')
        )

        if (wantsList || statusFilter) {
          const orders = await prisma.order.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: { client: { select: { name: true, email: true } } }
          })

          if (orders.length === 0) {
            parts.push(`Nenhum pedido encontrado com esse filtro.`)
          } else {
            const lines = orders.map(o => {
              const c = o.client?.name ?? 'Cliente'
              const e = o.client?.email ? ` (${o.client.email})` : ''
              return `- ${c}${e} • ${o.status} • total: ${moneyBRL(o.total)}`
            })
            parts.push(`**Últimos pedidos:**\n${lines.join('\n')}`)
          }
        }
      }

      return reply.send({ answer: parts.join('\n\n') })
    }
  )
}
