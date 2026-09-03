"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { MinistryIcon } from "@/components/ministry-icon"
import { DsHero, DsPage, DsPanel, DsSection } from "@/components/app-v2/ds"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function ConfiguracoesV2Page() {
  const { data: session } = useSession()
  const router = useRouter()
  const { data: ministerios } = useSWR("/api/ministerios", fetcher)
  const { data: config, mutate } = useSWR("/api/config", fetcher)
  const [feedMinisterioId, setFeedMinisterioId] = useState("")
  const [acolhimentoMinisterioId, setAcolhimentoMinisterioId] = useState("")
  const [saving, setSaving] = useState("")

  useEffect(() => {
    if (config?.feed_ministerio_id) setFeedMinisterioId(config.feed_ministerio_id)
    if (config?.acolhimento_ministerio_id) setAcolhimentoMinisterioId(config.acolhimento_ministerio_id)
  }, [config])

  if (session?.user?.role !== "admin") {
    router.push("/admin-v2")
    return null
  }

  const saveKey = async (chave: string, valor: string, flag: string, okMsg: string) => {
    setSaving(flag)
    try {
      await fetch("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chave, valor }),
      })
      mutate()
      toast({ title: okMsg })
    } catch {
      toast({ title: "Erro ao salvar", variant: "destructive" })
    } finally {
      setSaving("")
    }
  }

  const ativos = ministerios?.filter((m: any) => m.ativo) ?? []

  return (
    <DsPage wide>
      <DsHero
        kicker="Ajustes"
        title="Configuração"
        subtitle="Quem publica no feed e quem cuida de pessoas novas."
      />

      <DsSection title="Feed">
      <DsPanel className="p-5 space-y-4">
          <p className="pib-mute text-sm">
            Ministério que pode criar postagens. Membros desse ministério (e administradores) publicam em Comunidade.
          </p>
          <Select value={feedMinisterioId} onValueChange={setFeedMinisterioId}>
            <SelectTrigger className="w-full max-w-sm">
              <SelectValue placeholder="Selecione um ministério" />
            </SelectTrigger>
            <SelectContent>
              {ativos.map((m: any) => (
                <SelectItem key={m.id} value={m.id}>
                  <span className="inline-flex items-center gap-2">
                    <MinistryIcon name={m.icone} ministryName={m.nome} color={m.cor} size={16} />
                    {m.nome}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={() => saveKey("feed_ministerio_id", feedMinisterioId, "feed", "Ministério do feed salvo")}
            disabled={!!saving || !feedMinisterioId}
          >
            {saving === "feed" ? "Salvando..." : "Salvar"}
          </Button>
      </DsPanel>
      </DsSection>

      <DsSection title="Cuidar">
      <DsPanel className="p-5 space-y-4">
          <p className="pib-mute text-sm">
            Ministério que vê Pessoas novas e Mensagens. Administradores sempre veem.
          </p>
          <Select value={acolhimentoMinisterioId} onValueChange={setAcolhimentoMinisterioId}>
            <SelectTrigger className="w-full max-w-sm">
              <SelectValue placeholder="Selecione um ministério" />
            </SelectTrigger>
            <SelectContent>
              {ativos.map((m: any) => (
                <SelectItem key={m.id} value={m.id}>
                  <span className="inline-flex items-center gap-2">
                    <MinistryIcon name={m.icone} ministryName={m.nome} color={m.cor} size={16} />
                    {m.nome}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button
              onClick={() =>
                saveKey("acolhimento_ministerio_id", acolhimentoMinisterioId, "acolhimento", "Ministério de acolhimento salvo")
              }
              disabled={!!saving || !acolhimentoMinisterioId}
            >
              {saving === "acolhimento" ? "Salvando..." : "Salvar"}
            </Button>
            {acolhimentoMinisterioId && (
              <Button
                variant="outline"
                disabled={!!saving}
                onClick={() => {
                  setAcolhimentoMinisterioId("")
                  saveKey("acolhimento_ministerio_id", "", "acolhimento", "Acolhimento restrito a administradores")
                }}
              >
                Remover
              </Button>
            )}
          </div>
      </DsPanel>
      </DsSection>
    </DsPage>
  )
}
