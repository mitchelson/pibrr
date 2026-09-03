"use client"

import { useEffect, useState, useCallback } from "react"
import { useVisitantes } from "@/hooks/use-visitantes"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatarData } from "@/lib/utils"
import { Search, Plus, FileText, MessageSquare, ChevronRight } from "lucide-react"
import useSWR from "swr"
import VisitanteDialog from "@/components/visitante-dialog"
import NovoVisitanteDialog from "@/components/novo-visitante-dialog"
import RelatorioMensalDialog from "@/components/relatorio-mensal-dialog"
import type { Visitante, VisitanteComResponsavel } from "@/types/supabase"
import { AdminScreen, AdminPrimaryAction } from "@/components/app-v2/admin-screen"
import { DsBtn, DsEmpty, DsList, DsRow, DsWell } from "@/components/app-v2/ds"

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
    <AdminScreen
      kicker="Cuidar"
      title="Pessoas novas"
      subtitle="Cadastro e follow-up de quem visitou a igreja"
      action={
        <div className="flex items-center gap-2">
          <DsBtn variant="ghost" size="icon" href="/admin/mensagens" title="Mensagens">
            <MessageSquare className="h-4 w-4" />
          </DsBtn>
          <DsBtn variant="ghost" size="icon" onClick={() => setRelatorioAberto(true)} title="Relatório">
            <FileText className="h-4 w-4" />
          </DsBtn>
          <AdminPrimaryAction onClick={() => setNovoAberto(true)}>
            <Plus className="h-4 w-4" /> Novo
          </AdminPrimaryAction>
        </div>
      }
    >
      <DsWell className="!items-stretch sm:!items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--pib-mute)]" />
          <Input
            placeholder="Buscar por nome, telefone ou responsável"
            className="border-0 bg-[var(--pib-paper-raised)] pl-9 shadow-none"
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
          />
        </div>
        {datasAgrupadas.length > 1 && (
          <Select value={dataSelecionada} onValueChange={setDataSelecionada}>
            <SelectTrigger className="w-full border-0 bg-[var(--pib-paper-raised)] shadow-none sm:w-44">
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
      </DsWell>

      {isLoading ? (
        <p className="pib-mute py-8 text-center text-sm">Carregando…</p>
      ) : lista.length === 0 && datasAgrupadas.length === 0 ? (
        <DsEmpty
          title={termoBusca ? "Nenhum visitante nesta busca" : "Nenhum visitante cadastrado"}
          description={!termoBusca ? "Cadastre a primeira visita da igreja." : undefined}
        />
      ) : (
        <div className="space-y-4">
          <DsList>
            {lista.map((visitante) => {
              const enviadas = mensagensEnviadas[visitante.id] || new Set()
              return (
                <DsRow
                  key={visitante.id}
                  onClick={() => setVisitanteSelecionado(visitante)}
                  title={visitante.nome}
                  meta={
                    visitante.responsavel_nome
                      ? `${visitante.celular} · ${visitante.responsavel_nome}`
                      : visitante.celular
                  }
                  trailing={
                    <div className="flex items-center gap-2">
                      {!visitante.sem_whatsapp && categoriasAtivas.length > 0 && (
                        <div className="flex gap-1">
                          {categoriasAtivas.map((cat: { id: string; nome: string }) => (
                            <span
                              key={cat.id}
                              title={cat.nome}
                              className={`h-1.5 w-1.5 rounded-full ${
                                enviadas.has(cat.id) ? "bg-[var(--pib-ink)]" : "bg-[var(--pib-line-strong)]"
                              }`}
                            />
                          ))}
                        </div>
                      )}
                      <ChevronRight className="h-4 w-4 text-[var(--pib-mute-soft)]" />
                    </div>
                  }
                />
              )
            })}
          </DsList>
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
    </AdminScreen>
  )
}
