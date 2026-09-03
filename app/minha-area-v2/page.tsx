import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { sql } from "@/lib/neon"
import { Calendar } from "lucide-react"
import { PullToRefresh } from "@/components/pull-to-refresh"
import { PushNotificationRegister } from "@/components/push-notification-register"
import { EscalaCardV2 } from "./escala-card"
import { InboxSection } from "./inbox-section"

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
      <div className="mx-auto max-w-lg space-y-6 px-4 py-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Escalas</h1>
          <p className="text-sm text-muted-foreground">Olá, {firstName}</p>
        </div>

        <PushNotificationRegister />
        <InboxSection />

        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Minhas escalas
          </h2>
          {minhas.length === 0 ? (
            <div className="py-8 text-center">
              <Calendar className="mx-auto mb-2 h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Nenhuma escala futura</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
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
          )}
        </section>

        {programacao.length > 0 && (
          <details className="rounded-xl border bg-card p-4">
            <summary className="cursor-pointer text-sm font-medium">
              Programação da igreja
            </summary>
            <ul className="mt-3 space-y-2">
              {programacao.map((e: any) => (
                <li key={e.id} className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="truncate">{e.titulo}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {new Date(e.data).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                      timeZone: "UTC",
                    })}
                    {e.horario ? ` · ${e.horario}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </PullToRefresh>
  )
}
