"use client"

import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { ClipboardList, Lock } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { MinistryIcon } from "@/components/ministry-icon"

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function AdminFormMinisteriosPage() {
  const { data: respostas, isLoading } = useSWR("/api/form-ministerios/admin", fetcher)
  const { data: ministerios, mutate: mutateMin } = useSWR("/api/ministerios", fetcher)

  const ministerioMap: Record<string, any> = {}
  for (const m of ministerios ?? []) ministerioMap[m.id] = m

  const handleToggleObrigatorio = async (m: any) => {
    const res = await fetch(`/api/ministerios/${m.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ form_obrigatorio: !m.form_obrigatorio }),
    })
    if (res.ok) {
      mutateMin()
      toast({ title: !m.form_obrigatorio ? `${m.nome} marcado como obrigatório` : `${m.nome} removido dos obrigatórios` })
    }
  }

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Carregando...</div>

  const ativos = ministerios?.filter((m: any) => m.ativo) ?? []

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <ClipboardList className="h-6 w-6 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-bold">Interesses em ministérios</h1>
          <p className="text-muted-foreground text-sm">
            {respostas?.length ?? 0} resposta{respostas?.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Configurar obrigatórios */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Lock className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-base font-semibold">Ministérios obrigatórios</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Ministérios marcados como obrigatórios ficam pré-selecionados e não podem ser desmarcados no formulário.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ativos.map((m: any) => (
            <div
              key={m.id}
              className={`flex items-center gap-3 rounded-xl border p-3 transition-colors ${m.form_obrigatorio ? "border-primary/30 bg-primary/5" : "border-gray-200"}`}
            >
              <div
                className="flex items-center justify-center w-9 h-9 rounded-full shrink-0"
                style={{ backgroundColor: m.cor ? `${m.cor}20` : "#f3f4f6" }}
              >
                <MinistryIcon name={m.icone} ministryName={m.nome} color={m.cor} size={22} />
              </div>
              <p className="flex-1 text-sm font-medium truncate">{m.nome}</p>
              <Switch
                checked={!!m.form_obrigatorio}
                onCheckedChange={() => handleToggleObrigatorio(m)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Resumo por ministério */}
      <div>
        <h2 className="text-base font-semibold mb-3">Interesse por ministério</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ativos.map((m: any) => {
            const count = respostas?.filter((r: any) => r.ministerios?.includes(m.id)).length ?? 0
            return (
              <Card key={m.id} className="rounded-xl">
                <CardContent className="p-4 flex items-center gap-3">
                  <div
                    className="flex items-center justify-center w-10 h-10 rounded-full shrink-0"
                    style={{ backgroundColor: m.cor ? `${m.cor}20` : "#f3f4f6" }}
                  >
                    <MinistryIcon name={m.icone} ministryName={m.nome} color={m.cor} size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{m.nome}</p>
                    {m.form_obrigatorio && (
                      <span className="text-[10px] text-primary font-medium">obrigatório</span>
                    )}
                  </div>
                  <Badge variant="secondary" className="shrink-0">{count}</Badge>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Respostas individuais */}
      <div>
        <h2 className="text-base font-semibold mb-3">Respostas individuais</h2>
        {(!respostas || respostas.length === 0) ? (
          <div className="text-center py-12 text-muted-foreground">
            <ClipboardList className="h-10 w-10 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">Nenhuma resposta ainda.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {respostas.map((r: any) => (
              <Card key={r.user_id} className="rounded-xl">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={r.foto_url} />
                      <AvatarFallback>{r.nome?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{r.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(r.updated_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {r.ministerios?.map((minId: string) => {
                      const min = ministerioMap[minId]
                      if (!min) return null
                      return (
                        <span key={minId} className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium border border-gray-200 bg-gray-50">
                          <MinistryIcon name={min.icone} ministryName={min.nome} color={min.cor} size={12} />
                          {min.nome}
                        </span>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
