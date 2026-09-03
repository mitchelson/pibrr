"use client"

import { useState } from "react"
import useSWR from "swr"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Sparkles, ChevronDown, ChevronUp, Search } from "lucide-react"

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
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Sparkles className="h-6 w-6 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-bold">Dons Espirituais</h1>
          <p className="text-muted-foreground text-sm">{respostas?.length ?? 0} resposta{respostas?.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Top dons da igreja */}
      {topGifts.length > 0 && (
        <div>
          <h2 className="text-base font-semibold mb-3">Dons mais presentes na igreja</h2>
          <div className="flex flex-wrap gap-2">
            {topGifts.map(([gift, count], i) => (
              <div key={gift} className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-3 py-2">
                <span className="text-sm font-bold text-green-700">{i + 1}°</span>
                <span className="text-sm font-medium text-green-800">{gift}</span>
                <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">{count}</Badge>
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
          <div className="text-center py-12 text-muted-foreground">
            <Sparkles className="h-10 w-10 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">Nenhuma resposta encontrada.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((r) => {
              const top3 = (r.results ?? []).filter(g => g.rank <= 3).sort((a, b) => a.rank - b.rank)
              const isExpanded = expandedId === r.user_id
              return (
                <Card key={r.user_id} className="rounded-xl">
                  <CardContent className="p-4">
                    <button
                      className="w-full text-left"
                      onClick={() => setExpandedId(isExpanded ? null : r.user_id)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 shrink-0">
                          <AvatarImage src={r.foto_url} />
                          <AvatarFallback>{r.nome?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{r.nome}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {top3.map(g => (
                              <span key={g.gift} className="text-[11px] rounded-full bg-green-100 text-green-700 px-2 py-0.5 font-medium">
                                {g.rank}° {g.gift}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="shrink-0 text-muted-foreground">
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </div>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="mt-4 space-y-1.5 border-t pt-4">
                        {(r.results ?? []).sort((a, b) => a.rank - b.rank).map(g => (
                          <div key={g.gift} className={`flex items-center gap-3 rounded-lg px-3 py-2 ${g.rank <= 3 ? "bg-green-50 border border-green-200" : "bg-gray-50"}`}>
                            <span className={`text-xs font-bold w-5 text-right shrink-0 ${g.rank <= 3 ? "text-green-700" : "text-muted-foreground"}`}>
                              {g.rank}°
                            </span>
                            <p className={`text-sm flex-1 ${g.rank <= 3 ? "font-medium text-green-800" : "text-gray-700"}`}>{g.gift}</p>
                            <span className={`text-xs font-semibold shrink-0 ${g.rank <= 3 ? "text-green-600" : "text-muted-foreground"}`}>{g.score}/12</span>
                          </div>
                        ))}
                        <p className="text-xs text-muted-foreground text-right mt-2">
                          Respondido em {new Date(r.created_at).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
