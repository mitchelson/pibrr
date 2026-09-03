import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { sql } from "@/lib/db"
import { PullToRefresh } from "@/components/pull-to-refresh"
import { PushNotificationRegister } from "@/components/push-notification-register"
import { EscalaRowV2 } from "./escala-row"
import { InboxSection } from "./inbox-section"
import { DsEmpty, DsHero, DsList, DsPage, DsRow, DsSection } from "@/components/app-v2/ds"
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
  is_escalado?: boolean
}

type EventoRow = {
  id: string
  titulo: string
  data: string
  horario?: string
  tipo?: string
}

/**
 * Hoje — home do membro.
 * Objetivo: o que eu preciso decidir/fazer, e onde eu sirvo em seguida.
 * Lista só resume; detalhe do culto é /culto/[id].
 */
export default async function MinhaAreaV2Page() {
  const session = await auth()
  if (!session) redirect("/login")

  const userId = session.user.id

  let minhas: MinhaEscalaRow[] = []
  let programacao: EventoRow[] = []

  if (isGestaoBffEnabled()) {
    const gestaoSession = await gestaoSessionFromAuth()
    const [minhasRaw, eventosRaw] = await Promise.all([
      ssrGestaoJson<MinhaEscalaRow[]>("/v1/escalas/minhas?only=mine", {
        session: gestaoSession,
      }),
      ssrGestaoJson<EventoRow[]>("/v1/eventos", { public: true }),
    ])
    minhas = (minhasRaw || []).map((row) => ({
      ...row,
      // API uses ministerio_id; page historically used meu_ministerio_id
      ministerio_id: row.ministerio_id,
    }))
    const escaladoIds = new Set(minhas.map((m) => m.id))
    const today = new Date().toISOString().slice(0, 10)
    programacao = (eventosRaw || [])
      .filter((e) => String(e.data).slice(0, 10) >= today && !escaladoIds.has(e.id))
      .sort((a, b) => String(a.data).localeCompare(String(b.data)))
      .slice(0, 8)
  } else {
    minhas = (await sql`
      SELECT e.id, e.titulo, e.data, e.horario,
             es.id as escala_id, es.funcao as minha_funcao, es.status as meu_status,
             es.ministerio_id as ministerio_id,
             m.nome as ministerio, m.icone
      FROM eventos e
      INNER JOIN escalas es ON es.evento_id = e.id AND es.user_id = ${userId}
      INNER JOIN ministerios m ON m.id = es.ministerio_id
      WHERE e.data >= CURRENT_DATE
      ORDER BY e.data ASC
      LIMIT 20
    `) as MinhaEscalaRow[]

    programacao = (await sql`
      SELECT e.id, e.titulo, e.data, e.horario, e.tipo
      FROM eventos e
      WHERE e.data >= CURRENT_DATE
        AND NOT EXISTS (
          SELECT 1 FROM escalas es WHERE es.evento_id = e.id AND es.user_id = ${userId}
        )
      ORDER BY e.data ASC
      LIMIT 8
    `) as EventoRow[]
  }

  // Um card por culto (se o membro tem 2 ministérios no mesmo dia, prioriza pendente)
  const porEvento = new Map<string, MinhaEscalaRow>()
  for (const row of minhas) {
    const existing = porEvento.get(row.id)
    if (!existing) {
      porEvento.set(row.id, row)
      continue
    }
    const rank = (s?: string) => (s === "pendente" ? 0 : s === "confirmado" ? 1 : 2)
    if (rank(row.meu_status) < rank(existing.meu_status)) {
      porEvento.set(row.id, row)
    }
  }
  const cultos = Array.from(porEvento.values())

  const proxima = cultos[0]
  const resto = cultos.slice(1)
  const firstName = session.user.name?.split(" ")[0] || "membro"

  return (
    <PullToRefresh>
      <DsPage>
        <DsHero
          kicker="PIB Roraima"
          title={`Olá, ${firstName}`}
          subtitle="Confirme suas escalas e prepare o próximo culto."
        />

        <PushNotificationRegister />
        <InboxSection />

        <DsSection primary eyebrow="Seu culto" title="Próxima escala">
          {cultos.length === 0 ? (
            <DsEmpty
              title="Nada escalado ainda"
              description="Quando você for escalado, a confirmação aparece aqui primeiro."
            />
          ) : (
            <EscalaRowV2
              evento={{
                id: proxima.id as string,
                titulo: proxima.titulo as string,
                data: proxima.data as string,
                horario: proxima.horario as string | undefined,
                escala_id: proxima.escala_id as string,
                minha_funcao: proxima.minha_funcao as string | undefined,
                meu_status: proxima.meu_status as string | undefined,
                ministerio: proxima.ministerio as string | undefined,
                ministerio_id: proxima.ministerio_id as string | undefined,
                icone: proxima.icone as string | undefined,
              }}
              highlight
            />
          )}
        </DsSection>

        {resto.length > 0 && (
          <DsSection eyebrow="Agenda" title="Depois">
            <div className="space-y-3">
              {resto.map((e: any) => (
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
                  }}
                />
              ))}
            </div>
          </DsSection>
        )}

        {programacao.length > 0 && (
          <DsSection eyebrow="Calendário" title="Na igreja">
            <DsList>
              {programacao.map((e: any) => (
                <DsRow
                  key={e.id}
                  as="div"
                  title={e.titulo}
                  meta={`${new Date(e.data).toLocaleDateString("pt-BR", {
                    weekday: "short",
                    day: "2-digit",
                    month: "short",
                    timeZone: "UTC",
                  })}${e.horario ? ` · ${String(e.horario).slice(0, 5)}` : ""}`}
                  trailing={<span className="pib-mute text-xs">{e.tipo || ""}</span>}
                />
              ))}
            </DsList>
          </DsSection>
        )}
      </DsPage>
    </PullToRefresh>
  )
}
