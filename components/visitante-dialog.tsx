"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import {
  formatarData,
  processarTemplateMensagem,
  gerarLinkWhatsApp,
} from "@/lib/utils"
import { toast } from "@/components/ui/use-toast"
import {
  Edit,
  Phone,
  CheckCircle2,
  Circle,
  MessageSquare,
  Loader2,
  ExternalLink,
  Trash2,
} from "lucide-react"
import type {
  Visitante,
  Responsavel,
  MensagemCategoria,
  VisitanteMensagemEnviada,
} from "@/types/supabase"
import NovoVisitanteDialog from "./novo-visitante-dialog"

interface VisitanteDialogProps {
  visitante: Visitante & { responsavel_nome?: string | null }
  onClose: () => void
  onUpdate: (visitante: Visitante) => void
  onDelete?: (id: string) => void
}

export default function VisitanteDialog({
  visitante,
  onClose,
  onUpdate,
  onDelete,
}: VisitanteDialogProps) {
  const [responsaveis, setResponsaveis] = useState<Responsavel[]>([])
  const [responsavelSelecionado, setResponsavelSelecionado] = useState<
    string | null
  >(visitante.user_id || visitante.responsavel_id || null)
  const [nomeResponsavel, setNomeResponsavel] = useState<string>(
    visitante.responsavel_nome || "",
  )
  const [semWhatsapp, setSemWhatsapp] = useState<boolean>(
    visitante.sem_whatsapp || false,
  )
  const [salvando, setSalvando] = useState(false)
  const [carregandoResponsaveis, setCarregandoResponsaveis] = useState(true)
  const [editandoCadastro, setEditandoCadastro] = useState(false)

  // Dynamic message categories
  const [categorias, setCategorias] = useState<MensagemCategoria[]>([])
  const [enviadas, setEnviadas] = useState<VisitanteMensagemEnviada[]>([])
  const [loadingCategorias, setLoadingCategorias] = useState(true)
  const [mensagensParaMarcar, setMensagensParaMarcar] = useState<Set<string>>(
    new Set(),
  )

  // Drawer state for model selection
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [categoriaSelecionada, setCategoriaSelecionada] =
    useState<MensagemCategoria | null>(null)

  // State for unmark confirmation modal
  const [categoriaParaDesmarcar, setCategoriaParaDesmarcar] =
    useState<MensagemCategoria | null>(null)
  const [desmarcando, setDesmarcando] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deletando, setDeletando] = useState(false)

  const fetchCategorias = useCallback(async () => {
    try {
      setLoadingCategorias(true)
      const [catRes, envRes] = await Promise.all([
        fetch("/api/mensagens/categorias"),
        fetch(`/api/mensagens/enviadas?visitante_id=${visitante.id}`),
      ])
      if (catRes.ok) {
        const data = await catRes.json()
        // Only show active categories
        setCategorias(data.filter((c: MensagemCategoria) => c.ativa))
      }
      if (envRes.ok) {
        setEnviadas(await envRes.json())
      }
    } catch (err) {
      console.error("Erro ao buscar categorias:", err)
    } finally {
      setLoadingCategorias(false)
    }
  }, [visitante.id])

  useEffect(() => {
    const carregarResponsaveis = async () => {
      setCarregandoResponsaveis(true)
      try {
        const res = await fetch("/api/responsaveis")
        if (!res.ok) throw new Error("Erro ao carregar responsaveis")
        setResponsaveis(await res.json())
      } catch (error) {
        console.error("Erro ao carregar responsaveis:", error)
      } finally {
        setCarregandoResponsaveis(false)
      }
    }

    carregarResponsaveis()
    fetchCategorias()
  }, [fetchCategorias])

  useEffect(() => {
    if (responsavelSelecionado) {
      const resp = responsaveis.find((r) => r.id === responsavelSelecionado)
      if (resp) setNomeResponsavel(resp.nome)
    } else {
      setNomeResponsavel("")
    }
  }, [responsavelSelecionado, responsaveis])

  const isCategoriaEnviada = (categoriaId: string) => {
    return enviadas.some((e) => e.categoria_id === categoriaId)
  }

  const handleSalvar = async () => {
    setSalvando(true)
    try {
      // First, mark checked messages as sent
      for (const categoriaId of mensagensParaMarcar) {
        if (!isCategoriaEnviada(categoriaId)) {
          const res = await fetch("/api/mensagens/enviadas", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              visitante_id: visitante.id,
              categoria_id: categoriaId,
            }),
          })
          if (res.ok) {
            const novaEnviada = await res.json()
            setEnviadas((prev) => [...prev, novaEnviada])
          }
        }
      }
      setMensagensParaMarcar(new Set())

      // Then update visitor info
      const res = await fetch(`/api/visitantes/${visitante.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          responsavel_id: responsavelSelecionado,
          sem_whatsapp: semWhatsapp,
        }),
      })

      if (!res.ok) throw new Error("Erro ao atualizar visitante")

      const visitanteAtualizado: Visitante = {
        ...visitante,
        user_id: responsavelSelecionado,
        responsavel_id: responsavelSelecionado,
        sem_whatsapp: semWhatsapp,
      }

      onUpdate(visitanteAtualizado)
      toast({
        title: "Visitante atualizado",
        description: "As informacoes foram salvas com sucesso.",
      })
    } catch (error) {
      console.error("Erro ao atualizar visitante:", error)
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao atualizar o visitante.",
      })
    } finally {
      setSalvando(false)
    }
  }

  const handleAbrirModelos = (cat: MensagemCategoria) => {
    setCategoriaSelecionada(cat)
    setDrawerOpen(true)
  }

  const handleEnviarModelo = async (
    cat: MensagemCategoria,
    modeloCorpo: string,
  ) => {
    // Process template with visitor data
    const mensagemProcessada = processarTemplateMensagem(
      modeloCorpo,
      visitante,
      nomeResponsavel || undefined,
    )

    // Open WhatsApp link
    const link = gerarLinkWhatsApp(visitante.celular, mensagemProcessada)
    window.open(link, "_blank")

    // Close drawer
    setDrawerOpen(false)
    setCategoriaSelecionada(null)
  }

  const handleEdicaoCadastro = (visitanteAtualizado: Visitante) => {
    onUpdate(visitanteAtualizado)
    setEditandoCadastro(false)
  }

  const handleDesmarcarMensagem = async () => {
    if (!categoriaParaDesmarcar) return

    setDesmarcando(true)
    try {
      const res = await fetch(
        `/api/mensagens/enviadas?visitante_id=${visitante.id}&categoria_id=${categoriaParaDesmarcar.id}`,
        { method: "DELETE" }
      )

      if (!res.ok) throw new Error("Erro ao desmarcar mensagem")

      setEnviadas((prev) =>
        prev.filter((e) => e.categoria_id !== categoriaParaDesmarcar.id)
      )

      toast({
        title: "Mensagem desmarcada",
        description: `A mensagem "${categoriaParaDesmarcar.nome}" foi desmarcada como enviada.`,
      })
    } catch (error) {
      console.error("Erro ao desmarcar mensagem:", error)
      toast({
        variant: "destructive",
        title: "Erro ao desmarcar",
        description: "Ocorreu um erro ao desmarcar a mensagem.",
      })
    } finally {
      setDesmarcando(false)
      setCategoriaParaDesmarcar(null)
    }
  }

  // Build summary text
  const cidadeDisplay =
    visitante.cidade === "Outra" && visitante.cidade_outra
      ? visitante.cidade_outra
      : visitante.cidade || "cidade nao informada"

  const membroText = visitante.membro_igreja
    ? "e membro de igreja"
    : "nao e membro de igreja"

  const visitaText = visitante.quer_visita
    ? "deseja receber visita"
    : "nao deseja receber visita"

  const resumo = [
    visitante.nome,
    visitante.faixa_etaria,
    visitante.civil_status ? `${visitante.civil_status}(a)` : null,
    `mora em ${cidadeDisplay}`,
    membroText,
    visitaText,
  ]
    .filter(Boolean)
    .join(", ")

  const totalCategorias = categorias.length
  const totalEnviadas = categorias.filter((c) =>
    isCategoriaEnviada(c.id),
  ).length

  return (
    <>
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              Detalhes do Visitante
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditandoCadastro(true)}
                  className="h-8 w-8 p-0"
                >
                  <Edit className="h-4 w-4" />
                  <span className="sr-only">Editar visitante</span>
                </Button>
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmDelete(true)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Excluir visitante</span>
                  </Button>
                )}
              </div>
            </DialogTitle>
            <DialogDescription>
              Cadastrado em {formatarData(visitante.data_cadastro)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Resumo compacto */}
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-sm leading-relaxed line-clamp-3">{resumo}.</p>
              <div className="flex items-center gap-1.5 mt-2 text-sm font-medium">
                <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="truncate">{visitante.celular}</span>
              </div>
            </div>

            <Separator />

            {/* Responsavel */}
            <div className="space-y-2">
              <Label htmlFor="responsavel">Responsavel</Label>
              {carregandoResponsaveis ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">
                    Carregando...
                  </span>
                </div>
              ) : (
                <Select
                  value={responsavelSelecionado || "none"}
                  onValueChange={(value) =>
                    setResponsavelSelecionado(
                      value === "none" ? null : value,
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um responsavel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {responsaveis.map((r: any) => (
                      <SelectItem key={r.id} value={r.id}>
                        <span className="flex items-center gap-2">
                          {r.foto_url ? (
                            <img src={r.foto_url} alt="" className="h-5 w-5 rounded-full object-cover" />
                          ) : (
                            <span className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium">{r.nome?.[0]}</span>
                          )}
                          {r.nome}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Sem WhatsApp */}
            <div className="flex items-center justify-between">
              <Label htmlFor="sem-whatsapp">Sem WhatsApp</Label>
              <div className="flex items-center gap-2">
                <Switch
                  id="sem-whatsapp"
                  checked={semWhatsapp}
                  onCheckedChange={setSemWhatsapp}
                />
                <span className="text-sm text-muted-foreground w-8">
                  {semWhatsapp ? "Sim" : "Nao"}
                </span>
              </div>
            </div>

            {!semWhatsapp && <Separator />}

            {/* Dynamic message categories - hidden if sem whatsapp */}
            {!semWhatsapp && (
              <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Mensagens</Label>
                {totalCategorias > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {totalEnviadas}/{totalCategorias} enviadas
                  </span>
                )}
              </div>

              {loadingCategorias ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              ) : categorias.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-3">
                  Nenhuma categoria de mensagem ativa
                </p>
              ) : (
                <div className="space-y-2 max-h-[35vh] overflow-y-auto pr-2">
                  {categorias.map((cat) => {
                    const enviada = isCategoriaEnviada(cat.id)
                    const marcada = mensagensParaMarcar.has(cat.id)
                    return (
                      <div
                        key={cat.id}
                        className={`flex items-center gap-3 rounded-lg border p-3 transition-all ${
                          enviada || marcada
                            ? "bg-primary/5 border-primary/20 opacity-60"
                            : "bg-card"
                        }`}
                      >
                        <Checkbox
                          checked={enviada || marcada}
                          onCheckedChange={(checked) => {
                            if (enviada && !checked) {
                              // If message was already sent and user unchecks, show confirmation
                              setCategoriaParaDesmarcar(cat)
                            } else if (checked) {
                              setMensagensParaMarcar((prev) => {
                                const novo = new Set(prev)
                                novo.add(cat.id)
                                return novo
                              })
                            } else {
                              setMensagensParaMarcar((prev) => {
                                const novo = new Set(prev)
                                novo.delete(cat.id)
                                return novo
                              })
                            }
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{cat.nome}</p>
                          {(cat.dia || cat.descricao) && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {[cat.dia, cat.descricao].filter(Boolean).join(" · ")}
                            </p>
                          )}
                        </div>
                        {!enviada && !marcada && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-8 gap-1.5 whitespace-nowrap shrink-0"
                            onClick={() => handleAbrirModelos(cat)}
                            disabled={
                              !visitante.celular || cat.modelos.length === 0
                            }
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                            Enviar
                          </Button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            )}
          </div>

          <DialogFooter className="flex-col-reverse sm:flex-row gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button
              onClick={handleSalvar}
              disabled={salvando}
              className="w-full sm:w-auto"
            >
              {salvando ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>

          {editandoCadastro && (
            <NovoVisitanteDialog
              visitanteParaEdicao={visitante}
              onClose={() => setEditandoCadastro(false)}
              onSave={handleEdicaoCadastro}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Drawer for model selection */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>
              {categoriaSelecionada?.nome ?? "Escolher modelo"}
            </DrawerTitle>
            <DrawerDescription>
              Escolha um modelo de mensagem para enviar via WhatsApp
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-6 space-y-3 max-h-[60vh] overflow-y-auto">
            {categoriaSelecionada?.modelos.map((modelo) => {
              const preview = processarTemplateMensagem(
                modelo.corpo,
                visitante,
                nomeResponsavel || undefined,
              )
              return (
                <button
                  key={modelo.id}
                  onClick={() =>
                    handleEnviarModelo(categoriaSelecionada, modelo.corpo)
                  }
                  className="w-full text-left rounded-lg border bg-card p-4 hover:border-primary/50 hover:bg-primary/5 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-foreground">
                      {modelo.titulo}
                    </span>
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed line-clamp-6">
                    {preview}
                  </p>
                </button>
              )
            })}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Confirmation modal for unmarking message */}
      <AlertDialog
        open={!!categoriaParaDesmarcar}
        onOpenChange={(open) => !open && setCategoriaParaDesmarcar(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desmarcar mensagem enviada?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja desmarcar a mensagem{" "}
              <strong>{categoriaParaDesmarcar?.nome}</strong> como enviada? Isso
              permitira enviar a mensagem novamente para este visitante.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={desmarcando}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDesmarcarMensagem}
              disabled={desmarcando}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {desmarcando ? "Desmarcando..." : "Desmarcar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmation modal for deleting visitor */}
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir visitante?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{visitante.nome}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={deletando}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                setDeletando(true)
                try {
                  const res = await fetch(`/api/visitantes/${visitante.id}`, { method: "DELETE" })
                  if (res.ok) {
                    toast({ title: "Visitante excluído" })
                    onDelete?.(visitante.id)
                    onClose()
                  } else {
                    toast({ title: "Erro ao excluir", variant: "destructive" })
                  }
                } catch {
                  toast({ title: "Erro ao excluir", variant: "destructive" })
                } finally {
                  setDeletando(false)
                  setConfirmDelete(false)
                }
              }}
            >
              {deletando ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
