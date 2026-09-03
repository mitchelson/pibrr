"use client"

import useSWR from "swr"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { ArrowLeftRight, Check, ClipboardList, Loader2, MessageSquare, Users, X } from "lucide-react"
import { useState } from "react"
import { toast } from "@/components/ui/use-toast"
import { DsBtn, DsList, DsPanel, DsRow, DsSection, DsStatus } from "@/components/app-v2/ds"

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
    <DsSection title="Para fazer agora">
      {escalas.length > 0 && (
        <DsPanel className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold">
                <ClipboardList className="h-4 w-4" />
                Confirmar escala
              </p>
              <p className="pib-mute mt-1 text-sm">
                {escalas.length} pendente{escalas.length !== 1 ? "s" : ""}. Abra o culto e confirme se
                você vai servir.
              </p>
              <ul className="mt-3 space-y-1.5">
                {escalas.slice(0, 4).map((e: any) => (
                  <li key={e.id}>
                    <Link
                      href={`/minha-area-v2/culto/${e.evento_id}`}
                      className="text-sm font-medium underline-offset-2 hover:underline"
                    >
                      {e.evento_titulo || e.titulo || "Ver culto"}
                      {e.ministerio ? ` · ${e.ministerio}` : ""}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <DsStatus tone="pending">Pendente</DsStatus>
          </div>
        </DsPanel>
      )}

      {trocas.length > 0 && (
        <DsList>
          {trocas.map((t: any) => {
            const isDestinatario = t.destinatario_id === userId
            const outraPessoa = isDestinatario ? t.solicitante_nome : t.destinatario_nome
            return (
              <div key={t.id} className="p-4">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <ArrowLeftRight className="h-4 w-4" />
                  Troca · {t.ministerio}
                </div>
                <p className="pib-mute mt-1 text-sm">
                  <span className="font-medium text-[var(--pib-ink)]">{outraPessoa}</span>
                  {isDestinatario ? " quer trocar com você" : " — aguardando resposta"}
                </p>
                {isDestinatario && (
                  <div className="mt-3 flex gap-2">
                    <DsBtn
                      size="sm"
                      className="flex-1"
                      disabled={loading === t.id}
                      onClick={() => handleTroca(t.id, "aceita")}
                    >
                      {loading === t.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                      Aceitar
                    </DsBtn>
                    <DsBtn
                      variant="ghost"
                      size="sm"
                      className="flex-1"
                      disabled={loading === t.id}
                      onClick={() => handleTroca(t.id, "recusada")}
                    >
                      <X className="h-3 w-3" /> Recusar
                    </DsBtn>
                  </div>
                )}
              </div>
            )
          })}
        </DsList>
      )}

      {pedidos.length > 0 && (
        <DsList>
          {pedidos.slice(0, 5).map((p: any) => (
            <DsRow
              key={`${p.user_id}-${p.ministerio_id}`}
              href={`/admin-v2/ministerios/${p.ministerio_id}`}
              leading={<Users className="h-4 w-4 shrink-0" />}
              title={`${p.nome} quer servir`}
              meta={p.ministerio}
            />
          ))}
        </DsList>
      )}

      {whatsapp.length > 0 && (
        <DsRow
          href="/admin-v2/visitantes"
          leading={<MessageSquare className="h-4 w-4" />}
          title="WhatsApp pendente"
          meta={`${whatsapp.length} pessoa${whatsapp.length !== 1 ? "s" : ""} novas com mensagem em aberto`}
        />
      )}
    </DsSection>
  )
}
