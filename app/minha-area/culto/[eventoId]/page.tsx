import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { sql } from "@/lib/db"
import { ArrowLeft, Clock } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MinistryIcon } from "@/components/ministry-icon"
import { UserProfileDialog } from "@/components/user-profile-dialog"
import {
  DsEmpty,
  DsPage,
  DsPanel,
  DsSection,
  DsStatus,
} from "@/components/app-v2/ds"
import { EscalaActionsV2 } from "@/app/minha-area/escala-actions-v2"
import { RepertoireV2 } from "@/app/minha-area/culto/repertoire-v2"

export const dynamic = "force-dynamic"

function formatHorario(h?: string | null) {
  if (!h) return null
  return h.replace(/(\d{2}:\d{2})(:\d{2})/, "$1")
}

/**
 * Página do culto — preparar o membro para servir.
 * Ordem: (1) decidir (2) time (3) repertório.
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
    redirect("/minha-area")
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
  const dia = data.toLocaleDateString("pt-BR", { day: "2-digit", timeZone: "UTC" })
  const mes = data
    .toLocaleDateString("pt-BR", { month: "short", timeZone: "UTC" })
    .replace(".", "")
  const diaSemana = data
    .toLocaleDateString("pt-BR", { weekday: "short", timeZone: "UTC" })
    .replace(".", "")
  const dataLonga = data.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    timeZone: "UTC",
  })
  const horario = formatHorario(evento.horario)

  const temPendente = minhasEscalas.some((e: any) => e.status === "pendente")
  const todasConfirmadas = minhasEscalas.every((e: any) => e.status === "confirmado")
  const algumaRecusada = minhasEscalas.some((e: any) => e.status === "recusado")

  const okCount = comigo.filter((p: any) => p.status === "confirmado").length
  const pendCount = comigo.filter((p: any) => p.status === "pendente").length
  const noCount = comigo.filter((p: any) => p.status === "recusado").length

  const teamPreview = comigo.filter((p: any) => p.user_id !== userId).slice(0, 5)

  return (
    <DsPage>
      <Link
        href="/minha-area"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--pib-mute)] transition-colors hover:text-[var(--pib-ink)]"
      >
        <ArrowLeft className="h-4 w-4" /> Hoje
      </Link>

      <header className="pib-rise flex items-start gap-4">
        <div className="pib-hero-date shrink-0 !min-w-[4.25rem] !py-3">
          <span className="pib-hero-date__day !text-2xl">{dia}</span>
          <span className="pib-hero-date__meta">
            {mes} · {diaSemana}
          </span>
        </div>
        <div className="min-w-0 flex-1 space-y-2 pt-0.5">
          <p className="pib-kicker">{evento.tipo || "Culto"}</p>
          <h1 className="pib-title text-3xl tracking-[-0.02em] sm:text-[2.125rem]">
            {evento.titulo as string}
          </h1>
          <p className="pib-mute flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <span className="capitalize">{dataLonga}</span>
            {horario ? (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {horario}
              </span>
            ) : null}
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {minhasEscalas.map((esc: any) => (
              <span
                key={esc.id}
                className="inline-flex items-center gap-1.5 rounded-[var(--pib-radius-sm)] border border-[var(--pib-line)] bg-[var(--pib-paper-raised)] px-2.5 py-1 text-xs font-medium"
              >
                <MinistryIcon name={esc.icone} ministryName={esc.ministerio} mono size={14} />
                {esc.ministerio}
                {esc.funcao ? ` · ${esc.funcao}` : ""}
              </span>
            ))}
          </div>
        </div>
      </header>

      {evento.observacoes ? (
        <DsPanel className="p-4">
          <p className="pib-step-label">Observação</p>
          <p className="mt-2 text-sm leading-relaxed">{evento.observacoes as string}</p>
        </DsPanel>
      ) : null}

      <DsSection
        priority={temPendente}
        primary={!temPendente}
        eyebrow={temPendente ? "Ação necessária" : "Sua escala"}
        title={
          temPendente
            ? minhasEscalas.length > 1
              ? "Confirme suas escalas"
              : "Você vai servir?"
            : todasConfirmadas
              ? "Você confirmou"
              : algumaRecusada
                ? "Sua resposta"
                : "Sua parte"
        }
      >
        <div className="space-y-3">
          {minhasEscalas.map((esc: any) => (
            <div
              key={esc.id}
              className={
                temPendente
                  ? "rounded-[var(--pib-radius-sm)] border border-[var(--pib-line)] bg-[var(--pib-paper)] p-4 space-y-4"
                  : "pib-panel space-y-4 p-4"
              }
            >
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--pib-radius)] border border-[var(--pib-line)] bg-[var(--pib-paper-raised)]">
                  <MinistryIcon name={esc.icone} ministryName={esc.ministerio} mono size={22} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold leading-tight">{esc.ministerio}</p>
                  <p className="pib-mute mt-1 text-sm">
                    {esc.funcao || "Sem função definida"}
                    {esc.observacao ? ` · ${esc.observacao}` : ""}
                  </p>
                </div>
                {esc.status === "pendente" && <DsStatus tone="pending">Responder</DsStatus>}
                {esc.status === "confirmado" && <DsStatus tone="ok">Ok</DsStatus>}
                {esc.status === "recusado" && <DsStatus tone="no">Não</DsStatus>}
              </div>
              <EscalaActionsV2
                id={esc.id}
                status={esc.status}
                ministerioId={esc.ministerio_id}
                layout="stack"
                compactStatus
              />
            </div>
          ))}
        </div>
      </DsSection>

      <DsSection
        eyebrow="Equipe"
        title="Com você"
        action={
          comigo.length > 0 ? (
            <span className="pib-mute text-xs tabular-nums">
              {okCount} ok
              {pendCount > 0 ? ` · ${pendCount} pend.` : ""}
              {noCount > 0 ? ` · ${noCount} não` : ""}
            </span>
          ) : null
        }
      >
        {comigo.length === 0 ? (
          <DsEmpty title="Só você neste ministério" description="Quando outras pessoas forem escaladas, elas aparecem aqui." />
        ) : (
          <DsPanel>
            {teamPreview.length > 0 && (
              <div className="flex items-center gap-3 border-b border-[var(--pib-line)] px-4 py-3">
                <div className="flex -space-x-2">
                  {teamPreview.map((p: any) => (
                    <Avatar
                      key={p.user_id}
                      className="h-8 w-8 border-2 border-[var(--pib-paper-raised)]"
                    >
                      <AvatarImage src={p.foto_url} alt={p.nome} />
                      <AvatarFallback className="text-[10px]">{p.nome?.[0]}</AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                <p className="pib-mute text-sm">
                  {comigo.length === 1
                    ? "Só você na escala deste ministério"
                    : `${comigo.length} pessoa${comigo.length !== 1 ? "s" : ""} no seu time`}
                </p>
              </div>
            )}
            <div className="pib-list">
              {groupByMinisterio(comigo).map(([ministerio, pessoas]) => (
                <div key={ministerio}>
                  {groupByMinisterio(comigo).length > 1 || minhasEscalas.length > 1 ? (
                    <p className="pib-step-label px-4 pt-3 pb-1">{ministerio}</p>
                  ) : null}
                  {pessoas.map((p: any) => (
                    <PessoaRow
                      key={`${p.user_id}-${p.ministerio_id}`}
                      pessoa={p}
                      highlightMe={p.user_id === userId}
                    />
                  ))}
                </div>
              ))}
            </div>
          </DsPanel>
        )}
      </DsSection>

      {outros.length > 0 && (
        <details className="pib-panel group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4">
            <div>
              <p className="pib-step-label">Neste culto</p>
              <p className="pib-section-title mt-1">Outros ministérios</p>
            </div>
            <span className="pib-mute text-sm tabular-nums">{outros.length}</span>
          </summary>
          <div className="border-t border-[var(--pib-line)] pib-list">
            {groupByMinisterio(outros).map(([ministerio, pessoas]) => (
              <div key={ministerio}>
                <p className="pib-step-label px-4 pt-3 pb-1">{ministerio}</p>
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
    pessoa.status === "confirmado"
      ? "ok"
      : pessoa.status === "recusado"
        ? "no"
        : pessoa.status === "pendente"
          ? "pending"
          : null

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
          {highlightMe ? " · você" : ""}
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
