"use client"

import { Button } from "@/components/ui/button"
import { Check, X, Loader2, ArrowLeftRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import useSWR from "swr"
import { toast } from "@/components/ui/use-toast"

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function EscalaActions({ id, status, ministerioId }: { id: string; status: string; ministerioId?: string }) {
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
        toast({
          title: err.error || "Não foi possível atualizar a escala",
          variant: "destructive",
        })
        return
      }
      router.refresh()
    } catch {
      toast({ title: "Erro de rede ao atualizar a escala", variant: "destructive" })
    } finally {
      setLoading(null)
    }
  }

  if (status === "confirmado")
    return (
      <div className="flex gap-2">
        <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100 text-xs font-medium px-3 py-1.5">
          <Check className="h-3.5 w-3.5 mr-1" />Confirmado
        </Badge>
        {ministerioId && (
          <>
            <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={() => setShowTroca(true)}>
              <ArrowLeftRight className="h-3.5 w-3.5" /> Trocar
            </Button>
            <TrocaDialog open={showTroca} onClose={() => setShowTroca(false)} escalaId={id} ministerioId={ministerioId} />
          </>
        )}
      </div>
    )

  if (status === "recusado")
    return (
      <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100 text-xs font-medium px-3 py-1.5">
        <X className="h-3.5 w-3.5 mr-1" />Recusado
      </Badge>
    )

  return (
    <div className="flex gap-2">
      <Button
        size="icon"
        disabled={loading !== null}
        onClick={() => update("confirmado")}
        className="h-10 w-10 rounded-full bg-green-600 hover:bg-green-700 text-white shadow-sm"
      >
        {loading === "confirmado" ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
        <span className="sr-only">Confirmar</span>
      </Button>
      <Button
        size="icon"
        disabled={loading !== null}
        onClick={() => update("recusado")}
        className="h-10 w-10 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-sm"
      >
        {loading === "recusado" ? <Loader2 className="h-5 w-5 animate-spin" /> : <X className="h-5 w-5" />}
        <span className="sr-only">Recusar</span>
      </Button>
    </div>
  )
}

function TrocaDialog({ open, onClose, escalaId, ministerioId }: { open: boolean; onClose: () => void; escalaId: string; ministerioId: string }) {
  const { data: escalas } = useSWR(open ? `/api/escalas?ministerio_id=${ministerioId}` : null, fetcher)
  const [submitting, setSubmitting] = useState(false)

  const handleTroca = async (escalaDestinoId: string) => {
    setSubmitting(true)
    const res = await fetch("/api/escalas/trocas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ escala_solicitante_id: escalaId, escala_destinatario_id: escalaDestinoId }),
    })
    if (res.ok) {
      toast({ title: "Solicitação de troca enviada!" })
      onClose()
    } else {
      const err = await res.json()
      toast({ title: err.error || "Erro", variant: "destructive" })
    }
    setSubmitting(false)
  }

  // Filtrar escalas de outros membros (não a minha)
  const opcoes = escalas?.filter((e: any) => e.id !== escalaId) || []

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm max-h-[70vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Solicitar Troca</DialogTitle>
          <p className="text-sm text-gray-500">Selecione a escala com quem deseja trocar</p>
        </DialogHeader>
        {opcoes.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Nenhuma escala disponível para troca</p>
        ) : (
          <div className="space-y-2">
            {opcoes.map((e: any) => (
              <button
                key={e.id}
                disabled={submitting}
                onClick={() => handleTroca(e.id)}
                className="w-full text-left border rounded-lg p-3 hover:bg-gray-50 transition-colors"
              >
                <p className="text-sm font-medium">{e.user_nome}</p>
                <p className="text-xs text-gray-500">{e.funcao || "Sem função"}</p>
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
