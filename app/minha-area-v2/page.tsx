import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { sql } from "@/lib/neon"
import { PullToRefresh } from "@/components/pull-to-refresh"
import { PushNotificationRegister } from "@/components/push-notification-register"
import { EscalaCardV2 } from "./escala-card"
import { InboxSection } from "./inbox-section"
import { DsEmpty, DsHero, DsList, DsPage, DsRow, DsSection } from "@/components/app-v2/ds"

export const dynamic = "force-dynamic"

export default async function MinhaAreaV2Page() {
  const session = await auth()
  if (!session) redirect("/login")

  const userId = session.user.id

  const minhas = await sql`
    SELECT e.id, e.titulo, e.data, e.horario, e.observacoes,
           true as is_escalado,
           es.id as escala_id, es.funcao as minha_funcao, es.status as meu_status,
           es.observacao as minha_observacao, es.ministerio_id as meu_ministerio_id,
           m.nome as ministerio, m.icone, m.cor
    FROM eventos e
    INNER JOIN escalas es ON es.evento_id = e.id AND es.user_id = ${userId}
    INNER JOIN ministerios m ON m.id = es.ministerio_id
    WHERE e.data >= CURRENT_DATE
    ORDER BY e.data ASC
    LIMIT 20
  `

  const programacao = await sql`
    SELECT e.id, e.titulo, e.data, e.horario, e.tipo
    FROM eventos e
    WHERE e.data >= CURRENT_DATE
      AND NOT EXISTS (
        SELECT 1 FROM escalas es WHERE es.evento_id = e.id AND es.user_id = ${userId}
      )
    ORDER BY e.data ASC
    LIMIT 8
  `

  const eventoIds = minhas.map((e: { id: string }) => e.id)
  const colegasPorEvento: Record<string, any[]> = {}
  if (eventoIds.length > 0) {
    const colegasRows = await sql`
      SELECT e.evento_id, u.id as user_id, u.nome, u.foto_url, e.funcao, m.nome as ministerio
      FROM escalas e
      JOIN users u ON u.id = e.user_id
      JOIN ministerios m ON m.id = e.ministerio_id
      WHERE e.evento_id = ANY(${eventoIds})
      ORDER BY m.nome, u.nome
    `
    for (const c of colegasRows) {
      const eid = c.evento_id as string
      if (!colegasPorEvento[eid]) colegasPorEvento[eid] = []
      colegasPorEvento[eid].push({
        user_id: c.user_id,
        nome: c.nome,
        foto_url: c.foto_url,
        funcao: c.funcao,
        ministerio: c.ministerio,
      })
    }
  }

  const proxima = minhas[0]
  const resto = minhas.slice(1)
  const firstName = session.user.name?.split(" ")[0] || "membro"

  return (
    <PullToRefresh>
      <DsPage>
        <DsHero
          kicker="PIB Roraima"
          title={`Olá, ${firstName}`}
          subtitle="O que você precisa fazer neste culto — e o que vem depois."
        />

        <PushNotificationRegister />
        <InboxSection />

        <DsSection title="Sua próxima escala">
          {minhas.length === 0 ? (
            <DsEmpty
              title="Nada escalado ainda"
              description="Quando você for escalado, a confirmação aparece aqui primeiro."
            />
          ) : (
            <div className="space-y-3">
              {proxima && (
                <EscalaCardV2
                  evento={{
                    id: proxima.id,
                    titulo: proxima.titulo,
                    data: proxima.data,
                    horario: proxima.horario,
                    observacoes: proxima.observacoes,
                    is_escalado: true,
                    escala_id: proxima.escala_id,
                    minha_funcao: proxima.minha_funcao,
                    meu_status: proxima.meu_status,
                    ministerio: proxima.ministerio,
                    ministerio_id: proxima.meu_ministerio_id,
                    icone: proxima.icone,
                  }}
                  colegas={colegasPorEvento[proxima.id] || []}
                  userName={firstName}
                  highlight
                />
              )}
            </div>
          )}
        </DsSection>

        {resto.length > 0 && (
          <DsSection title="Depois">
            <div className="space-y-3">
              {resto.map((e: any) => (
                <EscalaCardV2
                  key={e.id}
                  evento={{
                    id: e.id,
                    titulo: e.titulo,
                    data: e.data,
                    horario: e.horario,
                    observacoes: e.observacoes,
                    is_escalado: true,
                    escala_id: e.escala_id,
                    minha_funcao: e.minha_funcao,
                    meu_status: e.meu_status,
                    ministerio: e.ministerio,
                    ministerio_id: e.meu_ministerio_id,
                    icone: e.icone,
                  }}
                  colegas={colegasPorEvento[e.id] || []}
                  userName={firstName}
                />
              ))}
            </div>
          </DsSection>
        )}

        {programacao.length > 0 && (
          <DsSection title="Na igreja">
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
                  })}${e.horario ? ` · ${e.horario}` : ""}`}
                  trailing={<span className="text-xs">{e.tipo || ""}</span>}
                />
              ))}
            </DsList>
          </DsSection>
        )}
      </DsPage>
    </PullToRefresh>
  )
}
