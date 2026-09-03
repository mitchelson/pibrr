import { sql } from "@/lib/db"
import { auth } from "@/lib/auth"
import { Calendar, ClipboardList, MessageSquare, Users, Music } from "lucide-react"
import Link from "next/link"
import { MinistryIcon } from "@/components/ministry-icon"
import { canAccessAcolhimento } from "@/lib/acolhimento"
import { getAcolhimentoMinisterioId } from "@/lib/acolhimento-server"
import {
  gestaoSessionFromAuth,
  isGestaoBffEnabled,
  ssrGestaoJson,
} from "@/lib/gestao-ssr"
import {
  DsCount,
  DsEmpty,
  DsHero,
  DsList,
  DsPage,
  DsRow,
  DsSection,
  DsStatStrip,
} from "@/components/app-v2/ds"

export const dynamic = "force-dynamic"

type DashboardStats = {
  pendenciasEscalas: number
  escalasSemana: number
  pedidosMinisterio: number
  whatsappPendentes: number
}

export default async function AdminV2Dashboard() {
  const session = await auth()
  const role = session?.user?.role
  const ministerioIds: string[] = session?.user?.ministerioIds || []
  const acolhimentoId = await getAcolhimentoMinisterioId()
  const showAcolhimento = canAccessAcolhimento(role, ministerioIds, acolhimentoId)
  const firstName = session?.user?.name?.split(" ")[0] || "líder"

  let pendenciasEscalas = 0
  let escalasSemanaCount = 0
  let pedidosMinisterio = 0
  let whatsappPendentes = 0
  let ministerios: Array<{ id: string; nome: string; icone?: string; cor?: string }> = []

  if (isGestaoBffEnabled()) {
    const gestaoSession = await gestaoSessionFromAuth()
    const [dash, mins] = await Promise.all([
      ssrGestaoJson<DashboardStats>("/v1/admin/dashboard", { session: gestaoSession }),
      ssrGestaoJson<Array<{ id: string; nome: string; icone?: string; cor?: string; ativo?: boolean }>>(
        "/v1/ministerios",
        { public: true }
      ),
    ])
    pendenciasEscalas = dash?.pendenciasEscalas ?? 0
    escalasSemanaCount = dash?.escalasSemana ?? 0
    pedidosMinisterio = dash?.pedidosMinisterio ?? 0
    whatsappPendentes = showAcolhimento ? dash?.whatsappPendentes ?? 0 : 0
    ministerios = (mins || []).filter((m) => m.ativo !== false)
  } else {
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
    pendenciasEscalas = escalasPendentes[0]?.total ?? 0
    escalasSemanaCount = escalasSemana[0]?.total ?? 0
    try {
      const ped = await sql`SELECT count(*)::int as total FROM ministerio_membros WHERE pendente = true`
      pedidosMinisterio = ped[0]?.total ?? 0
    } catch {
      pedidosMinisterio = 0
    }

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

    ministerios = (await sql`
      SELECT id, nome, icone, cor FROM ministerios WHERE ativo = true ORDER BY ordem ASC, nome ASC
    `) as typeof ministerios
  }

  const visibleMinisterios =
    role === "admin" ? ministerios : ministerios.filter((m) => ministerioIds.includes(m.id))

  const queue = [
    showAcolhimento && whatsappPendentes > 0
      ? {
          href: "/admin/visitantes",
          title: "WhatsApp pendente",
          meta: `${whatsappPendentes} pessoa${whatsappPendentes !== 1 ? "s" : ""} novas`,
          icon: MessageSquare,
          value: whatsappPendentes,
        }
      : null,
    (role === "admin" || role === "lider") && pendenciasEscalas > 0
      ? {
          href: role === "admin" ? "/admin/escalas" : visibleMinisterios[0]
            ? `/admin/ministerios/${visibleMinisterios[0].id}`
            : "/admin",
          title: "Confirmações atrasadas",
          meta: "Escalas ainda sem resposta",
          icon: ClipboardList,
          value: pendenciasEscalas,
        }
      : null,
    pedidosMinisterio > 0
      ? {
          href: visibleMinisterios[0]
            ? `/admin/ministerios/${visibleMinisterios[0].id}`
            : "/admin",
          title: "Pedidos de entrada",
          meta: "Querem servir em um ministério",
          icon: Users,
          value: pedidosMinisterio,
        }
      : null,
    role === "admin"
      ? {
          href: "/admin/escalas",
          title: "Cultos desta semana",
          meta: "Escalas nos próximos 7 dias",
          icon: Calendar,
          value: escalasSemanaCount,
        }
      : null,
  ].filter(Boolean) as Array<{
    href: string
    title: string
    meta: string
    icon: typeof Users
    value: number
  }>

  const pendentesConfirm = pendenciasEscalas
  const semana = escalasSemanaCount

  return (
    <DsPage className="pib-page--admin">
      <DsHero
        kicker="Gestão"
        title={`Fila de ${firstName}`}
        subtitle="Só o que precisa de ação. Ministério, cultos e pessoas ficam no menu."
      />

      <DsStatStrip
        items={[
          { value: pendentesConfirm, label: "Sem resposta" },
          { value: pedidosMinisterio, label: "Pedidos" },
          {
            value: showAcolhimento ? whatsappPendentes : semana,
            label: showAcolhimento ? "WhatsApp" : "Esta semana",
          },
        ]}
      />

      <DsSection priority eyebrow="Urgente" title="Atenção">
        {queue.length === 0 ? (
          <DsEmpty title="Fila limpa" description="Nada urgente no momento." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {queue.map((item) => (
              <Link
                key={item.href + item.title}
                href={item.href}
                className="block rounded-[var(--pib-radius-sm)] border border-[var(--pib-line)] bg-[var(--pib-paper)] p-5 transition-colors hover:bg-black/[0.02]"
              >
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

      <DsSection primary eyebrow="Trabalho" title="Seu ministério">
        {visibleMinisterios.length === 0 ? (
          <DsEmpty title="Nenhum ministério" description="Peça a um administrador para vincular você." />
        ) : (
          <DsList>
            {visibleMinisterios.map((m: any) => (
              <DsRow
                key={m.id}
                href={`/admin/ministerios/${m.id}`}
                leading={<MinistryIcon name={m.icone} ministryName={m.nome} mono size={22} />}
                title={m.nome}
                meta="Escala, membros e pedidos"
              />
            ))}
            {role === "admin" && (
              <DsRow
                href="/admin/ministerios"
                leading={<Music className="h-5 w-5" />}
                title="Todos os ministérios"
                meta="Criar, editar e ordenar"
              />
            )}
          </DsList>
        )}
      </DsSection>

      {role === "admin" && (
        <DsSection eyebrow="Igreja" title="Atalhos">
          <DsList>
            <DsRow href="/admin/escalas" title="Cultos" meta="Escala por culto" />
            <DsRow href="/admin/membros" title="Pessoas" meta="Papéis e ficha" />
            <DsRow href="/admin/eventos" title="Calendário" meta="Eventos e modelos" />
          </DsList>
        </DsSection>
      )}
    </DsPage>
  )
}
