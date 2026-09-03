"use client"

import { Badge } from "@/components/ui/badge"
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
  const diaSemana = data.toLocaleDateString("pt-BR", { weekday: "short", timeZone: "UTC" }).replace(".", "")
  const isPendente = evento.is_escalado && evento.meu_status === "pendente"
  const horarioFormatado = evento.horario ? formatHorario(evento.horario) : null

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          className={cn(
            "w-full rounded-xl border bg-card p-4 text-left transition-colors hover:bg-muted/40",
            isPendente && "border-foreground/30"
          )}
        >
          <div className="flex items-center gap-3">
            <div className="flex min-w-[56px] flex-col items-center justify-center rounded-lg bg-muted px-2 py-2">
              <span className="text-lg font-bold leading-none">{dia}</span>
              <span className="mt-0.5 text-[10px] font-medium uppercase text-muted-foreground">{mes}</span>
              <span className="text-[10px] capitalize text-muted-foreground">{diaSemana}</span>
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold leading-tight">{evento.titulo}</p>
                {highlight && (
                  <Badge variant="secondary" className="shrink-0 text-[10px]">
                    Próxima
                  </Badge>
                )}
                {isPendente && (
                  <Badge variant="outline" className="shrink-0 text-[10px]">
                    Pendente
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
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
                <p className="text-xs text-muted-foreground">
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
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </div>
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{evento.titulo}</SheetTitle>
          <p className="text-sm text-muted-foreground">
            {horarioFormatado || ""}
            {evento.observacoes ? ` · ${evento.observacoes}` : ""}
          </p>
        </SheetHeader>
        <RepertoireSection eventoId={evento.id} />
        <div className="mt-4 border-t pt-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Escalados
          </p>
          <div className="space-y-2">
            {Object.entries(
              colegas.reduce<Record<string, ColegaV2[]>>((acc, c) => {
                ;(acc[c.ministerio] ||= []).push(c)
                return acc
              }, {})
            ).map(([ministerio, membros]) => (
              <Collapsible key={ministerio}>
                <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border p-3 hover:bg-muted/40">
                  <span className="text-sm font-medium">{ministerio}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{membros.length}</span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 space-y-2 pl-1">
                  {membros.map((c, i) => {
                    const row = (
                      <div className="flex items-center gap-3 rounded-lg border p-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={c.foto_url} alt={c.nome} />
                          <AvatarFallback>{c.nome?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{c.nome}</p>
                          <p className="text-xs text-muted-foreground">{c.funcao || "Sem função"}</p>
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
