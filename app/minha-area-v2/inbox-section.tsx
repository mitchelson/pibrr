"use client"

import useSWR from "swr"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { ArrowLeftRight, Check, ClipboardList, Loader2, MessageSquare, Users, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { toast } from "@/components/ui/use-toast"
import { MinistryIcon } from "@/components/ministry-icon"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function InboxSection() {
  const { data: session } = useSession()
  const { data, mutate } = useSWR("/api/users/me/inbox", fetcher)
  const [loading, setLoading] = useState<string | null>(null)
  const userId = session?.user?.id

  if (!data) return null

  const escalas = data.escalasPendentes || []
  const trocas = data.trocas || []
  const pedidos = data.pedidosMinisterio || []
  const whatsapp = data.whatsappPendentes || []

  const handleTroca = async (id: string, status: "aceita" | "recusada") => {
    setLoading(id)
    const res = await fetch(`/api/escalas/trocas/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      toast({ title: status === "aceita" ? "Troca aceita" : "Troca recusada" })
      mutate()
    } else {
      const err = await res.json().catch(() => ({}))
      toast({ title: err.error || "Erro", variant: "destructive" })
    }
    setLoading(null)
  }

  const hasInbox = escalas.length > 0 || trocas.length > 0 || pedidos.length > 0 || whatsapp.length > 0
  if (!hasInbox) return null

  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Para fazer</h2>

      {escalas.length > 0 && (
        <div className="rounded-xl border bg-card p-4">
          <p className="mb-2 flex items-center gap-2 text-sm font-medium">
            <ClipboardList className="h-4 w-4" />
            Confirmar escalas ({escalas.length})
          </p>
          <p className="text-xs text-muted-foreground">
            Use os botões em Minhas escalas abaixo para confirmar ou recusar.
          </p>
        </div>
      )}

      {trocas.length > 0 && (
        <div className="space-y-2 rounded-xl border bg-card p-4">
          <p className="flex items-center gap-2 text-sm font-medium">
            <ArrowLeftRight className="h-4 w-4" />
            Trocas
          </p>
          {trocas.map((t: any) => {
            const isDestinatario = t.destinatario_id === userId
            const outraPessoa = isDestinatario ? t.solicitante_nome : t.destinatario_nome
            return (
              <div key={t.id} className="space-y-2 border-t pt-3 first:border-0 first:pt-0">
                <div className="flex items-center gap-2">
                  <MinistryIcon name={t.ministerio_icone} ministryName={t.ministerio} size={16} />
                  <p className="text-sm">{t.ministerio}</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{outraPessoa}</span>
                  {isDestinatario ? " quer trocar com você" : " — aguardando resposta"}
                </p>
                {isDestinatario && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="h-8 flex-1 text-xs"
                      disabled={loading === t.id}
                      onClick={() => handleTroca(t.id, "aceita")}
                    >
                      {loading === t.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                      Aceitar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 flex-1 text-xs"
                      disabled={loading === t.id}
                      onClick={() => handleTroca(t.id, "recusada")}
                    >
                      <X className="h-3 w-3" /> Recusar
                    </Button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {pedidos.length > 0 && (
        <div className="rounded-xl border bg-card p-4">
          <p className="mb-2 flex items-center gap-2 text-sm font-medium">
            <Users className="h-4 w-4" />
            Pedidos de ministério ({pedidos.length})
          </p>
          <ul className="space-y-1 text-sm">
            {pedidos.slice(0, 5).map((p: any) => (
              <li key={`${p.user_id}-${p.ministerio_id}`}>
                <Link href={`/admin-v2/ministerios/${p.ministerio_id}`} className="hover:underline">
                  {p.nome} · {p.ministerio}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {whatsapp.length > 0 && (
        <Link
          href="/admin-v2/visitantes"
          className="block rounded-xl border bg-card p-4 transition-colors hover:bg-muted/40"
        >
          <p className="flex items-center gap-2 text-sm font-medium">
            <MessageSquare className="h-4 w-4" />
            WhatsApp pendente
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {whatsapp.length} visitante{whatsapp.length !== 1 ? "s" : ""} com mensagens em aberto
          </p>
        </Link>
      )}
    </section>
  )
}
