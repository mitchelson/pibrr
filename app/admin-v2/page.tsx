import { sql } from "@/lib/neon"
import { auth } from "@/lib/auth"
import { Calendar, ClipboardList, MessageSquare, Users, Music } from "lucide-react"
import Link from "next/link"
import { MinistryIcon } from "@/components/ministry-icon"
import { canAccessAcolhimento } from "@/lib/acolhimento"
import { getAcolhimentoMinisterioId } from "@/lib/acolhimento-server"
import {
  DsCount,
  DsEmpty,
  DsHero,
  DsList,
  DsPage,
  DsPanel,
  DsRow,
  DsSection,
} from "@/components/app-v2/ds"

export const dynamic = "force-dynamic"

export default async function AdminV2Dashboard() {
  const session = await auth()
  const role = session?.user?.role
  const ministerioIds: string[] = session?.user?.ministerioIds || []
  const acolhimentoId = await getAcolhimentoMinisterioId()
  const showAcolhimento = canAccessAcolhimento(role, ministerioIds, acolhimentoId)
  const firstName = session?.user?.name?.split(" ")[0] || "líder"

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

  const queue = [
    showAcolhimento && whatsappPendentes > 0
      ? {
          href: "/admin-v2/visitantes",
          title: "WhatsApp pendente",
          meta: `${whatsappPendentes} pessoa${whatsappPendentes !== 1 ? "s" : ""} novas`,
          icon: MessageSquare,
          value: whatsappPendentes,
        }
      : null,
    (role === "admin" || role === "lider") && (escalasPendentes[0]?.total ?? 0) > 0
      ? {
          href: role === "admin" ? "/admin-v2/escalas" : visibleMinisterios[0]
            ? `/admin-v2/ministerios/${visibleMinisterios[0].id}`
            : "/admin-v2",
          title: "Confirmações atrasadas",
          meta: "Escalas ainda sem resposta",
          icon: ClipboardList,
          value: escalasPendentes[0]?.total ?? 0,
        }
      : null,
    pedidosMinisterio > 0
      ? {
          href: visibleMinisterios[0]
            ? `/admin-v2/ministerios/${visibleMinisterios[0].id}`
            : "/admin-v2",
          title: "Pedidos de entrada",
          meta: "Querem servir em um ministério",
          icon: Users,
          value: pedidosMinisterio,
        }
      : null,
    role === "admin"
      ? {
          href: "/admin-v2/escalas",
          title: "Cultos desta semana",
          meta: "Escalas nos próximos 7 dias",
          icon: Calendar,
          value: escalasSemana[0]?.total ?? 0,
        }
      : null,
  ].filter(Boolean) as Array<{
    href: string
    title: string
    meta: string
    icon: typeof Users
    value: number
  }>

  return (
    <DsPage wide>
      <DsHero
        kicker="Gestão"
        title={`Fila de ${firstName}`}
        subtitle="Só o que precisa de ação. Ministério, cultos e pessoas ficam no menu."
      />

      <DsSection title="Atenção">
        {queue.length === 0 ? (
          <DsEmpty title="Fila limpa" description="Nada urgente no momento." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {queue.map((item) => (
              <Link key={item.href + item.title} href={item.href} className="pib-panel block p-5 transition-colors hover:bg-black/[0.02]">
                <div className="mb-4 flex items-center justify-between">
                  <item.icon className="h-4 w-4 text-[var(--pib-mute)]" />
                  <DsCount>{item.value}</DsCount>
                </div>
                <p className="font-semibold">{item.title}</p>
                <p className="pib-mute mt-1 text-sm">{item.meta}</p>
              </Link>
            ))}
          </div>
        )}
      </DsSection>

      <DsSection title="Seu ministério">
        {visibleMinisterios.length === 0 ? (
          <DsEmpty title="Nenhum ministério" description="Peça a um administrador para vincular você." />
        ) : (
          <DsList>
            {visibleMinisterios.map((m: any) => (
              <DsRow
                key={m.id}
                href={`/admin-v2/ministerios/${m.id}`}
                leading={<MinistryIcon name={m.icone} ministryName={m.nome} mono size={22} />}
                title={m.nome}
                meta="Escala, membros e pedidos"
              />
            ))}
            {role === "admin" && (
              <DsRow
                href="/admin-v2/ministerios"
                leading={<Music className="h-5 w-5" />}
                title="Todos os ministérios"
                meta="Criar, editar e ordenar"
              />
            )}
          </DsList>
        )}
      </DsSection>

      {role === "admin" && (
        <DsSection title="Atalhos da igreja">
          <div className="grid gap-3 sm:grid-cols-3">
            <DsPanel className="p-0">
              <DsRow href="/admin-v2/escalas" title="Cultos" meta="Escala por culto" />
            </DsPanel>
            <DsPanel className="p-0">
              <DsRow href="/admin-v2/membros" title="Pessoas" meta="Papéis e ficha" />
            </DsPanel>
            <DsPanel className="p-0">
              <DsRow href="/admin-v2/eventos" title="Calendário" meta="Eventos e modelos" />
            </DsPanel>
          </div>
        </DsSection>
      )}
    </DsPage>
  )
}
