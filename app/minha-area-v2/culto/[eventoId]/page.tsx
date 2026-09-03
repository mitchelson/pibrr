import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { sql } from "@/lib/neon"
import { ArrowLeft } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MinistryIcon } from "@/components/ministry-icon"
import { UserProfileDialog } from "@/components/user-profile-dialog"
import { DsHero, DsPage, DsPanel, DsSection, DsStatus } from "@/components/app-v2/ds"
import { EscalaActionsV2 } from "@/app/minha-area-v2/escala-actions-v2"
import { RepertoireV2 } from "@/app/minha-area-v2/culto/repertoire-v2"

export const dynamic = "force-dynamic"

function formatHorario(h?: string | null) {
  if (!h) return null
  return h.replace(/(\d{2}:\d{2})(:\d{2})/, "$1")
}

/**
 * Página do culto (detalhe da escala).
 *
 * Objetivo: preparar o membro para servir naquele dia.
 * Ordem: (1) minha decisão (2) quem está comigo (3) repertório se existir.
 * Por quê não sheet: precisa de espaço, refresh após confirmar, e URL compartilhável.
 */
export default async function CultoV2Page({
  params,
}: {
  params: Promise<{ eventoId: string }>
}) {
  const session = await auth()
  if (!session) redirect("/login")

  const { eventoId } = await params
  const userId = session.user.id

  const eventos = await sql`
    SELECT id, titulo, data, horario, observacoes, tipo
    FROM eventos WHERE id = ${eventoId} LIMIT 1
  `
  if (!eventos[0]) notFound()
  const evento = eventos[0]

  const minhasEscalas = await sql`
    SELECT es.id, es.funcao, es.status, es.observacao, es.ministerio_id,
           m.nome as ministerio, m.icone, m.cor
    FROM escalas es
    JOIN ministerios m ON m.id = es.ministerio_id
    WHERE es.evento_id = ${eventoId} AND es.user_id = ${userId}
  `

  if (minhasEscalas.length === 0) {
    redirect("/minha-area-v2")
  }

  const equipe = await sql`
    SELECT u.id as user_id, u.nome, u.foto_url, e.funcao, e.status,
           m.id as ministerio_id, m.nome as ministerio, m.icone, m.cor
    FROM escalas e
    JOIN users u ON u.id = e.user_id
    JOIN ministerios m ON m.id = e.ministerio_id
    WHERE e.evento_id = ${eventoId}
    ORDER BY m.nome, u.nome
  `

  const meusMinisterioIds = new Set(minhasEscalas.map((e: any) => e.ministerio_id as string))
  const comigo = equipe.filter((p: any) => meusMinisterioIds.has(p.ministerio_id))
  const outros = equipe.filter((p: any) => !meusMinisterioIds.has(p.ministerio_id))

  const data = new Date(evento.data)
  const dataLabel = data.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    timeZone: "UTC",
  })
  const horario = formatHorario(evento.horario)

  return (
    <DsPage>
      <Link
        href="/minha-area-v2"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--pib-mute)] hover:text-[var(--pib-ink)]"
      >
        <ArrowLeft className="h-4 w-4" /> Hoje
      </Link>

      <DsHero
        kicker={dataLabel}
        title={evento.titulo as string}
        subtitle={[horario ? `Às ${horario}` : null, evento.tipo].filter(Boolean).join(" · ") || undefined}
      />

      {evento.observacoes && (
        <DsPanel className="p-4">
          <p className="pib-kicker mb-1">Observação do culto</p>
          <p className="text-sm leading-relaxed">{evento.observacoes}</p>
        </DsPanel>
      )}

      <DsSection title="Sua parte">
        <div className="space-y-3">
          {minhasEscalas.map((esc: any) => (
            <DsPanel key={esc.id} className="p-4 space-y-4">
              <div className="flex items-start gap-3">
                <MinistryIcon
                  name={esc.icone}
                  ministryName={esc.ministerio}
                  mono
                  size={28}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{esc.ministerio}</p>
                  <p className="pib-mute text-sm">
                    {esc.funcao || "Sem função definida"}
                    {esc.observacao ? ` · ${esc.observacao}` : ""}
                  </p>
                </div>
                {esc.status === "pendente" && <DsStatus tone="pending">Pendente</DsStatus>}
                {esc.status === "confirmado" && <DsStatus tone="ok">Confirmado</DsStatus>}
                {esc.status === "recusado" && <DsStatus tone="no">Recusado</DsStatus>}
              </div>
              <EscalaActionsV2
                id={esc.id}
                status={esc.status}
                ministerioId={esc.ministerio_id}
                layout="stack"
              />
            </DsPanel>
          ))}
        </div>
      </DsSection>

      <DsSection title="Com você">
        <DsPanel className="pib-list">
          {comigo.length === 0 ? (
            <p className="p-4 text-sm text-[var(--pib-mute)]">Só você neste ministério por enquanto.</p>
          ) : (
            groupByMinisterio(comigo).map(([ministerio, pessoas]) => (
              <div key={ministerio}>
                <p className="px-4 pt-3 pb-1 text-xs font-semibold text-[var(--pib-mute)]">{ministerio}</p>
                {pessoas.map((p: any) => (
                  <PessoaRow key={`${p.user_id}-${p.ministerio_id}`} pessoa={p} highlightMe={p.user_id === userId} />
                ))}
              </div>
            ))
          )}
        </DsPanel>
      </DsSection>

      {outros.length > 0 && (
        <details className="pib-panel">
          <summary className="cursor-pointer list-none p-4 font-semibold">
            Outros ministérios neste culto
            <span className="pib-mute ml-2 text-sm font-normal">({outros.length})</span>
          </summary>
          <div className="border-t border-[var(--pib-line)] pib-list">
            {groupByMinisterio(outros).map(([ministerio, pessoas]) => (
              <div key={ministerio}>
                <p className="px-4 pt-3 pb-1 text-xs font-semibold text-[var(--pib-mute)]">{ministerio}</p>
                {pessoas.map((p: any) => (
                  <PessoaRow key={`${p.user_id}-${p.ministerio_id}`} pessoa={p} />
                ))}
              </div>
            ))}
          </div>
        </details>
      )}

      <RepertoireV2 eventoId={eventoId} />
    </DsPage>
  )
}

function groupByMinisterio(pessoas: any[]) {
  const map = new Map<string, any[]>()
  for (const p of pessoas) {
    const list = map.get(p.ministerio) || []
    list.push(p)
    map.set(p.ministerio, list)
  }
  return Array.from(map.entries())
}

function PessoaRow({ pessoa, highlightMe }: { pessoa: any; highlightMe?: boolean }) {
  const statusTone =
    pessoa.status === "confirmado" ? "ok" : pessoa.status === "recusado" ? "no" : pessoa.status === "pendente" ? "pending" : null

  const row = (
    <div
      className={`flex items-center gap-3 px-4 py-3 ${highlightMe ? "bg-black/[0.03]" : ""}`}
    >
      <Avatar className="h-9 w-9">
        <AvatarImage src={pessoa.foto_url} alt={pessoa.nome} />
        <AvatarFallback>{pessoa.nome?.[0]}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {pessoa.nome}
          {highlightMe ? " (você)" : ""}
        </p>
        <p className="text-xs text-[var(--pib-mute)]">{pessoa.funcao || "Sem função"}</p>
      </div>
      {statusTone && (
        <DsStatus tone={statusTone as "ok" | "no" | "pending"}>
          {pessoa.status === "confirmado" ? "Ok" : pessoa.status === "recusado" ? "Não" : "…"}
        </DsStatus>
      )}
    </div>
  )

  if (!pessoa.user_id) return row
  return <UserProfileDialog userId={pessoa.user_id}>{row}</UserProfileDialog>
}
