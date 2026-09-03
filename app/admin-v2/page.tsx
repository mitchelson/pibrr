import { sql } from "@/lib/neon"
import { auth } from "@/lib/auth"
import { Calendar, ClipboardList, MessageSquare, Users, ChevronRight, Music } from "lucide-react"
import Link from "next/link"
import { MinistryIcon } from "@/components/ministry-icon"
import { canAccessAcolhimento } from "@/lib/acolhimento"
import { getAcolhimentoMinisterioId } from "@/lib/acolhimento-server"

export const dynamic = "force-dynamic"

export default async function AdminV2Dashboard() {
  const session = await auth()
  const role = session?.user?.role
  const ministerioIds: string[] = session?.user?.ministerioIds || []
  const acolhimentoId = await getAcolhimentoMinisterioId()
  const showAcolhimento = canAccessAcolhimento(role, ministerioIds, acolhimentoId)

  const escalasPendentes = await sql`
    SELECT count(*)::int as total FROM escalas es
    INNER JOIN eventos e ON e.id = es.evento_id
    WHERE es.status = 'pendente' AND e.data >= CURRENT_DATE
  `
  const escalasSemana = await sql`
    SELECT count(*)::int as total FROM escalas es
    INNER JOIN eventos e ON e.id = es.evento_id
    WHERE e.data >= CURRENT_DATE AND e.data < CURRENT_DATE + interval '7 days'
  `
  let pedidosMinisterio = 0
  try {
    const ped = await sql`SELECT count(*)::int as total FROM ministerio_membros WHERE pendente = true`
    pedidosMinisterio = ped[0]?.total ?? 0
  } catch {
    pedidosMinisterio = 0
  }

  let whatsappPendentes = 0
  if (showAcolhimento) {
    try {
      const pend = await sql`
        SELECT count(*)::int as total FROM visitantes v
        WHERE v.sem_whatsapp IS NOT TRUE
          AND EXISTS (
            SELECT 1 FROM mensagem_categorias c WHERE c.ativa = true
            AND NOT EXISTS (
              SELECT 1 FROM visitante_mensagens_enviadas me
              WHERE me.visitante_id = v.id AND me.categoria_id = c.id
            )
          )
      `
      whatsappPendentes = pend[0]?.total ?? 0
    } catch {
      whatsappPendentes = 0
    }
  }

  const ministerios = await sql`SELECT id, nome, icone, cor FROM ministerios WHERE ativo = true ORDER BY ordem ASC, nome ASC`
  const visibleMinisterios =
    role === "admin" ? ministerios : ministerios.filter((m: any) => ministerioIds.includes(m.id))

  const kpis = [
    showAcolhimento && {
      href: "/admin-v2/visitantes",
      label: "WhatsApp pendente",
      value: whatsappPendentes,
      icon: MessageSquare,
    },
    {
      href: "/admin-v2/escalas",
      label: "Confirmações atrasadas",
      value: escalasPendentes[0]?.total ?? 0,
      icon: ClipboardList,
      adminOnly: true,
    },
    {
      href: visibleMinisterios[0] ? `/admin-v2/ministerios/${visibleMinisterios[0].id}` : "/admin-v2",
      label: "Pedidos de ministério",
      value: pedidosMinisterio,
      icon: Users,
    },
    {
      href: "/admin-v2/escalas",
      label: "Escalas (7d)",
      value: escalasSemana[0]?.total ?? 0,
      icon: Calendar,
      adminOnly: true,
    },
  ]
    .filter(Boolean)
    .filter((k: any) => !k.adminOnly || role === "admin") as Array<{
    href: string
    label: string
    value: number
    icon: typeof Users
  }>

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">O que precisa de atenção hoje</p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Link
            key={kpi.href + kpi.label}
            href={kpi.href}
            className="rounded-xl border bg-card p-4 transition-colors hover:bg-muted/40"
          >
            <div className="mb-2 flex items-center justify-between">
              <kpi.icon className="h-4 w-4 text-muted-foreground" />
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold tabular-nums">{kpi.value}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{kpi.label}</p>
          </Link>
        ))}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Seus ministérios
        </h2>
        <div className="grid gap-2">
          {visibleMinisterios.map((m: any) => (
            <Link key={m.id} href={`/admin-v2/ministerios/${m.id}`}>
              <div className="flex items-center gap-3 rounded-xl border bg-card p-3 transition-colors hover:bg-muted/40">
                <MinistryIcon name={m.icone} ministryName={m.nome} color={m.cor} size={22} />
                <span className="flex-1 text-sm font-medium">{m.nome}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
          ))}
          {visibleMinisterios.length === 0 && (
            <p className="py-4 text-sm text-muted-foreground">Nenhum ministério vinculado.</p>
          )}
          {role === "admin" && (
            <Link href="/admin-v2/ministerios">
              <div className="flex items-center gap-3 rounded-xl border border-dashed bg-card p-3 transition-colors hover:bg-muted/40">
                <Music className="h-5 w-5 text-muted-foreground" />
                <span className="flex-1 text-sm text-muted-foreground">Gerenciar ministérios</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
          )}
        </div>
      </section>
    </div>
  )
}
