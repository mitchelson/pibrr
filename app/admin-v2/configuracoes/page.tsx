"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { Settings } from "lucide-react"
import { MinistryIcon } from "@/components/ministry-icon"

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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Configurações</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Feed de postagens
          </CardTitle>
          <CardDescription>
            Ministério que pode criar postagens no feed. Membros desse ministério (e administradores) publicam em /feed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Acolhimento
          </CardTitle>
          <CardDescription>
            Ministério que vê Visitantes e Mensagens no painel novo. Administradores sempre veem.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
        </CardContent>
      </Card>
    </div>
  )
}
