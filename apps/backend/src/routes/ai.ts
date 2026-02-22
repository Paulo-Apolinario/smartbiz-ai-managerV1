import { FastifyInstance, FastifyReply } from "fastify"
import { prisma } from "../lib/prisma"
import { authMiddleware } from "../middlewares/auth.middleware"

type ChatBody = { message: string }

type OrderStatus = "PENDING" | "COMPLETED" | "CANCELLED"

function normalize(text: string) {
  return (text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

function moneyBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

/**
 * Match por "palavra" ou frase normalizada.
 * Ex: matchWord("quero listar produtos", ["produto","prod","prods"])
 */
function matchAny(q: string, keys: string[]) {
  const s = ` ${q} `
  return keys.some(
    (k) =>
      s.includes(` ${k} `) ||
      s.includes(` ${k}-`) ||
      s.includes(`${k} `) ||
      s.includes(` ${k}`)
  )
}

/**
 * Match por "contém" (para frases maiores), útil para "estoque baixo"
 */
function includesAny(q: string, keys: string[]) {
  return keys.some((k) => q.includes(k))
}

function statusLabel(s: OrderStatus) {
  switch (s) {
    case "PENDING":
      return "Pendente"
    case "COMPLETED":
      return "Concluído"
    case "CANCELLED":
      return "Cancelado"
  }
}

function extractOrderStatus(q: string): OrderStatus | null {
  const pending = [
    "pendente",
    "pendentes",
    "em aberto",
    "aberto",
    "abertos",
    "nao concluido",
    "nao finalizado",
    "nao finalizados",
    "nao fechado",
    "nao fechados",
  ]

  const completed = [
    "concluido",
    "concluidos",
    "concluida",
    "concluidas",
    "completo",
    "completos",
    "finalizado",
    "finalizados",
    "entregue",
    "entregues",
    "pago",
    "pagos",
  ]

  const cancelled = ["cancelado", "cancelados", "cancelada", "canceladas"]

  if (includesAny(q, pending)) return "PENDING"
  if (includesAny(q, completed)) return "COMPLETED"
  if (includesAny(q, cancelled)) return "CANCELLED"
  return null
}

/**
 * Extrai limite de estoque:
 * "<= 10", "até 5", "menos de 12", "estoque baixo 8"
 */
function extractStockLimit(q: string): number | null {
  const m1 = q.match(/(<=|=<|menor\s+que|menos\s+de|ate|até)\s*(\d{1,3})/)
  if (m1?.[2]) return Number(m1[2])

  const m2 = q.match(/estoque\s+baixo\s+(\d{1,3})/)
  if (m2?.[1]) return Number(m2[1])

  const m3 = q.match(/baixo\s+(\d{1,3})/)
  if (m3?.[1]) return Number(m3[1])

  return null
}

/**
 * Extrai um nome após keyword:
 * "cliente fernanda", "produto camiseta"
 */
function extractNameAfter(q: string, keyword: string): string | null {
  const m = q.match(new RegExp(`${keyword}\\s+([\\p{L}\\d\\s\\-_.]{2,})`, "iu"))
  if (!m?.[1]) return null

  const raw = m[1].trim()

  // corta se continuar com conectivos comuns
  const stopWords = [" com ", " do ", " da ", " de ", " no ", " na ", " dos ", " das ", " e "]
  let cut = raw.length
  for (const sw of stopWords) {
    const idx = raw.toLowerCase().indexOf(sw)
    if (idx !== -1) cut = Math.min(cut, idx)
  }

  return raw.slice(0, cut).trim()
}

function helpText() {
  return [
    "Posso responder usando dados do seu tenant.",
    "",
    "Exemplos de perguntas:",
    '- "Resumo do dashboard"',
    '- "Quantos clientes tenho?"',
    '- "Listar clientes"',
    '- "Produtos com estoque baixo até 10"',
    '- "Listar produtos"',
    '- "Pedidos pendentes"',
    '- "Listar pedidos cancelados"',
    '- "Cliente Carla"',
    '- "Produto Camiseta"',
  ].join("\n")
}

export async function aiRoutes(app: FastifyInstance) {
  app.post(
    "/chat",
    {
      preHandler: [authMiddleware],
      // ✅ ADICIONADO: schema Swagger/OpenAPI
      schema: {
        tags: ["AI"],
        summary: "Chat AI do tenant (ADMIN)",
        description:
          "Responde perguntas usando dados do tenant do usuário logado. Requer JWT e usuário ADMIN.",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["message"],
          additionalProperties: false,
          properties: {
            message: {
              type: "string",
              minLength: 1,
              examples: ["Pedidos pendentes", "Resumo do dashboard", "Produtos com estoque baixo até 10"],
            },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              answer: { type: "string" },
            },
            required: ["answer"],
          },
          400: {
            type: "object",
            properties: {
              answer: { type: "string" },
            },
            required: ["answer"],
          },
          403: {
            type: "object",
            properties: {
              answer: { type: "string" },
            },
            required: ["answer"],
          },
        },
      },
    },
    async (request: any, reply: FastifyReply) => {
      const body = request.body as ChatBody
      const message = body?.message ?? ""
      const q = normalize(message)

      // ✅ aceitar mensagens curtas (>= 1), e orientar melhor se vier vazia
      if (!q || q.length < 1) {
        return reply.status(400).send({ answer: "Me diga o que você quer saber. Ex: 'pedidos pendentes'." })
      }

      // ✅ Somente ADMIN (mantido)
      if (request.user?.role !== "ADMIN") {
        return reply.status(403).send({
          answer: "A IA do SmartBiz está disponível apenas para usuários ADMIN.",
        })
      }

      const tenantId = request.user.tenantId

      // ------------------------------------------------------------
      // Intenções (com abreviações)
      // ------------------------------------------------------------
      const keysClients = ["cliente", "clientes", "cli", "clis", "client", "clients"]
      const keysProducts = ["produto", "produtos", "prod", "prods", "catalogo", "catálogo", "item", "itens"]
      const keysOrders = ["pedido", "pedidos", "ped", "peds", "venda", "vendas", "order", "orders"]
      const keysStock = ["estoque", "stock", "faltando", "acabando", "sem estoque", "baixo estoque", "estoque baixo"]
      const keysKpis = ["kpi", "dashboard", "resumo", "visao geral", "visão geral", "indicadores", "desempenho", "receita", "faturamento"]

      const wantsClients = matchAny(q, keysClients) || includesAny(q, ["cliente", "clientes"])
      const wantsProducts = matchAny(q, keysProducts) || includesAny(q, ["produto", "produtos", "catalogo", "catálogo"])
      const wantsOrders = matchAny(q, keysOrders) || includesAny(q, ["pedido", "pedidos", "venda", "vendas", "order", "orders"])
      const wantsStock = matchAny(q, keysStock) || includesAny(q, ["estoque", "estoque baixo", "baixo estoque"])
      const wantsKpis = matchAny(q, keysKpis) || includesAny(q, ["dashboard", "resumo", "visao geral", "visão geral", "kpi", "receita", "faturamento"])

      const wantsList = includesAny(q, ["quais", "liste", "listar", "mostre", "mostrar", "me traga", "me mostre", "lista", "listagem"])
      const statusFilter = extractOrderStatus(q)

      // limites
      const DEFAULT_LOW_STOCK = 5
      const stockLimit = extractStockLimit(q) ?? DEFAULT_LOW_STOCK
      const LIST_LIMIT = 12

      // busca por nome
      const clientName = extractNameAfter(q, "cliente") || extractNameAfter(q, "cli")
      const productName = extractNameAfter(q, "produto") || extractNameAfter(q, "prod")

      const hasIntent =
        wantsClients || wantsProducts || wantsOrders || wantsStock || wantsKpis || Boolean(clientName) || Boolean(productName)

      if (!hasIntent) {
        return reply.send({ answer: helpText() })
      }

      const parts: string[] = []

      // ------------------------------------------------------------
      // KPIs
      // ------------------------------------------------------------
      if (wantsKpis) {
        const [
          clientsCount,
          productsCount,
          lowStockCount,
          ordersTotal,
          ordersCompleted,
          ordersCancelled,
          ordersPending,
        ] = await Promise.all([
          prisma.client.count({ where: { tenantId } }),
          prisma.product.count({ where: { tenantId } }),
          prisma.product.count({ where: { tenantId, stock: { lte: stockLimit } } }),
          prisma.order.count({ where: { tenantId } }),
          prisma.order.count({ where: { tenantId, status: "COMPLETED" } }),
          prisma.order.count({ where: { tenantId, status: "CANCELLED" } }),
          prisma.order.count({ where: { tenantId, status: "PENDING" } }),
        ])

        const revenueAgg = await prisma.order.aggregate({
          where: { tenantId, status: "COMPLETED" },
          _sum: { total: true },
        })
        const revenue = revenueAgg._sum.total ?? 0

        parts.push(
          [
            "Resumo do tenant",
            `Clientes: ${clientsCount}`,
            `Produtos: ${productsCount}`,
            `Estoque baixo (≤ ${stockLimit}): ${lowStockCount}`,
            `Pedidos: ${ordersTotal} (Pendentes: ${ordersPending} | Concluídos: ${ordersCompleted} | Cancelados: ${ordersCancelled})`,
            `Receita (concluídos): ${moneyBRL(revenue)}`,
          ].join("\n")
        )
      }

      // ------------------------------------------------------------
      // Clientes (por nome tem prioridade)
      // ------------------------------------------------------------
      if (clientName) {
        const clients = await prisma.client.findMany({
          where: { tenantId, name: { contains: clientName, mode: "insensitive" } },
          orderBy: { createdAt: "desc" },
          take: LIST_LIMIT,
          select: { name: true, email: true, phone: true },
        })

        if (clients.length === 0) {
          parts.push(`Não encontrei cliente com nome parecido com "${clientName}".`)
        } else {
          const lines = clients.map((c) => {
            const email = c.email ? ` • ${c.email}` : ""
            const phone = c.phone ? ` • ${c.phone}` : ""
            return `- ${c.name}${email}${phone}`
          })
          parts.push([`Clientes encontrados (${clients.length}):`, ...lines].join("\n"))
        }
      } else if (wantsClients) {
        const count = await prisma.client.count({ where: { tenantId } })
        parts.push(`Clientes cadastrados: ${count}`)

        if (wantsList) {
          const clients = await prisma.client.findMany({
            where: { tenantId },
            orderBy: { createdAt: "desc" },
            take: LIST_LIMIT,
            select: { name: true, email: true, phone: true },
          })

          if (clients.length === 0) parts.push("Nenhum cliente cadastrado ainda.")
          else {
            const lines = clients.map((c) => {
              const email = c.email ? ` • ${c.email}` : ""
              const phone = c.phone ? ` • ${c.phone}` : ""
              return `- ${c.name}${email}${phone}`
            })
            parts.push(["Últimos clientes:", ...lines].join("\n"))
          }
        }
      }

      // ------------------------------------------------------------
      // Produtos (por nome tem prioridade)
      // ------------------------------------------------------------
      if (productName) {
        const products = await prisma.product.findMany({
          where: { tenantId, name: { contains: productName, mode: "insensitive" } },
          orderBy: { createdAt: "desc" },
          take: LIST_LIMIT,
          select: { name: true, stock: true, price: true },
        })

        if (products.length === 0) {
          parts.push(`Não encontrei produto com nome parecido com "${productName}".`)
        } else {
          const lines = products.map((p) => `- ${p.name} • estoque: ${p.stock} • preço: ${moneyBRL(Number(p.price))}`)
          parts.push([`Produtos encontrados (${products.length}):`, ...lines].join("\n"))
        }
      } else if (wantsStock) {
        const low = await prisma.product.findMany({
          where: { tenantId, stock: { lte: stockLimit } },
          orderBy: [{ stock: "asc" }, { name: "asc" }],
          take: LIST_LIMIT,
          select: { name: true, stock: true, price: true },
        })

        if (low.length === 0) parts.push(`Nenhum produto com estoque baixo (≤ ${stockLimit}).`)
        else {
          const lines = low.map((p) => `- ${p.name} • estoque: ${p.stock} • preço: ${moneyBRL(Number(p.price))}`)
          parts.push([`Produtos com estoque baixo (≤ ${stockLimit}):`, ...lines].join("\n"))
        }
      } else if (wantsProducts) {
        const count = await prisma.product.count({ where: { tenantId } })
        parts.push(`Produtos cadastrados: ${count}`)

        if (wantsList) {
          const products = await prisma.product.findMany({
            where: { tenantId },
            orderBy: { createdAt: "desc" },
            take: LIST_LIMIT,
            select: { name: true, stock: true, price: true },
          })

          if (products.length === 0) parts.push("Nenhum produto cadastrado ainda.")
          else {
            const lines = products.map((p) => `- ${p.name} • estoque: ${p.stock} • preço: ${moneyBRL(Number(p.price))}`)
            parts.push(["Últimos produtos:", ...lines].join("\n"))
          }
        }
      }

      // ------------------------------------------------------------
      // Pedidos
      // ------------------------------------------------------------
      if (wantsOrders) {
        const where: any = { tenantId }
        if (statusFilter) where.status = statusFilter

        const [total, completed, cancelled, pending] = await Promise.all([
          prisma.order.count({ where: { tenantId } }),
          prisma.order.count({ where: { tenantId, status: "COMPLETED" } }),
          prisma.order.count({ where: { tenantId, status: "CANCELLED" } }),
          prisma.order.count({ where: { tenantId, status: "PENDING" } }),
        ])

        const header = [
          `Pedidos: ${total}`,
          `Pendentes: ${pending} | Concluídos: ${completed} | Cancelados: ${cancelled}`,
        ].join("\n")

        parts.push(header)

        const shouldListOrders = wantsList || Boolean(statusFilter) || includesAny(q, ["ultimos", "últimos", "recentes", "recent"])
        if (shouldListOrders) {
          const orders = await prisma.order.findMany({
            where,
            orderBy: { createdAt: "desc" },
            take: 10,
            include: { client: { select: { name: true, email: true } } },
          })

          if (orders.length === 0) {
            parts.push("Nenhum pedido encontrado com esse filtro.")
          } else {
            const lines = orders.map((o) => {
              const c = o.client?.name ?? "Cliente"
              const e = o.client?.email ? ` (${o.client.email})` : ""
              const st = statusLabel(o.status as OrderStatus)
              return `- ${c}${e} • ${st} • total: ${moneyBRL(Number(o.total))}`
            })

            const filterText = statusFilter ? `Filtro: ${statusLabel(statusFilter)}\n` : ""
            parts.push([filterText + "Últimos pedidos:", ...lines].join("\n"))
          }
        }
      }

      const answer = parts.filter(Boolean).join("\n\n").trim()
      return reply.send({ answer: answer || helpText() })
    }
  )
}