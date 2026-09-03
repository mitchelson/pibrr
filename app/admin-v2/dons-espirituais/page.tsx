"use client"

import { useState } from "react"
import useSWR from "swr"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { ChevronDown, ChevronUp, Search } from "lucide-react"
import { AdminScreen } from "@/components/app-v2/admin-screen"
import { DsChip, DsEmpty, DsList, DsRow } from "@/components/app-v2/ds"

const fetcher = (url: string) => fetch(url).then(r => r.json())

type GiftResult = { gift: string; score: number; rank: number }
type Resposta = { user_id: string; nome: string; foto_url: string; created_at: string; results: GiftResult[] }

export default function AdminDonsEspirituaisPage() {
  const { data: respostas, isLoading } = useSWR<Resposta[]>("/api/dons-espirituais/admin", fetcher)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Carregando...</div>

  const filtered = (respostas ?? []).filter(r =>
    r.nome.toLowerCase().includes(search.toLowerCase())
  )

  // Ranking agregado: para cada don, soma quantas pessoas têm ele no top 3
  const giftCount: Record<string, number> = {}
  for (const r of respostas ?? []) {
    for (const g of r.results ?? []) {
      if (g.rank <= 3) {
        giftCount[g.gift] = (giftCount[g.gift] ?? 0) + 1
      }
    }
  }
  const topGifts = Object.entries(giftCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  return (
    <AdminScreen
      kicker="Descobrir"
      title="Dons"
      subtitle={`${respostas?.length ?? 0} resposta${(respostas?.length ?? 0) !== 1 ? "s" : ""} do teste`}
    >
      {/* Top dons da igreja */}
      {topGifts.length > 0 && (
        <div>
          <h2 className="pib-section-title mb-3">Mais presentes na igreja</h2>
          <div className="flex flex-wrap gap-2">
            {topGifts.map(([gift, count], i) => (
              <div key={gift} className="pib-panel flex items-center gap-2 px-3 py-2">
                <span className="pib-kicker">{i + 1}°</span>
                <span className="text-sm font-medium">{gift}</span>
                <DsChip>{count}</DsChip>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista de respostas */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <DsEmpty title="Nenhuma resposta encontrada" />
        ) : (
          <DsList>
            {filtered.map((r) => {
              const top3 = (r.results ?? []).filter(g => g.rank <= 3).sort((a, b) => a.rank - b.rank)
              const isExpanded = expandedId === r.user_id
              return (
                <div key={r.user_id}>
                  <DsRow
                    as="button"
                    onClick={() => setExpandedId(isExpanded ? null : r.user_id)}
                    leading={
                      <Avatar className="h-9 w-9 shrink-0">
                        <AvatarImage src={r.foto_url} />
                        <AvatarFallback>{r.nome?.[0]}</AvatarFallback>
                      </Avatar>
                    }
                    title={r.nome}
                    meta={
                      <span className="flex flex-wrap gap-1 mt-0.5">
                        {top3.map(g => (
                          <DsChip key={g.gift}>{g.rank}° {g.gift}</DsChip>
                        ))}
                      </span>
                    }
                    trailing={isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  />

                  {isExpanded && (
                    <div className="space-y-1.5 border-t border-[var(--pib-line)] p-4">
                      {(r.results ?? []).sort((a, b) => a.rank - b.rank).map(g => (
                        <div key={g.gift} className="flex items-center gap-3 rounded-lg px-3 py-2 bg-[var(--pib-paper)]">
                          <span className="pib-mute w-5 shrink-0 text-right text-xs font-bold">{g.rank}°</span>
                          <p className={`flex-1 text-sm ${g.rank <= 3 ? "font-medium" : "pib-mute"}`}>{g.gift}</p>
                          <span className="pib-mute shrink-0 text-xs font-semibold">{g.score}/12</span>
                        </div>
                      ))}
                      <p className="pib-mute mt-2 text-right text-xs">
                        Respondido em {new Date(r.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </DsList>
        )}
      </div>
    </AdminScreen>
  )
}
