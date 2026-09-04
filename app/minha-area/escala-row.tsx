"use client"

import Link from "next/link"
import { Clock, Users } from "lucide-react"
import { MinistryIcon } from "@/components/ministry-icon"
import { cn } from "@/lib/utils"
import { DsStatus } from "@/components/app-v2/ds"

export type EventoEscalaResumo = {
  id: string
  titulo: string
  data: string
  horario?: string
  escala_id?: string
  minha_funcao?: string
  meu_status?: string
  ministerio?: string
  ministerio_id?: string
  icone?: string
  is_escalado?: boolean
  total_escalados?: number
}

function formatHorario(h: string) {
  return h.replace(/(\d{2}:\d{2})(:\d{2})/, "$1")
}

/**
 * Lista "Hoje": só o essencial para reconhecer o culto.
 * Job: escanear → abrir detalhe. Decisão (confirmar) acontece na página do culto.
 */
export function EscalaRowV2({
  evento,
  highlight,
  variant = "mine",
}: {
  evento: EventoEscalaResumo
  highlight?: boolean
  /** mine = você serve; browse = ver equipe / trocas potenciais */
  variant?: "mine" | "browse"
}) {
  const data = new Date(evento.data)
  const dia = data.toLocaleDateString("pt-BR", { day: "2-digit", timeZone: "UTC" })
  const mes = data.toLocaleDateString("pt-BR", { month: "short", timeZone: "UTC" }).replace(".", "")
  const diaSemana = data
    .toLocaleDateString("pt-BR", { weekday: "short", timeZone: "UTC" })
    .replace(".", "")
  const horario = evento.horario ? formatHorario(evento.horario) : null
  const isPendente = variant === "mine" && evento.meu_status === "pendente"
  const isConfirmado = variant === "mine" && evento.meu_status === "confirmado"
  const isRecusado = variant === "mine" && evento.meu_status === "recusado"
  const total = Number(evento.total_escalados) || 0

  return (
    <Link
      href={`/minha-area/culto/${evento.id}`}
      className={cn(
        "pib-panel flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-black/[0.02]",
        highlight && "ring-1 ring-[var(--pib-ink)]"
      )}
    >
      <div className="pib-hero-date shrink-0">
        <span className="pib-hero-date__day">{dia}</span>
        <span className="pib-hero-date__meta">
          {mes} · {diaSemana}
        </span>
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[0.95rem] font-semibold leading-tight">{evento.titulo}</p>
          {isPendente && <DsStatus tone="pending">Responder</DsStatus>}
          {isConfirmado && <DsStatus tone="ok">Ok</DsStatus>}
          {isRecusado && <DsStatus tone="no">Não</DsStatus>}
          {variant === "browse" && (
            <span className="shrink-0 text-xs font-medium text-[var(--pib-mute)]">Ver equipe</span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--pib-mute)]">
          {horario && (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {horario}
            </span>
          )}
          {variant === "mine" && evento.ministerio && (
            <span className="flex items-center gap-1">
              <MinistryIcon name={evento.icone} ministryName={evento.ministerio} size={14} />
              {evento.ministerio}
              {evento.minha_funcao ? ` · ${evento.minha_funcao}` : ""}
            </span>
          )}
          {variant === "browse" && (
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {total > 0
                ? `${total} pessoa${total !== 1 ? "s" : ""} escalada${total !== 1 ? "s" : ""}`
                : "Abrir para ver quem serve"}
            </span>
          )}
        </div>
        {isPendente && (
          <p className="text-xs font-medium text-[var(--pib-pending)]">Toque para confirmar ou recusar</p>
        )}
        {variant === "browse" && (
          <p className="text-xs text-[var(--pib-mute)]">Útil para achar alguém e pedir troca</p>
        )}
      </div>
    </Link>
  )
}
