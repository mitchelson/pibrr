import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { sql } from "@/lib/db"
import { PullToRefresh } from "@/components/pull-to-refresh"
import { PushNotificationRegister } from "@/components/push-notification-register"
import { EscalaRowV2 } from "./escala-row"
import { InboxSection } from "./inbox-section"
import { DsEmpty, DsHero, DsPage, DsSection } from "@/components/app-v2/ds"
import {
  gestaoSessionFromAuth,
  isGestaoBffEnabled,
  ssrGestaoJson,
} from "@/lib/gestao-ssr"

export const dynamic = "force-dynamic"

type MinhaEscalaRow = {
  id: string
  titulo: string
  data: string
  horario?: string
  escala_id?: string
  minha_funcao?: string
  meu_status?: string
  ministerio_id?: string
  ministerio?: string
  icone?: string
  is_escalado?: boolean | string
  total_escalados?: number
}

function toBool(value: unknown) {
  return value === true || value === "true"
}

function isFuture(dateStr: string) {
  const today = new Date().toISOString().slice(0, 10)
  return String(dateStr).slice(0, 10) >= today
}

/**
 * Hoje — home do membro.
 * 1) Suas escalas (decidir/preparar)
 * 2) Outros cultos (ver quem serve / achar troca)
 */
export default async function MinhaAreaV2Page() {
  const session = await auth()
  if (!session) redirect("/login")

  const userId = session.user.id

  let rows: MinhaEscalaRow[] = []

  if (isGestaoBffEnabled()) {
    const gestaoSession = session.user?.id
      ? {
          userId: session.user.id,
          role: session.user.role || "membro",
          ministerioIds: session.user.ministerioIds || [],
        }
      : await gestaoSessionFromAuth()
    // Sem only=mine → todos os cultos futuros + flag is_escalado (paridade app)
    const minhasRaw = await ssrGestaoJson<MinhaEscalaRow[]>("/v1/escalas/minhas", {
      session: gestaoSession,
    })
    rows = Array.isArray(minhasRaw) ? minhasRaw : []

    // Fallback: montar lista a partir de eventos + só-minhas
    if (rows.length === 0) {
      const [somenteMinhas, eventosRaw] = await Promise.all([
        ssrGestaoJson<MinhaEscalaRow[]>("/v1/escalas/minhas?only=mine", {
          session: gestaoSession,
        }),
        ssrGestaoJson<Array<{ id: string; titulo: string; data: string; horario?: string }>>(
          "/v1/eventos",
          { public: true }
        ),
      ])
      const mineMap = new Map(
        (Array.isArray(somenteMinhas) ? somenteMinhas : []).map((m) => [String(m.id), m])
      )
      rows = (Array.isArray(eventosRaw) ? eventosRaw : [])
        .filter((e) => isFuture(String(e.data)))
        .sort((a, b) => String(a.data).localeCompare(String(b.data)))
        .slice(0, 20)
        .map((e) => {
          const mine = mineMap.get(String(e.id))
          if (mine) return { ...e, ...mine, is_escalado: true }
          return { ...e, is_escalado: false }
        })
    }
  } else {
    const eventos = (await sql`
      SELECT e.id, e.titulo, e.data, e.horario,
             es.id as escala_id, es.funcao as minha_funcao, es.status as meu_status,
             es.ministerio_id as ministerio_id,
             m.nome as ministerio, m.icone,
             CASE WHEN es.user_id IS NOT NULL THEN true ELSE false END as is_escalado,
             (SELECT count(*)::int FROM escalas WHERE evento_id = e.id) as total_escalados
      FROM eventos e
      LEFT JOIN escalas es ON es.evento_id = e.id AND es.user_id = ${userId}
      LEFT JOIN ministerios m ON m.id = es.ministerio_id
      WHERE e.data >= CURRENT_DATE
      ORDER BY e.data ASC
      LIMIT 20
    `) as MinhaEscalaRow[]
    rows = eventos
  }

  const future = rows.filter((r) => isFuture(String(r.data)))

  // Um card por culto nas minhas (2 ministérios no mesmo dia → prioriza pendente)
  const minhasPorEvento = new Map<string, MinhaEscalaRow>()
  for (const row of future) {
    const escalado = toBool(row.is_escalado) || !!row.escala_id
    if (!escalado) continue
    const existing = minhasPorEvento.get(row.id)
    if (!existing) {
      minhasPorEvento.set(row.id, { ...row, is_escalado: true })
      continue
    }
    const rank = (s?: string) => (s === "pendente" ? 0 : s === "confirmado" ? 1 : 2)
    if (rank(row.meu_status) < rank(existing.meu_status)) {
      minhasPorEvento.set(row.id, { ...row, is_escalado: true })
    }
  }
  const cultos = Array.from(minhasPorEvento.values()).sort((a, b) =>
    String(a.data).localeCompare(String(b.data))
  )

  const outrosMap = new Map<string, MinhaEscalaRow>()
  for (const row of future) {
    const escalado = toBool(row.is_escalado) || !!row.escala_id
    if (escalado) continue
    if (minhasPorEvento.has(row.id)) continue
    if (!outrosMap.has(row.id)) outrosMap.set(row.id, { ...row, is_escalado: false })
  }
  const outros = Array.from(outrosMap.values())
    .sort((a, b) => String(a.data).localeCompare(String(b.data)))
    .slice(0, 12)

  const proxima = cultos[0]
  const resto = cultos.slice(1)
  const firstName = session.user.name?.split(" ")[0] || "membro"

  return (
    <PullToRefresh>
      <DsPage>
        <DsHero
          kicker="PIB Roraima"
          title={`Olá, ${firstName}`}
          subtitle="Confirme suas escalas e veja quem serve nos próximos cultos."
        />

        <PushNotificationRegister />
        <InboxSection />

        <DsSection primary eyebrow="Seu culto" title="Próxima escala">
          {cultos.length === 0 ? (
            <DsEmpty
              title="Nada escalado ainda"
              description="Quando você for escalado, a confirmação aparece aqui primeiro. Enquanto isso, veja os outros cultos abaixo."
            />
          ) : (
            <EscalaRowV2
              evento={{
                id: proxima.id,
                titulo: proxima.titulo,
                data: proxima.data,
                horario: proxima.horario,
                escala_id: proxima.escala_id,
                minha_funcao: proxima.minha_funcao,
                meu_status: proxima.meu_status,
                ministerio: proxima.ministerio,
                ministerio_id: proxima.ministerio_id,
                icone: proxima.icone,
                is_escalado: true,
                total_escalados: proxima.total_escalados,
              }}
              highlight
            />
          )}
        </DsSection>

        {resto.length > 0 && (
          <DsSection eyebrow="Agenda" title="Depois">
            <div className="space-y-3">
              {resto.map((e) => (
                <EscalaRowV2
                  key={e.id}
                  evento={{
                    id: e.id,
                    titulo: e.titulo,
                    data: e.data,
                    horario: e.horario,
                    escala_id: e.escala_id,
                    minha_funcao: e.minha_funcao,
                    meu_status: e.meu_status,
                    ministerio: e.ministerio,
                    ministerio_id: e.ministerio_id,
                    icone: e.icone,
                    is_escalado: true,
                    total_escalados: e.total_escalados,
                  }}
                />
              ))}
            </div>
          </DsSection>
        )}

        <DsSection
          eyebrow="Trocas e equipe"
          title="Outros cultos"
        >
          {outros.length === 0 ? (
            <DsEmpty
              title="Nenhum outro culto no radar"
              description="Quando houver cultos em que você não está escalado, eles aparecem aqui para você ver a equipe."
            />
          ) : (
            <div className="space-y-3">
              {outros.map((e) => (
                <EscalaRowV2
                  key={e.id}
                  variant="browse"
                  evento={{
                    id: e.id,
                    titulo: e.titulo,
                    data: e.data,
                    horario: e.horario,
                    is_escalado: false,
                    total_escalados: e.total_escalados,
                  }}
                />
              ))}
            </div>
          )}
        </DsSection>
      </DsPage>
    </PullToRefresh>
  )
}
