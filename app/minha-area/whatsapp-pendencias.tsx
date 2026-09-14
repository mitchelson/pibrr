"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import { ArrowLeft, ExternalLink, Loader2, MessageSquare } from "lucide-react"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Checkbox } from "@/components/ui/checkbox"
import { DsBtn, DsList, DsRow, DsStatus } from "@/components/app-v2/ds"
import {
  formatarData,
  formatarTelefone,
  gerarLinkWhatsApp,
  processarTemplateMensagem,
} from "@/lib/utils"
import { toast } from "@/components/ui/use-toast"
import { categoriasAtivasDoPayload } from "@/lib/mensagem-categorias"
import { filtrarPendenciasSemanaCulto } from "@/lib/domingo-culto"
import type { MensagemCategoria, MensagemModelo } from "@/types/supabase"

export type WhatsappPendencia = {
  id: string
  nome: string
  celular: string
  data_cadastro: string
  sexo?: string | null
  cidade?: string | null
  cidade_outra?: string | null
  bairro?: string | null
  faixa_etaria?: string | null
  civil_status?: string | null
  membro_igreja?: boolean | null
  quer_visita?: boolean | null
  enviadas: number
  total_categorias: number
  pendentes: number
}

type Props = {
  pendencias: WhatsappPendencia[]
  onChanged?: () => void
}

type SheetView = "pessoa" | "modelo"

function cidadeLabel(v: WhatsappPendencia) {
  if (v.cidade === "Outra" && v.cidade_outra) return v.cidade_outra
  return v.cidade || null
}

function resumoCadastro(v: WhatsappPendencia): string[] {
  const lines: string[] = []
  if (v.celular) lines.push(formatarTelefone(v.celular))
  if (v.sexo) lines.push(v.sexo)
  if (v.faixa_etaria) lines.push(v.faixa_etaria)
  if (v.civil_status) lines.push(v.civil_status)
  const cidade = cidadeLabel(v)
  if (cidade) lines.push(v.bairro ? `${cidade} · ${v.bairro}` : cidade)
  else if (v.bairro) lines.push(v.bairro)
  if (v.data_cadastro) lines.push(`Cadastro ${formatarData(v.data_cadastro)}`)
  if (v.membro_igreja === true) lines.push("Membro de igreja")
  if (v.membro_igreja === false) lines.push("Não é membro de igreja")
  if (v.quer_visita === true) lines.push("Deseja visita")
  if (v.quer_visita === false) lines.push("Não deseja visita")
  return lines
}

/**
 * Fluxo da home: pessoa → dados do cadastro → categorias → modelo → wa.me
 */
export function WhatsappPendencias({ pendencias, onChanged }: Props) {
  const { data: session } = useSession()
  const responsavelNome =
    session?.user?.name?.split(" ")[0] || session?.user?.name || undefined

  const [categorias, setCategorias] = useState<MensagemCategoria[]>([])
  const [loadingCats, setLoadingCats] = useState(false)
  const [catsError, setCatsError] = useState<string | null>(null)
  const [visitanteSel, setVisitanteSel] = useState<WhatsappPendencia | null>(null)
  const [enviadas, setEnviadas] = useState<Set<string>>(new Set())
  const [catSel, setCatSel] = useState<MensagemCategoria | null>(null)
  const [view, setView] = useState<SheetView>("pessoa")
  const [marcando, setMarcando] = useState<string | null>(null)

  const daSemana = useMemo(
    () => filtrarPendenciasSemanaCulto(pendencias).items,
    [pendencias]
  )

  useEffect(() => {
    let cancelled = false
    setLoadingCats(true)
    setCatsError(null)
    fetch("/api/mensagens/categorias", { credentials: "same-origin" })
      .then(async (r) => {
        const json = await r.json().catch(() => null)
        if (!r.ok) {
          throw new Error(
            (json && typeof json === "object" && "error" in json
              ? String((json as { error?: string }).error)
              : null) || `Erro ${r.status}`
          )
        }
        return categoriasAtivasDoPayload(json)
      })
      .then((ativas) => {
        if (!cancelled) setCategorias(ativas)
      })
      .catch((err) => {
        if (!cancelled) {
          setCategorias([])
          setCatsError(err instanceof Error ? err.message : "Falha ao carregar categorias")
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingCats(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const closeSheet = useCallback(() => {
    setVisitanteSel(null)
    setCatSel(null)
    setView("pessoa")
    setEnviadas(new Set())
  }, [])

  const openVisitante = useCallback(async (v: WhatsappPendencia) => {
    setVisitanteSel(v)
    setCatSel(null)
    setView("pessoa")
    try {
      const res = await fetch(`/api/mensagens/enviadas?visitante_id=${v.id}`, {
        credentials: "same-origin",
      })
      if (res.ok) {
        const data = await res.json()
        const lista = Array.isArray(data) ? data : []
        setEnviadas(new Set(lista.map((e: { categoria_id: string }) => e.categoria_id)))
      } else {
        setEnviadas(new Set())
      }
    } catch {
      setEnviadas(new Set())
    }
  }, [])

  const handleMarcar = async (categoriaId: string, opts?: { silent?: boolean }) => {
    if (!visitanteSel || enviadas.has(categoriaId)) return
    setMarcando(categoriaId)
    try {
      const res = await fetch("/api/mensagens/enviadas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          visitante_id: visitanteSel.id,
          categoria_id: categoriaId,
        }),
      })
      if (!res.ok) throw new Error("Falha ao marcar")
      const next = new Set([...enviadas, categoriaId])
      setEnviadas(next)
      if (!opts?.silent) toast({ title: "Mensagem marcada como enviada" })
      const allDone = categorias.every((c) => next.has(c.id))
      if (allDone) {
        closeSheet()
      } else {
        setView("pessoa")
        setCatSel(null)
      }
      onChanged?.()
    } catch {
      toast({
        variant: "destructive",
        title: "Erro ao marcar",
        description: "Não foi possível registrar o envio.",
      })
    } finally {
      setMarcando(null)
    }
  }

  const handleEnviarModelo = async (modelo: MensagemModelo) => {
    if (!visitanteSel || !catSel) return
    if (!visitanteSel.celular) {
      toast({
        variant: "destructive",
        title: "Sem celular",
        description: "Este visitante não tem WhatsApp cadastrado.",
      })
      return
    }
    const msg = processarTemplateMensagem(modelo.corpo, visitanteSel, responsavelNome)
    window.open(gerarLinkWhatsApp(visitanteSel.celular, msg), "_blank", "noopener,noreferrer")
    if (!enviadas.has(catSel.id)) {
      await handleMarcar(catSel.id, { silent: true })
    } else {
      setView("pessoa")
      setCatSel(null)
    }
  }

  const detalhes = visitanteSel ? resumoCadastro(visitanteSel) : []

  if (daSemana.length === 0) return null

  return (
    <>
      <DsList>
        {daSemana.map((v) => (
          <DsRow
            key={v.id}
            onClick={() => openVisitante(v)}
            leading={<MessageSquare className="h-4 w-4 shrink-0" />}
            title={v.nome}
            meta={`${v.pendentes} mensagem${v.pendentes !== 1 ? "s" : ""} pendente${v.pendentes !== 1 ? "s" : ""}`}
            trailing={<DsStatus tone="pending">Enviar</DsStatus>}
          />
        ))}
      </DsList>

      <Drawer
        open={!!visitanteSel}
        onOpenChange={(open) => {
          if (!open) closeSheet()
        }}
      >
        <DrawerContent>
          {view === "pessoa" && visitanteSel ? (
            <>
              <DrawerHeader>
                <DrawerTitle>{visitanteSel.nome}</DrawerTitle>
                <DrawerDescription>
                  Confira o cadastro e envie as mensagens pendentes
                </DrawerDescription>
              </DrawerHeader>

              <div className="space-y-4 px-4 pb-6">
                <div className="rounded-[var(--pib-radius)] border border-[var(--pib-line)] bg-[var(--pib-paper-raised)] p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--pib-mute)]">
                    Dados do visitante
                  </p>
                  {detalhes.length > 0 ? (
                    <ul className="mt-2 space-y-1">
                      {detalhes.map((line) => (
                        <li key={line} className="text-sm text-[var(--pib-ink)]">
                          {line}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="pib-mute mt-2 text-sm">Sem dados adicionais no cadastro.</p>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold">Mensagens</p>
                  {loadingCats ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="h-5 w-5 animate-spin text-[var(--pib-mute)]" />
                    </div>
                  ) : categorias.length === 0 ? (
                    <p className="pib-mute py-4 text-center text-sm">
                      {catsError
                        ? `Não foi possível carregar as categorias (${catsError}).`
                        : "Nenhuma categoria de mensagem ativa no fluxo."}
                    </p>
                  ) : (
                    categorias.map((cat) => {
                      const sent = enviadas.has(cat.id)
                      const modelos = cat.modelos || []
                      return (
                        <div
                          key={cat.id}
                          className={`flex items-center gap-3 rounded-[var(--pib-radius)] border border-[var(--pib-line)] p-3 ${
                            sent ? "opacity-50" : "bg-[var(--pib-paper-raised)]"
                          }`}
                        >
                          <Checkbox
                            checked={sent}
                            disabled={sent || marcando === cat.id}
                            onCheckedChange={(checked) => {
                              if (checked && !sent) void handleMarcar(cat.id)
                            }}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium">{cat.nome}</p>
                            <p className="pib-mute line-clamp-1 text-xs">
                              {[cat.dia, cat.descricao].filter(Boolean).join(" · ") ||
                                (modelos.length
                                  ? `${modelos.length} modelo${modelos.length !== 1 ? "s" : ""}`
                                  : "Sem modelo")}
                            </p>
                          </div>
                          {!sent && (
                            <DsBtn
                              size="sm"
                              className="shrink-0 gap-1"
                              disabled={!visitanteSel.celular || modelos.length === 0 || !!marcando}
                              onClick={() => {
                                setCatSel(cat)
                                setView("modelo")
                              }}
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
                              Enviar
                            </DsBtn>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </>
          ) : null}

          {view === "modelo" && catSel && visitanteSel ? (
            <>
              <DrawerHeader>
                <div className="flex items-start gap-2">
                  <DsBtn
                    variant="ghost"
                    size="icon"
                    className="mt-0.5 shrink-0"
                    onClick={() => {
                      setView("pessoa")
                      setCatSel(null)
                    }}
                    aria-label="Voltar"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </DsBtn>
                  <div className="min-w-0">
                    <DrawerTitle>{catSel.nome}</DrawerTitle>
                    <DrawerDescription>
                      Escolha um modelo para abrir no WhatsApp de {visitanteSel.nome}
                    </DrawerDescription>
                  </div>
                </div>
              </DrawerHeader>
              <div className="max-h-[60vh] space-y-3 overflow-y-auto px-4 pb-6">
                {(catSel.modelos || []).map((modelo) => {
                  const preview = processarTemplateMensagem(
                    modelo.corpo,
                    visitanteSel,
                    responsavelNome
                  )
                  return (
                    <button
                      key={modelo.id}
                      type="button"
                      onClick={() => void handleEnviarModelo(modelo)}
                      disabled={!!marcando}
                      className="w-full rounded-[var(--pib-radius)] border border-[var(--pib-line)] bg-[var(--pib-paper-raised)] p-4 text-left transition-colors hover:border-[var(--pib-ink)] disabled:opacity-60"
                    >
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold">{modelo.titulo}</span>
                        <ExternalLink className="h-3.5 w-3.5 shrink-0 text-[var(--pib-mute)]" />
                      </div>
                      <p className="pib-mute line-clamp-6 whitespace-pre-wrap text-xs leading-relaxed">
                        {preview}
                      </p>
                      <p className="mt-3 text-xs font-medium text-[var(--pib-ink)]">
                        Abrir WhatsApp
                      </p>
                    </button>
                  )
                })}
                {(catSel.modelos || []).length === 0 ? (
                  <p className="pib-mute py-4 text-center text-sm">
                    Esta categoria ainda não tem modelo cadastrado.
                  </p>
                ) : null}
              </div>
            </>
          ) : null}
        </DrawerContent>
      </Drawer>
    </>
  )
}
