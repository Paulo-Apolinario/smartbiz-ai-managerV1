import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

const kpis = [
  { title: "Pedidos", value: "—", sub: "Total no mês" },
  { title: "Receita", value: "—", sub: "Somente COMPLETED" },
  { title: "Clientes", value: "—", sub: "Ativos" },
  { title: "Estoque baixo", value: "—", sub: "Produtos ≤ limite" },
]

const features = [
  {
    title: "Multi-tenant de verdade",
    desc: "Isolamento total por tenant (loja). Cada empresa vê apenas seus dados.",
  },
  {
    title: "RBAC profissional",
    desc: "Roles: ADMIN, MANAGER, SALES, USER com middleware de autorização por rota.",
  },
  {
    title: "Vendas com estoque automático",
    desc: "Criação de pedidos em transação, baixa automática e devolução no cancelamento.",
  },
  {
    title: "Dashboard de KPIs",
    desc: "Pedidos por status, receita (completed), clientes totais e estoque baixo.",
  },
  {
    title: "Arquitetura escalável",
    desc: "Rotas organizadas por domínio e padrões prontos para evoluir.",
  },
  {
    title: "IA com RAG (próximo)",
    desc: "Chatbot com contexto do tenant (orders, products, clients) com segurança.",
  },
]

export default function HomePage() {
  return (
    <main className="relative min-h-screen w-full bg-background text-foreground">
      {/* Background premium full-width */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(1200px_circle_at_10%_10%,hsl(var(--primary)/0.16),transparent_55%),radial-gradient(900px_circle_at_90%_15%,hsl(var(--secondary)/0.18),transparent_55%),radial-gradient(900px_circle_at_60%_110%,hsl(var(--primary)/0.10),transparent_55%)]" />
        <div className="absolute inset-0 opacity-[0.06] bg-[linear-gradient(to_right,hsl(var(--foreground)/0.25)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--foreground)/0.25)_1px,transparent_1px)] bg-size-[56px_56px]" />
        <div className="absolute inset-0 bg-gradient from-background/30 via-background to-background" />
      </div>

      {/* Shell full width (sem max-w pequeno) */}
      <div className="w-full px-4 sm:px-6 lg:px-10 2xl:px-16">
        {/* Header */}
        <header className="flex w-full items-center justify-between py-6">
          <div className="flex items-center gap-3">
            <div className="relative grid h-11 w-11 place-items-center overflow-hidden rounded-2xl border bg-background/60 shadow-sm backdrop-blur">
              <div className="absolute inset-0 bg-[linear-gradient(135deg,hsl(var(--primary)/0.25),transparent_55%,hsl(var(--primary)/0.10))]" />
              <span className="relative text-sm font-extrabold tracking-tight text-primary">
                SB
              </span>
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold">SmartBiz AI</p>
              <p className="text-xs text-muted-foreground">ERP SaaS multi-tenant</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="outline"
              className="bg-background/55 backdrop-blur hover:bg-background"
            >
              <Link href="/login">Entrar</Link>
            </Button>

            <Button
              asChild
              className="relative overflow-hidden border border-primary/30 bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              <Link href="/dashboard">
                <span className="relative z-10">Acessar painel</span>
                <span className="pointer-events-none absolute inset-0 -z-1 bg-[radial-gradient(900px_circle_at_30%_0%,rgba(255,255,255,0.18),transparent_45%)]" />
              </Link>
            </Button>
          </div>
        </header>

        {/* HERO full-width com limite maior (2xl) */}
        <section className="mx-auto w-full max-w-screen-2xl pb-12 pt-2">
          <div className="grid gap-10 xl:grid-cols-2 xl:items-center">
            {/* Left */}
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                {["Multi-tenant", "RBAC", "Pedidos + Estoque", "Dashboard KPIs"].map((t) => (
                  <Badge
                    key={t}
                    variant="secondary"
                    className="border border-foreground/10 bg-background/55 backdrop-blur"
                  >
                    {t}
                  </Badge>
                ))}
              </div>

              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl xl:text-5xl xl:leading-[1.08]">
                Gerencie clientes, produtos e vendas com um{" "}
                <span
                  className={[
                    "bg-clip-text text-transparent",
                    // ✅ gradiente NOVO (sem bg-gradient-to-r)
                    "bg-[linear-gradient(135deg,hsl(var(--primary))_0%,hsl(var(--primary)/0.78)_38%,hsl(var(--foreground))_100%)]",
                  ].join(" ")}
                >
                  sistema moderno e escalável.
                </span>{" "}

              </h1>

              <p className="max-w-2xl text-muted-foreground leading-relaxed">
                SmartBiz AI é um projeto profissional para portfólio: backend robusto com Fastify + Prisma + Postgres,
                multi-tenant real, autenticação JWT, permissões por perfil, pedidos com estoque automático e dashboard de KPIs.
              </p>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button
                  asChild
                  size="lg"
                  className="relative overflow-hidden border border-primary/30 bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                >
                  <Link href="/login">
                    <span className="relative z-10">Começar agora</span>
                    <span className="pointer-events-none absolute inset-0 -z-1 bg-[radial-gradient(900px_circle_at_35%_0%,rgba(255,255,255,0.22),transparent_45%)]" />
                  </Link>
                </Button>

                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="bg-background/55 backdrop-blur hover:bg-background"
                >
                  <Link href="/dashboard">Ver dashboard</Link>
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                * Em breve: Chatbot IA com RAG por tenant (dados isolados).
              </p>
            </div>

            {/* Right (mock) — ocupa melhor a tela */}
            <div className="relative">
              <div className="absolute -inset-2 rounded-[32 px] bg-[linear-gradient(135deg,hsl(var(--primary)/0.22),transparent_55%,hsl(var(--primary)/0.10))] blur-2xl" />
              <div className="relative rounded-[32 px] border bg-background/45 p-4 shadow-sm backdrop-blur">
                <div className="rounded-2xl border bg-background/70 p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Visão geral</p>
                    <Badge className="border border-primary/30 bg-primary/10 text-primary">
                      Live
                    </Badge>
                  </div>

                  <Separator className="my-4" />

                  <div className="grid gap-3 sm:grid-cols-2">
                    {kpis.map((kpi) => (
                      <div
                        key={kpi.title}
                        className="group rounded-2xl border bg-background/70 p-4 transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-sm"
                      >
                        <p className="text-xs text-muted-foreground">{kpi.title}</p>
                        <p className="mt-1 text-2xl font-bold tracking-tight">{kpi.value}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{kpi.sub}</p>

                        <div className="mt-3 h-1 w-14 rounded-full bg-[linear-gradient(90deg,hsl(var(--primary)/0.7),hsl(var(--primary)/0.20),transparent)] opacity-70 transition group-hover:opacity-100" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3">
                  {["Pedidos", "Produtos", "Clientes"].map((t) => (
                    <div
                      key={t}
                      className="rounded-2xl border bg-background/60 px-3 py-2 text-center text-xs text-muted-foreground transition hover:border-foreground/15 hover:bg-background/80"
                    >
                      {t}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto w-full max-w-screen-2xl py-12">
          <div className="mb-7 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">O que já está pronto</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Base sólida para evoluir até deploy e IA.
              </p>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex h-2 w-2 rounded-full bg-primary/70" />
              <span>SaaS-ready</span>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {features.map((f) => (
              <Card
                key={f.title}
                className="group relative overflow-hidden border bg-background/55 backdrop-blur transition hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-sm"
              >
                <div className="pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100">
                  <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/10 blur-2xl" />
                  <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-primary/10 blur-2xl" />
                </div>

                <CardHeader>
                  <CardTitle className="text-base">{f.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground leading-relaxed">
                  {f.desc}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>

      {/* Footer full-width */}
      <footer className="border-t bg-background/40 backdrop-blur">
        <div className="w-full px-4 sm:px-6 lg:px-10 2xl:px-16">
          <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-3 py-8 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} SmartBiz AI — projeto de portfólio.
            </p>

            <div className="flex gap-2">
              <Button asChild variant="ghost" className="hover:bg-foreground/5">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <Button asChild variant="ghost" className="hover:bg-foreground/5">
                <Link href="/login">Login</Link>
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
