"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
  Plus,
  Pencil,
  Trash2,
  ArrowLeft,
  GripVertical,
  Loader2,
} from "lucide-react"
import type { MensagemCategoria, MensagemModelo } from "@/types/supabase"
import { AdminScreen } from "@/components/app-v2/admin-screen"
import { DsBtn, DsChip, DsEmpty, DsPanel } from "@/components/app-v2/ds"

export default function MensagensPage() {
  const router = useRouter()

  const [categorias, setCategorias] = useState<MensagemCategoria[]>([])
  const [loading, setLoading] = useState(true)

  // Category dialogs
  const [catDialogOpen, setCatDialogOpen] = useState(false)
  const [editingCat, setEditingCat] = useState<MensagemCategoria | null>(null)
  const [catNome, setCatNome] = useState("")
  const [catDescricao, setCatDescricao] = useState("")
  const [catDia, setCatDia] = useState("")
  const [catSaving, setCatSaving] = useState(false)

  // Model dialogs
  const [modelDialogOpen, setModelDialogOpen] = useState(false)
  const [editingModel, setEditingModel] = useState<MensagemModelo | null>(null)
  const [modelCategoriaId, setModelCategoriaId] = useState<string | null>(null)
  const [modelTitulo, setModelTitulo] = useState("")
  const [modelCorpo, setModelCorpo] = useState("")
  const [modelSaving, setModelSaving] = useState(false)

  // Delete dialogs
  const [deleteCatId, setDeleteCatId] = useState<string | null>(null)
  const [deleteModelId, setDeleteModelId] = useState<string | null>(null)

  const fetchCategorias = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/mensagens/categorias")
      if (res.ok) {
        const data = await res.json()
        setCategorias(data)
      }
    } catch (err) {
      console.error("Erro ao buscar categorias:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCategorias()
  }, [fetchCategorias])

  // Toggle category active
  const toggleCategoriaAtiva = async (cat: MensagemCategoria) => {
    try {
      const res = await fetch(`/api/mensagens/categorias/${cat.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ativa: !cat.ativa }),
      })
      if (res.ok) {
        setCategorias((prev) =>
          prev.map((c) => (c.id === cat.id ? { ...c, ativa: !c.ativa } : c)),
        )
      }
    } catch (err) {
      console.error("Erro ao alterar status:", err)
    }
  }

  // Save category (create or edit)
  const saveCategoria = async () => {
    if (!catNome.trim()) return
    setCatSaving(true)
    try {
      if (editingCat) {
        const res = await fetch(`/api/mensagens/categorias/${editingCat.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nome: catNome.trim(),
            descricao: catDescricao.trim() || null,
          }),
        })
        if (res.ok) await fetchCategorias()
      } else {
        const res = await fetch("/api/mensagens/categorias", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nome: catNome.trim(),
            dia: catDia.trim(),
            descricao: catDescricao.trim() || null,
          }),
        })
        if (res.ok) await fetchCategorias()
      }
      setCatDialogOpen(false)
      setEditingCat(null)
      setCatNome("")
      setCatDia("")
      setCatDescricao("")
    } catch (err) {
      console.error("Erro ao salvar categoria:", err)
    } finally {
      setCatSaving(false)
    }
  }

  // Delete category
  const deleteCategoria = async () => {
    if (!deleteCatId) return
    try {
      await fetch(`/api/mensagens/categorias/${deleteCatId}`, {
        method: "DELETE",
      })
      await fetchCategorias()
    } catch (err) {
      console.error("Erro ao deletar categoria:", err)
    }
    setDeleteCatId(null)
  }

  // Save model (create or edit)
  const saveModelo = async () => {
    if (!modelTitulo.trim() || !modelCorpo.trim()) return
    setModelSaving(true)
    try {
      if (editingModel) {
        const res = await fetch(`/api/mensagens/modelos/${editingModel.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            titulo: modelTitulo.trim(),
            corpo: modelCorpo.trim(),
          }),
        })
        if (res.ok) await fetchCategorias()
      } else {
        const res = await fetch("/api/mensagens/modelos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            categoria_id: modelCategoriaId,
            titulo: modelTitulo.trim(),
            corpo: modelCorpo.trim(),
          }),
        })
        if (res.ok) await fetchCategorias()
      }
      setModelDialogOpen(false)
      setEditingModel(null)
      setModelCategoriaId(null)
      setModelTitulo("")
      setModelCorpo("")
    } catch (err) {
      console.error("Erro ao salvar modelo:", err)
    } finally {
      setModelSaving(false)
    }
  }

  // Delete model
  const deleteModelo = async () => {
    if (!deleteModelId) return
    try {
      await fetch(`/api/mensagens/modelos/${deleteModelId}`, {
        method: "DELETE",
      })
      await fetchCategorias()
    } catch (err) {
      console.error("Erro ao deletar modelo:", err)
    }
    setDeleteModelId(null)
  }

  // Open edit category dialog
  const openEditCat = (cat: MensagemCategoria) => {
    setEditingCat(cat)
    setCatNome(cat.nome)
    setCatDia(cat.dia)
    setCatDescricao(cat.descricao ?? "")
    setCatDialogOpen(true)
  }

  // Open new category dialog
  const openNewCat = () => {
    setEditingCat(null)
    setCatNome("")
    setCatDia("")
    setCatDescricao("")
    setCatDialogOpen(true)
  }

  // Open new model dialog
  const openNewModel = (categoriaId: string) => {
    setEditingModel(null)
    setModelCategoriaId(categoriaId)
    setModelTitulo("")
    setModelCorpo("")
    setModelDialogOpen(true)
  }

  // Open edit model dialog
  const openEditModel = (modelo: MensagemModelo) => {
    setEditingModel(modelo)
    setModelCategoriaId(modelo.categoria_id)
    setModelTitulo(modelo.titulo)
    setModelCorpo(modelo.corpo)
    setModelDialogOpen(true)
  }

  return (
    <AdminScreen
      kicker="Cuidar"
      title="Mensagens"
      subtitle="Modelos de WhatsApp para o acompanhamento"
      action={
        <Button variant="ghost" size="icon" onClick={() => router.push("/admin/visitantes")}>
          <ArrowLeft className="h-5 w-5" />
          <span className="sr-only">Voltar</span>
        </Button>
      }
    >
        {/* Info about placeholders */}
        <DsPanel className="mb-2 p-4">
          <p className="pib-mute mb-2 text-sm">Variáveis nos modelos:</p>
          <div className="flex flex-wrap gap-2">
            {["[Nome]", "[Seu Nome]", "[Nome da Igreja]", "[horario]", "[data]", "[bem-vindo]", "[abracado]", "[convidado]"].map((v) => (
              <DsChip key={v} className="font-mono">
                {v}
              </DsChip>
            ))}
          </div>
        </DsPanel>

        {/* Add category button */}
        <DsBtn onClick={openNewCat} className="mb-4 w-full">
          <Plus className="h-4 w-4" />
          Nova Categoria
        </DsBtn>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="pib-mute h-8 w-8 animate-spin" />
          </div>
        ) : categorias.length === 0 ? (
          <DsEmpty title="Nenhuma categoria cadastrada" />
        ) : (
          <Accordion type="multiple" className="space-y-3">
            {categorias.map((cat) => (
              <AccordionItem
                key={cat.id}
                value={cat.id}
                className="pib-panel overflow-hidden border-[var(--pib-line)]"
              >
                <div className="flex items-center gap-2 px-4 pt-3 pb-0">
                  <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <AccordionTrigger className="py-0 hover:no-underline">
                      <div className="flex flex-col items-start text-left">
                        <span className="font-semibold text-foreground">{cat.nome}</span>
                        {cat.descricao && (
                          <span className="text-xs text-muted-foreground">
                            {cat.descricao}
                          </span>
                        )}
                      </div>
                    </AccordionTrigger>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground hidden sm:inline">
                        {cat.ativa ? "Ativa" : "Inativa"}
                      </span>
                      <Switch
                        checked={cat.ativa}
                        onCheckedChange={() => toggleCategoriaAtiva(cat)}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation()
                        openEditCat(cat)
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      <span className="sr-only">Editar categoria</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleteCatId(cat.id)
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span className="sr-only">Deletar categoria</span>
                    </Button>
                  </div>
                </div>

                <AccordionContent className="px-4 pb-4 pt-2">
                  <div className="space-y-2">
                    {cat.modelos.length === 0 ? (
                      <p className="pib-mute py-3 text-center text-sm">
                        Nenhum modelo cadastrado
                      </p>
                    ) : (
                      cat.modelos.map((modelo, idx) => (
                        <div key={modelo.id} className="rounded-[var(--pib-radius)] border border-[var(--pib-line)] bg-[var(--pib-paper)] p-3">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium">
                              <span className="pib-mute mr-1.5">{idx + 1}.</span>
                              {modelo.titulo}
                            </p>
                            <div className="flex gap-1 shrink-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => openEditModel(modelo)}
                              >
                                <Pencil className="h-3 w-3" />
                                <span className="sr-only">Editar modelo</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                onClick={() => setDeleteModelId(modelo.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                                <span className="sr-only">Deletar modelo</span>
                              </Button>
                            </div>
                          </div>
                          <p className="pib-mute mt-1 whitespace-pre-wrap text-xs leading-relaxed line-clamp-4">
                            {modelo.corpo}
                          </p>
                        </div>
                      ))
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2 mt-2"
                      onClick={() => openNewModel(cat.id)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Adicionar Modelo
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}

      {/* Category Dialog */}
      <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCat ? "Editar Categoria" : "Nova Categoria"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="cat-nome">Nome</Label>
              <Input
                id="cat-nome"
                placeholder="Ex: Mensagem de Agradecimento"
                value={catNome}
                onChange={(e) => setCatNome(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-dia">Dia/Evento</Label>
              <Input
                id="cat-dia"
                placeholder="Ex: Segunda-feira"
                value={catDia}
                onChange={(e) => setCatDia(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-desc">Descricao (opcional)</Label>
              <Input
                id="cat-desc"
                placeholder="Ex: Enviada na segunda apos o culto"
                value={catDescricao}
                onChange={(e) => setCatDescricao(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCatDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={saveCategoria}
              disabled={!catNome.trim() || !catDia.trim() || catSaving}
            >
              {catSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingCat ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Model Dialog */}
      <Dialog open={modelDialogOpen} onOpenChange={setModelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingModel ? "Editar Modelo" : "Novo Modelo de Mensagem"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="model-titulo">Titulo</Label>
              <Input
                id="model-titulo"
                placeholder="Ex: Modelo Casual"
                value={modelTitulo}
                onChange={(e) => setModelTitulo(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model-corpo">Mensagem</Label>
              <Textarea
                id="model-corpo"
                placeholder="Use [Nome], [Seu Nome], [Nome da Igreja], [horario], [bem-vindo], [abracado] como variaveis..."
                value={modelCorpo}
                onChange={(e) => setModelCorpo(e.target.value)}
                rows={8}
                className="resize-y"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setModelDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={saveModelo}
              disabled={!modelTitulo.trim() || !modelCorpo.trim() || modelSaving}
            >
              {modelSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingModel ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Category Confirm */}
      <AlertDialog
        open={!!deleteCatId}
        onOpenChange={(open) => !open && setDeleteCatId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar categoria?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso removera a categoria e todos os modelos de mensagem dentro
              dela. Esta acao nao pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteCategoria}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Model Confirm */}
      <AlertDialog
        open={!!deleteModelId}
        onOpenChange={(open) => !open && setDeleteModelId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar modelo?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso removera este modelo de mensagem permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteModelo}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminScreen>
  )
}
