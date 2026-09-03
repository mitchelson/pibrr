"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import useSWR from "swr"
import { Check, X, Loader2, ArrowLeftRight } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { DsBtn, DsStatus } from "@/components/app-v2/ds"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

/**
 * Ações da minha escala.
 * Job: decidir se sirvo (confirmar/recusar) ou pedir troca se já confirmei.
 */
export function EscalaActionsV2({
  id,
  status,
  ministerioId,
  layout = "row",
}: {
  id: string
  status: string
  ministerioId?: string
  layout?: "row" | "stack"
}) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [showTroca, setShowTroca] = useState(false)

  const update = async (newStatus: string) => {
    setLoading(newStatus)
    try {
      const res = await fetch(`/api/escalas/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast({ title: err.error || "Não foi possível atualizar", variant: "destructive" })
        return
      }
      router.refresh()
    } catch {
      toast({ title: "Erro de rede", variant: "destructive" })
    } finally {
      setLoading(null)
    }
  }

  if (status === "confirmado") {
    return (
      <div className={layout === "stack" ? "flex flex-col gap-2" : "flex flex-wrap items-center gap-2"}>
        <DsStatus tone="ok">
          <Check className="h-3 w-3" /> Confirmado
        </DsStatus>
        {ministerioId && (
          <>
            <DsBtn variant="ghost" size="sm" onClick={() => setShowTroca(true)}>
              <ArrowLeftRight className="h-3.5 w-3.5" /> Pedir troca
            </DsBtn>
            <TrocaDialogV2
              open={showTroca}
              onClose={() => setShowTroca(false)}
              escalaId={id}
              ministerioId={ministerioId}
            />
          </>
        )}
      </div>
    )
  }

  if (status === "recusado") {
    return (
      <div className={layout === "stack" ? "flex flex-col gap-2" : "flex flex-wrap items-center gap-2"}>
        <DsStatus tone="no">
          <X className="h-3 w-3" /> Recusado
        </DsStatus>
        <DsBtn variant="soft" size="sm" disabled={loading !== null} onClick={() => update("confirmado")}>
          {loading === "confirmado" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          Mudar para confirmar
        </DsBtn>
      </div>
    )
  }

  return (
    <div className={layout === "stack" ? "flex flex-col gap-2" : "flex flex-wrap gap-2"}>
      <DsBtn
        className={layout === "stack" ? "w-full" : undefined}
        disabled={loading !== null}
        onClick={() => update("confirmado")}
      >
        {loading === "confirmado" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        Confirmar que vou
      </DsBtn>
      <DsBtn
        variant="ghost"
        className={layout === "stack" ? "w-full" : undefined}
        disabled={loading !== null}
        onClick={() => update("recusado")}
      >
        {loading === "recusado" ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
        Não posso
      </DsBtn>
    </div>
  )
}

function TrocaDialogV2({
  open,
  onClose,
  escalaId,
  ministerioId,
}: {
  open: boolean
  onClose: () => void
  escalaId: string
  ministerioId: string
}) {
  const { data: escalas } = useSWR(open ? `/api/escalas?ministerio_id=${ministerioId}` : null, fetcher)
  const [submitting, setSubmitting] = useState(false)

  const handleTroca = async (escalaDestinoId: string) => {
    setSubmitting(true)
    const res = await fetch("/api/escalas/trocas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        escala_solicitante_id: escalaId,
        escala_destinatario_id: escalaDestinoId,
      }),
    })
    if (res.ok) {
      toast({ title: "Pedido de troca enviado" })
      onClose()
    } else {
      const err = await res.json().catch(() => ({}))
      toast({ title: err.error || "Erro", variant: "destructive" })
    }
    setSubmitting(false)
  }

  if (!open) return null

  const opcoes = (escalas || []).filter((e: any) => e.id !== escalaId)

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
      <button type="button" className="absolute inset-0 bg-black/40" aria-label="Fechar" onClick={onClose} />
      <div className="pib-ds relative z-10 w-full max-w-md rounded-t-[1.25rem] bg-[var(--pib-paper-raised)] p-5 sm:rounded-[1.25rem]">
        <p className="pib-kicker">Troca</p>
        <h3 className="pib-display mt-1 text-2xl">Com quem trocar?</h3>
        <p className="pib-mute mt-1 text-sm">Só pessoas do mesmo ministério, neste culto ou outro.</p>
        <div className="mt-4 max-h-[50vh] space-y-1 overflow-y-auto">
          {opcoes.length === 0 ? (
            <p className="py-6 text-center text-sm text-[var(--pib-mute)]">Ninguém disponível agora</p>
          ) : (
            opcoes.map((e: any) => (
              <button
                key={e.id}
                type="button"
                disabled={submitting}
                onClick={() => handleTroca(e.id)}
                className="pib-row rounded-[var(--pib-radius-sm)] border border-[var(--pib-line)]"
              >
                <div className="pib-row__body">
                  <div className="pib-row__title">{e.user_nome}</div>
                  <div className="pib-row__meta">{e.funcao || "Sem função"}</div>
                </div>
              </button>
            ))
          )}
        </div>
        <DsBtn variant="ghost" className="mt-4 w-full" onClick={onClose}>
          Cancelar
        </DsBtn>
      </div>
    </div>
  )
}
