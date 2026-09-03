"use client"

import useSWR from "swr"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { Lock } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { MinistryIcon } from "@/components/ministry-icon"
import { AdminScreen } from "@/components/app-v2/admin-screen"
import { DsChip, DsEmpty, DsList, DsRow } from "@/components/app-v2/ds"

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
    <AdminScreen
      kicker="Descobrir"
      title="Quem quer servir"
      subtitle={`${respostas?.length ?? 0} resposta${(respostas?.length ?? 0) !== 1 ? "s" : ""} do formulário`}
    >
      {/* Configurar obrigatórios */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <Lock className="h-4 w-4 text-muted-foreground" />
          <h2 className="pib-section-title">Ministérios obrigatórios</h2>
        </div>
        <p className="pib-mute mb-4 text-sm">
          Marcados ficam pré-selecionados e não podem ser desmarcados no formulário.
        </p>
        <DsList>
          {ativos.map((m: any) => (
            <DsRow
              key={m.id}
              as="div"
              leading={<MinistryIcon mono name={m.icone} ministryName={m.nome} size={22} />}
              title={m.nome}
              meta={m.form_obrigatorio ? "Obrigatório" : undefined}
              trailing={
                <Switch
                  checked={!!m.form_obrigatorio}
                  onCheckedChange={() => handleToggleObrigatorio(m)}
                />
              }
            />
          ))}
        </DsList>
      </div>

      {/* Resumo por ministério */}
      <div>
        <h2 className="text-base font-semibold mb-3">Interesse por ministério</h2>
        <DsList>
          {ativos.map((m: any) => {
            const count = respostas?.filter((r: any) => r.ministerios?.includes(m.id)).length ?? 0
            return (
              <DsRow
                key={m.id}
                as="div"
                leading={<MinistryIcon mono name={m.icone} ministryName={m.nome} size={22} />}
                title={m.nome}
                meta={m.form_obrigatorio ? "Obrigatório" : undefined}
                trailing={<DsChip>{count}</DsChip>}
              />
            )
          })}
        </DsList>
      </div>

      {/* Respostas individuais */}
      <div>
        <h2 className="text-base font-semibold mb-3">Respostas individuais</h2>
        {(!respostas || respostas.length === 0) ? (
          <DsEmpty title="Nenhuma resposta ainda" />
        ) : (
          <DsList>
            {respostas.map((r: any) => (
              <div key={r.user_id} className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={r.foto_url} />
                    <AvatarFallback>{r.nome?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{r.nome}</p>
                    <p className="pib-mute text-xs">
                      {new Date(r.updated_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {r.ministerios?.map((minId: string) => {
                    const min = ministerioMap[minId]
                    if (!min) return null
                    return (
                      <DsChip key={minId}>
                        <MinistryIcon mono name={min.icone} ministryName={min.nome} size={12} />
                        {min.nome}
                      </DsChip>
                    )
                  })}
                </div>
              </div>
            ))}
          </DsList>
        )}
      </div>
    </AdminScreen>
  )
}
