"use client"

import { useEffect, useState, useCallback } from "react"
import { useVisitantes } from "@/hooks/use-visitantes"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatarData } from "@/lib/utils"
import { Search, Plus, FileText, MessageSquare } from "lucide-react"
import Link from "next/link"
import useSWR from "swr"
import VisitanteDialog from "@/components/visitante-dialog"
import NovoVisitanteDialog from "@/components/novo-visitante-dialog"
import RelatorioMensalDialog from "@/components/relatorio-mensal-dialog"
import type { Visitante, VisitanteComResponsavel } from "@/types/supabase"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function VisitantesV2Page() {
  const { visitantes, isLoading, mutate } = useVisitantes()
  const { data: categorias } = useSWR("/api/mensagens/categorias", fetcher)
  const [termoBusca, setTermoBusca] = useState("")
  const [visitanteSelecionado, setVisitanteSelecionado] = useState<VisitanteComResponsavel | null>(null)
  const [novoAberto, setNovoAberto] = useState(false)
  const [relatorioAberto, setRelatorioAberto] = useState(false)
  const [dataSelecionada, setDataSelecionada] = useState("")
  const [visitantesPorData, setVisitantesPorData] = useState<Record<string, VisitanteComResponsavel[]>>({})
  const [datasAgrupadas, setDatasAgrupadas] = useState<string[]>([])
  const [mensagensEnviadas, setMensagensEnviadas] = useState<Record<string, Set<string>>>({})

  const categoriasAtivas = (categorias || []).filter((c: any) => c.ativa)

  const agruparPorData = useCallback((lista: VisitanteComResponsavel[]) => {
    const grupos: Record<string, VisitanteComResponsavel[]> = {}
    lista.forEach((visitante) => {
      const dataFormatada = formatarData(visitante.data_cadastro)
      if (!grupos[dataFormatada]) grupos[dataFormatada] = []
      grupos[dataFormatada].push(visitante)
    })
    const datas = Object.keys(grupos).sort((a, b) => {
      const [diaA, mesA, anoA] = a.split("/").map(Number)
      const [diaB, mesB, anoB] = b.split("/").map(Number)
      return new Date(anoB, mesB - 1, diaB).getTime() - new Date(anoA, mesA - 1, diaA).getTime()
    })
    setVisitantesPorData(grupos)
    setDatasAgrupadas(datas)
    if (datas[0] && !dataSelecionada) setDataSelecionada(datas[0])
  }, [dataSelecionada])

  useEffect(() => {
    if (isLoading) return
    const termo = termoBusca.toLowerCase().trim()
    const listaBase = Array.isArray(visitantes) ? visitantes : []
    const filtrados = !termo
      ? listaBase
      : listaBase.filter(
          (v) =>
            v.nome.toLowerCase().includes(termo) ||
            v.celular.includes(termo) ||
            v.responsavel_nome?.toLowerCase().includes(termo)
        )
    agruparPorData(filtrados)
  }, [termoBusca, visitantes, isLoading, agruparPorData])

  useEffect(() => {
    fetch("/api/visitantes/mensagens-status")
      .then((r) => (r.ok ? r.json() : {}))
      .then((dados: Record<string, string[]>) => {
        const mapa: Record<string, Set<string>> = {}
        for (const [id, cats] of Object.entries(dados)) mapa[id] = new Set(cats)
        setMensagensEnviadas(mapa)
      })
      .catch(() => {})
  }, [visitantes])

  const lista = dataSelecionada ? visitantesPorData[dataSelecionada] || [] : []

  return (
    <div className="space-y-6 px-4 py-5 md:px-0 md:py-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="pib-kicker">Cuidar</p>
          <h1 className="pib-display text-3xl">Pessoas novas</h1>
          <p className="pib-mute mt-1 text-sm">Cadastro e follow-up de quem visitou a igreja</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin-v2/mensagens">
              <MessageSquare className="mr-1 h-4 w-4" />
              Mensagens
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={() => setRelatorioAberto(true)}>
            <FileText className="mr-1 h-4 w-4" />
            Relatório
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, telefone ou responsável"
          className="pl-8"
          value={termoBusca}
          onChange={(e) => setTermoBusca(e.target.value)}
        />
      </div>

      {isLoading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Carregando…</p>
      ) : lista.length === 0 && datasAgrupadas.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {termoBusca ? "Nenhum visitante nesta busca." : "Nenhum visitante cadastrado."}
        </p>
      ) : (
        <div className="space-y-4">
          {datasAgrupadas.length > 1 && (
            <Select value={dataSelecionada} onValueChange={setDataSelecionada}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Data" />
              </SelectTrigger>
              <SelectContent>
                {datasAgrupadas.map((data) => (
                  <SelectItem key={data} value={data}>
                    {data}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <div className="space-y-2">
            {lista.map((visitante) => {
              const enviadas = mensagensEnviadas[visitante.id] || new Set()
              return (
                <button
                  key={visitante.id}
                  className="flex w-full items-center justify-between gap-3 rounded-xl border bg-card p-3 text-left hover:bg-muted/40"
                  onClick={() => setVisitanteSelecionado(visitante)}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{visitante.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {visitante.celular}
                      {visitante.responsavel_nome ? ` · ${visitante.responsavel_nome}` : ""}
                    </p>
                  </div>
                  {!visitante.sem_whatsapp && categoriasAtivas.length > 0 && (
                    <div className="flex shrink-0 gap-1">
                      {categoriasAtivas.map((cat: { id: string; nome: string }) => (
                        <span
                          key={cat.id}
                          title={cat.nome}
                          className={`h-2 w-2 rounded-full ${enviadas.has(cat.id) ? "bg-foreground" : "bg-muted-foreground/30"}`}
                        />
                      ))}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {visitanteSelecionado && (
        <VisitanteDialog
          visitante={visitanteSelecionado}
          onClose={() => setVisitanteSelecionado(null)}
          onUpdate={async (_v: Visitante) => {
            await mutate()
            setVisitanteSelecionado(null)
          }}
          onDelete={() => {
            mutate()
            setVisitanteSelecionado(null)
          }}
        />
      )}

      {novoAberto && (
        <NovoVisitanteDialog
          onClose={() => setNovoAberto(false)}
          onSave={() => {
            mutate()
            setNovoAberto(false)
          }}
        />
      )}

      <RelatorioMensalDialog
        isOpen={relatorioAberto}
        onClose={() => setRelatorioAberto(false)}
        visitantes={visitantes}
      />

      <button
        onClick={() => setNovoAberto(true)}
        className="fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg md:bottom-6 md:right-6"
        aria-label="Novo visitante"
      >
        <Plus className="h-6 w-6" />
      </button>
    </div>
  )
}
