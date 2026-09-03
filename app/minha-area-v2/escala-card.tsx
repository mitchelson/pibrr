"use client"

import { Clock, ChevronRight, ChevronDown } from "lucide-react"
import { MinistryIcon } from "@/components/ministry-icon"
import { EscalaActions } from "@/app/minha-area/escala-actions"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { RepertoireSection } from "@/app/minha-area/repertoire-section"
import { UserProfileDialog } from "@/components/user-profile-dialog"
import { cn } from "@/lib/utils"
import { DsStatus } from "@/components/app-v2/ds"

export type ColegaV2 = {
  user_id?: string
  nome: string
  foto_url?: string
  funcao?: string
  ministerio: string
}

export type EventoEscalaV2 = {
  id: string
  titulo: string
  data: string
  horario?: string
  observacoes?: string
  is_escalado: boolean
  escala_id?: string
  minha_funcao?: string
  meu_status?: string
  ministerio?: string
  ministerio_id?: string
  icone?: string
}

function formatHorario(h: string) {
  return h.replace(/(\d{2}:\d{2})(:\d{2})/, "$1")
}

export function EscalaCardV2({
  evento,
  colegas,
  userName,
  highlight,
}: {
  evento: EventoEscalaV2
  colegas: ColegaV2[]
  userName?: string
  highlight?: boolean
}) {
  const data = new Date(evento.data)
  const dia = data.toLocaleDateString("pt-BR", { day: "2-digit", timeZone: "UTC" })
  const mes = data.toLocaleDateString("pt-BR", { month: "short", timeZone: "UTC" }).replace(".", "")
  const diaSemana = data
    .toLocaleDateString("pt-BR", { weekday: "short", timeZone: "UTC" })
    .replace(".", "")
  const isPendente = evento.is_escalado && evento.meu_status === "pendente"
  const isConfirmado = evento.meu_status === "confirmado"
  const isRecusado = evento.meu_status === "recusado"
  const horarioFormatado = evento.horario ? formatHorario(evento.horario) : null

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          className={cn(
            "pib-panel w-full p-4 text-left transition-colors hover:bg-black/[0.02]",
            highlight && "ring-1 ring-[var(--pib-ink)]"
          )}
        >
          <div className="flex items-center gap-3">
            <div className="pib-hero-date">
              <span className="pib-hero-date__day">{dia}</span>
              <span className="pib-hero-date__meta">
                {mes} · {diaSemana}
              </span>
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[0.95rem] font-semibold leading-tight">{evento.titulo}</p>
                {isPendente && <DsStatus tone="pending">Pendente</DsStatus>}
                {isConfirmado && <DsStatus tone="ok">Confirmado</DsStatus>}
                {isRecusado && <DsStatus tone="no">Recusado</DsStatus>}
                {highlight && !isPendente && !isConfirmado && !isRecusado && (
                  <DsStatus tone="neutral">Próxima</DsStatus>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--pib-mute)]">
                {horarioFormatado && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {horarioFormatado}
                  </span>
                )}
                {evento.ministerio && (
                  <span className="flex items-center gap-1">
                    <MinistryIcon name={evento.icone} ministryName={evento.ministerio} size={14} />
                    {evento.ministerio}
                  </span>
                )}
              </div>
              {evento.minha_funcao && (
                <p className="text-xs text-[var(--pib-mute)]">
                  {userName ? `${userName} · ` : ""}
                  {evento.minha_funcao}
                </p>
              )}
              {evento.escala_id && (
                <div className="mt-1" onClick={(e) => e.stopPropagation()}>
                  <EscalaActions
                    id={evento.escala_id}
                    status={evento.meu_status || ""}
                    ministerioId={evento.ministerio_id}
                  />
                </div>
              )}
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-[var(--pib-mute)]" />
          </div>
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto pib-ds">
        <SheetHeader>
          <SheetTitle className="pib-display text-2xl">{evento.titulo}</SheetTitle>
          <p className="pib-mute text-sm">
            {horarioFormatado || ""}
            {evento.observacoes ? ` · ${evento.observacoes}` : ""}
          </p>
        </SheetHeader>
        <RepertoireSection eventoId={evento.id} />
        <div className="mt-4 border-t border-[var(--pib-line)] pt-4">
          <p className="pib-kicker mb-3">Escalados</p>
          <div className="space-y-2">
            {Object.entries(
              colegas.reduce<Record<string, ColegaV2[]>>((acc, c) => {
                ;(acc[c.ministerio] ||= []).push(c)
                return acc
              }, {})
            ).map(([ministerio, membros]) => (
              <Collapsible key={ministerio}>
                <CollapsibleTrigger className="pib-row rounded-[var(--pib-radius-sm)] border border-[var(--pib-line)]">
                  <span className="pib-row__title flex-1 text-left">{ministerio}</span>
                  <span className="pib-row__meta mr-2">{membros.length}</span>
                  <ChevronDown className="h-4 w-4 text-[var(--pib-mute)]" />
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 space-y-2 pl-1">
                  {membros.map((c, i) => {
                    const row = (
                      <div className="flex items-center gap-3 rounded-[var(--pib-radius-sm)] border border-[var(--pib-line)] bg-white p-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={c.foto_url} alt={c.nome} />
                          <AvatarFallback>{c.nome?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{c.nome}</p>
                          <p className="text-xs text-[var(--pib-mute)]">{c.funcao || "Sem função"}</p>
                        </div>
                      </div>
                    )
                    return c.user_id ? (
                      <UserProfileDialog key={i} userId={c.user_id}>
                        {row}
                      </UserProfileDialog>
                    ) : (
                      <div key={i}>{row}</div>
                    )
                  })}
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
