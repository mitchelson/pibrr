"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { MessageSquare, ExternalLink, Loader2 } from "lucide-react"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Checkbox } from "@/components/ui/checkbox"
import { DsBtn, DsList, DsRow, DsStatus } from "@/components/app-v2/ds"
import { processarTemplateMensagem, gerarLinkWhatsApp } from "@/lib/utils"
import { toast } from "@/components/ui/use-toast"
import { categoriasAtivasDoPayload } from "@/lib/mensagem-categorias"
import { filtrarPendenciasSemanaCulto } from "@/lib/domingo-culto"
import type { MensagemCategoria } from "@/types/supabase"

export type WhatsappPendencia = {
  id: string
  nome: string
  celular: string
  data_cadastro: string
  sexo?: string | null
  enviadas: number
  total_categorias: number
  pendentes: number
}

type Props = {
  pendencias: WhatsappPendencia[]
  onChanged?: () => void
}

/**
 * Fluxo da home: obrigação de WhatsApp → pessoa → categorias → modelo → wa.me
 */
export function WhatsappPendencias({ pendencias, onChanged }: Props) {
  const [categorias, setCategorias] = useState<MensagemCategoria[]>([])
  const [loadingCats, setLoadingCats] = useState(false)
  const [catsError, setCatsError] = useState<string | null>(null)
  const [visitanteSel, setVisitanteSel] = useState<WhatsappPendencia | null>(null)
  const [enviadas, setEnviadas] = useState<Set<string>>(new Set())
  const [catSel, setCatSel] = useState<MensagemCategoria | null>(null)
  const [marcando, setMarcando] = useState<string | null>(null)

  // Cinto de segurança: mesmo se a API ainda devolver semanas antigas, filtra no client.
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

  const openVisitante = useCallback(async (v: WhatsappPendencia) => {
    setVisitanteSel(v)
    setCatSel(null)
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

  const handleEnviar = (cat: MensagemCategoria, modelo: { id: string; corpo: string; titulo: string }) => {
    if (!visitanteSel) return
    const msg = processarTemplateMensagem(modelo.corpo, visitanteSel as any)
    window.open(gerarLinkWhatsApp(visitanteSel.celular, msg), "_blank")
    setCatSel(null)
  }

  const handleMarcar = async (categoriaId: string) => {
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
      toast({ title: "Mensagem marcada como enviada" })
      const allDone = categorias.every((c) => next.has(c.id))
      if (allDone) {
        setVisitanteSel(null)
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
        open={!!visitanteSel && !catSel}
        onOpenChange={(open) => {
          if (!open) setVisitanteSel(null)
        }}
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{visitanteSel?.nome}</DrawerTitle>
            <DrawerDescription>Envie as mensagens pendentes do fluxo ativo</DrawerDescription>
          </DrawerHeader>
          <div className="space-y-2 px-4 pb-6">
            {loadingCats ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-[var(--pib-mute)]" />
              </div>
            ) : categorias.length === 0 ? (
              <p className="pib-mute py-4 text-center text-sm">
                {catsError
                  ? `Não foi possível carregar as categorias (${catsError}).`
                  : "Nenhuma categoria de mensagem ativa no fluxo. Ative em Mensagens no admin."}
              </p>
            ) : (
              categorias.map((cat) => {
                const sent = enviadas.has(cat.id)
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
                        if (checked && !sent) handleMarcar(cat.id)
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{cat.nome}</p>
                      <p className="pib-mute line-clamp-1 text-xs">
                        {[cat.dia, cat.descricao].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    {!sent && (cat.modelos?.length ?? 0) > 0 && (
                      <DsBtn
                        variant="ghost"
                        size="sm"
                        className="shrink-0 gap-1"
                        onClick={() => setCatSel(cat)}
                        disabled={!visitanteSel?.celular}
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
        </DrawerContent>
      </Drawer>

      <Drawer
        open={!!catSel}
        onOpenChange={(open) => {
          if (!open) setCatSel(null)
        }}
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{catSel?.nome}</DrawerTitle>
            <DrawerDescription>Escolha um modelo para enviar via WhatsApp</DrawerDescription>
          </DrawerHeader>
          <div className="max-h-[60vh] space-y-3 overflow-y-auto px-4 pb-6">
            {catSel?.modelos?.map((modelo) => {
              const preview = visitanteSel
                ? processarTemplateMensagem(modelo.corpo, visitanteSel as any)
                : modelo.corpo
              return (
                <button
                  key={modelo.id}
                  type="button"
                  onClick={() => handleEnviar(catSel, modelo)}
                  className="w-full rounded-[var(--pib-radius)] border border-[var(--pib-line)] bg-[var(--pib-paper-raised)] p-4 text-left transition-colors hover:border-[var(--pib-ink)]"
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold">{modelo.titulo}</span>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 text-[var(--pib-mute)]" />
                  </div>
                  <p className="pib-mute line-clamp-6 whitespace-pre-wrap text-xs leading-relaxed">
                    {preview}
                  </p>
                </button>
              )
            })}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  )
}
