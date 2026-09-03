import { sql } from "@/lib/neon"
import { auth } from "@/lib/auth"
import { Calendar, ClipboardList, MessageSquare, Users, ChevronRight, Music } from "lucide-react"
import Link from "next/link"
import { MinistryIcon } from "@/components/ministry-icon"
import { TryV2Link } from "@/components/app-v2/try-v2-link"
import { APP_PATHS } from "@/lib/app-ui"

export const dynamic = "force-dynamic"

export default async function AdminDashboard() {
  const session = await auth()
  const role = session?.user?.role
  const ministerioIds: string[] = (session?.user as any)?.ministerioIds || []

  const visitantesCount = await sql`SELECT count(*)::int as total FROM visitantes WHERE data_cadastro >= now() - interval '30 days'`
  const escalasSemana = await sql`
    SELECT count(*)::int as total FROM escalas es
    INNER JOIN eventos e ON e.id = es.evento_id
    WHERE e.data >= CURRENT_DATE AND e.data < CURRENT_DATE + interval '7 days'
  `
  let postsRecentes: any[] = [{ total: 0 }]
  try {
    postsRecentes = await sql`SELECT count(*)::int as total FROM feed_posts WHERE criado_em >= now() - interval '7 days'`
  } catch {
    postsRecentes = [{ total: 0 }]
  }
  const ministerios = await sql`SELECT id, nome, icone, cor FROM ministerios WHERE ativo = true ORDER BY ordem ASC, nome ASC`

  let pendenciasWhatsapp = 0
  try {
    const pend = await sql`
      SELECT count(*)::int as total FROM visitantes v
      WHERE v.sem_whatsapp IS NOT TRUE
        AND EXISTS (
          SELECT 1 FROM mensagens_categorias c WHERE c.ativo = true
          AND NOT EXISTS (
            SELECT 1 FROM mensagens_enviadas me
            WHERE me.visitante_id = v.id AND me.categoria_id = c.id
          )
        )
    `
    pendenciasWhatsapp = pend[0]?.total ?? 0
  } catch {
    pendenciasWhatsapp = 0
  }

  const visibleMinisterios = role === "admin"
    ? ministerios
    : ministerios.filter((m: any) => ministerioIds.includes(m.id))

  const kpis = [
    {
      href: "/admin/visitantes",
      label: "Visitantes (30d)",
      value: visitantesCount[0]?.total ?? 0,
      icon: Users,
    },
    {
      href: "/admin/mensagens",
      label: "Pendências WhatsApp",
      value: pendenciasWhatsapp,
      icon: MessageSquare,
    },
    {
      href: "/admin/escalas",
      label: "Escalas (7d)",
      value: escalasSemana[0]?.total ?? 0,
      icon: ClipboardList,
      adminOnly: true,
    },
    {
      href: "/feed",
      label: "Posts (7d)",
      value: (postsRecentes as any)[0]?.total ?? 0,
      icon: Calendar,
    },
  ].filter((k) => !k.adminOnly || role === "admin")

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Resumo operacional — use o menu para navegar
          </p>
        </div>
        <TryV2Link href={APP_PATHS.v2.admin} />
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Link
            key={kpi.href + kpi.label}
            href={kpi.href}
            className="rounded-xl border bg-card p-4 transition-colors hover:bg-muted/40"
          >
            <div className="flex items-center justify-between mb-2">
              <kpi.icon className="h-4 w-4 text-muted-foreground" />
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold tabular-nums">{kpi.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{kpi.label}</p>
          </Link>
        ))}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Seus ministérios
        </h2>
        <div className="grid gap-2">
          {visibleMinisterios.map((m: any) => (
            <Link key={m.id} href={`/admin/ministerios/${m.id}`}>
              <div className="flex items-center gap-3 rounded-xl border bg-card p-3 transition-colors hover:bg-muted/40">
                <MinistryIcon name={m.icone} ministryName={m.nome} color={m.cor} size={22} />
                <span className="flex-1 font-medium text-sm">{m.nome}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
          ))}
          {visibleMinisterios.length === 0 && (
            <p className="text-sm text-muted-foreground py-4">Nenhum ministério vinculado.</p>
          )}
          {role === "admin" && (
            <Link href="/admin/ministerios">
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
