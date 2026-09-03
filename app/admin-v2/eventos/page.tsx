"use client"

import { useState } from "react"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Pencil, Trash2, Settings2, X, BookmarkPlus } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { MinistryIcon } from "@/components/ministry-icon"
import { AdminScreen, AdminPrimaryAction } from "@/components/app-v2/admin-screen"

const fetcher = (url: string) => fetch(url).then(r => r.json())
const tipos = ["Culto", "Conferência", "Especial", "Reunião", "Outro"]

export default function EventosAdminPage() {
  const { data: eventos, mutate } = useSWR("/api/eventos", fetcher)
  const { data: modelos, mutate: mutateModelos } = useSWR("/api/eventos/modelos", fetcher)
  const { data: ministerios } = useSWR("/api/ministerios", fetcher)

  // Evento form
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ titulo: "", data: "", horario: "", descricao: "", tipo: "Culto", modelo_id: "", repertorio_ministerio_id: "", repertorio_funcao: "" })

  // Modelo form
  const [modeloOpen, setModeloOpen] = useState(false)
  const [editingModelo, setEditingModelo] = useState<any>(null)
  const [modeloForm, setModeloForm] = useState({ nome: "", tipo: "Culto", horario: "", descricao: "" })
  const [modeloPosicoes, setModeloPosicoes] = useState<any[]>([])

  // Posições por evento
  const [posOpen, setPosOpen] = useState<any>(null)
  const { data: eventoPosicoes, mutate: mutatePosicoes } = useSWR(
    posOpen ? `/api/eventos/${posOpen.id}/posicoes` : null, fetcher
  )
  const [posMinId, setPosMinId] = useState("")
  const [posFuncao, setPosFuncao] = useState("")
  const [posQtd, setPosQtd] = useState("1")

  // Funcoes do ministério selecionado
  const { data: minFuncoes } = useSWR(
    posMinId ? `/api/ministerios/${posMinId}/funcoes` : null, fetcher
  )

  // Funcoes do ministério de repertório selecionado
  const { data: repFuncoes } = useSWR(
    form.repertorio_ministerio_id ? `/api/ministerios/${form.repertorio_ministerio_id}/funcoes` : null, fetcher
  )

  const resetForm = () => { setForm({ titulo: "", data: "", horario: "", descricao: "", tipo: "Culto", modelo_id: "", repertorio_ministerio_id: "", repertorio_funcao: "" }); setEditing(null) }
  const resetModeloForm = () => { setModeloForm({ nome: "", tipo: "Culto", horario: "", descricao: "" }); setModeloPosicoes([]); setEditingModelo(null) }

  const handleSave = async () => {
    const method = editing ? "PUT" : "POST"
    const url = editing ? `/api/eventos/${editing.id}` : "/api/eventos"
    // Campos opcionais sempre como null (nunca undefined) — postgres.js na VPS rejeita undefined
    const payload = {
      titulo: form.titulo,
      data: form.data,
      horario: form.horario || null,
      descricao: form.descricao || null,
      tipo: form.tipo,
      modelo_id: form.modelo_id || null,
      observacoes: null,
      repertorio_ministerio_id: form.repertorio_ministerio_id || null,
      repertorio_funcao: form.repertorio_funcao || null,
    }
    try {
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      if (res.ok) {
        toast({ title: editing ? "Evento atualizado" : "Evento criado" })
        mutate(); setOpen(false); resetForm()
      } else {
        const data = await res.json().catch(() => ({}))
        toast({ title: "Erro ao salvar evento", description: data.error || "Tente novamente", variant: "destructive" })
      }
    } catch {
      toast({ title: "Erro de conexão", description: "Verifique sua internet e tente novamente", variant: "destructive" })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este evento e todas as escalas associadas?")) return
    await fetch(`/api/eventos/${id}`, { method: "DELETE" })
    toast({ title: "Evento excluído" }); mutate()
  }

  const openEdit = (ev: any) => {
    setForm({ titulo: ev.titulo, data: ev.data?.split("T")[0] || ev.data, horario: ev.horario || "", descricao: ev.descricao || "", tipo: ev.tipo, modelo_id: ev.modelo_id || "", repertorio_ministerio_id: ev.repertorio_ministerio_id || "", repertorio_funcao: ev.repertorio_funcao || "" })
    setEditing(ev); setOpen(true)
  }

  const handleApplyModelo = (modeloId: string) => {
    const modelo = modelos?.find((m: any) => m.id === modeloId)
    if (modelo) {
      setForm(f => ({ ...f, tipo: modelo.tipo || f.tipo, horario: modelo.horario || f.horario, descricao: modelo.descricao || f.descricao, modelo_id: modeloId }))
    }
  }

  // Modelo CRUD
  const handleSaveAsModelo = async (ev: any) => {
    const nome = prompt("Nome do modelo:", ev.titulo)
    if (!nome?.trim()) return
    const posRes = await fetch(`/api/eventos/${ev.id}/posicoes`)
    const posicoes = posRes.ok ? (await posRes.json()).map((p: any) => ({ ministerio_id: p.ministerio_id, funcao: p.funcao, quantidade: p.quantidade })) : []
    const res = await fetch("/api/eventos/modelos", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome: nome.trim(), tipo: ev.tipo, horario: ev.horario, descricao: ev.descricao, posicoes })
    })
    if (res.ok) { toast({ title: "Modelo criado a partir do evento" }); mutateModelos() }
    else toast({ title: "Erro ao criar modelo", variant: "destructive" })
  }

  const handleSaveModelo = async () => {
    const method = editingModelo ? "PUT" : "POST"
    const url = editingModelo ? `/api/eventos/modelos/${editingModelo.id}` : "/api/eventos/modelos"
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...modeloForm, posicoes: modeloPosicoes })
    })
    if (res.ok) {
      toast({ title: editingModelo ? "Modelo atualizado" : "Modelo criado" })
      mutateModelos(); setModeloOpen(false); resetModeloForm()
    }
  }

  const handleDeleteModelo = async (id: string) => {
    if (!confirm("Excluir este modelo?")) return
    await fetch(`/api/eventos/modelos/${id}`, { method: "DELETE" })
    toast({ title: "Modelo excluído" }); mutateModelos()
  }

  const openEditModelo = (m: any) => {
    setModeloForm({ nome: m.nome, tipo: m.tipo, horario: m.horario || "", descricao: m.descricao || "" })
    setModeloPosicoes(m.posicoes?.map((p: any) => ({ ministerio_id: p.ministerio_id, funcao: p.funcao, quantidade: p.quantidade })) || [])
    setEditingModelo(m); setModeloOpen(true)
  }

  // Posições do evento
  const handleAddPosicao = async () => {
    if (!posOpen || !posMinId || !posFuncao) return
    const res = await fetch(`/api/eventos/${posOpen.id}/posicoes`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ministerio_id: posMinId, funcao: posFuncao, quantidade: Number(posQtd) || 1 })
    })
    if (res.ok) { toast({ title: "Posição adicionada" }); mutatePosicoes(); setPosFuncao(""); setPosQtd("1") }
  }

  const handleRemovePosicao = async (posicaoId: string) => {
    await fetch(`/api/eventos/${posOpen.id}/posicoes`, {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ posicao_id: posicaoId })
    })
    toast({ title: "Posição removida" }); mutatePosicoes()
  }

  const tipoColor = (tipo: string) => {
    const map: Record<string, string> = { Culto: "bg-blue-100 text-blue-700", Conferência: "bg-purple-100 text-purple-700", Especial: "bg-amber-100 text-amber-700", Reunião: "bg-gray-100 text-gray-700" }
    return map[tipo] || "bg-gray-100 text-gray-700"
  }

  return (
    <AdminScreen
      kicker="Igreja"
      title="Calendário"
      subtitle="Cultos, modelos e vagas de escala"
      action={
        <AdminPrimaryAction
          onClick={() => {
            resetForm()
            setOpen(true)
          }}
        >
          <Plus className="h-4 w-4" /> Novo culto
        </AdminPrimaryAction>
      }
    >
      <Tabs defaultValue="eventos">
        <TabsList>
          <TabsTrigger value="eventos">Cultos</TabsTrigger>
          <TabsTrigger value="modelos">Modelos</TabsTrigger>
        </TabsList>

        {/* === EVENTOS TAB === */}
        <TabsContent value="eventos" className="space-y-4 mt-4">
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editing ? "Editar" : "Novo"} culto</DialogTitle></DialogHeader>
              <div className="space-y-4">
                {!editing && modelos?.length > 0 && (
                  <div>
                    <Label>Modelo (opcional)</Label>
                    <Select value={form.modelo_id} onValueChange={handleApplyModelo}>
                      <SelectTrigger><SelectValue placeholder="Selecione um modelo" /></SelectTrigger>
                      <SelectContent>
                        {modelos.map((m: any) => <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div><Label>Título</Label><Input value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} /></div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1"><Label>Data</Label><Input type="date" value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} /></div>
                  <div className="flex-1"><Label>Horário</Label><Input type="time" value={form.horario} onChange={e => setForm({ ...form, horario: e.target.value })} /></div>
                </div>
                <div>
                  <Label>Tipo</Label>
                  <Select value={form.tipo} onValueChange={v => setForm({ ...form, tipo: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{tipos.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Descrição</Label><Input value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} /></div>
                <div className="border-t pt-4 space-y-3">
                  <Label className="text-sm font-semibold">Repertório — Permissão de edição</Label>
                  <Select
                    value={form.repertorio_ministerio_id || "__none__"}
                    onValueChange={v => setForm({
                      ...form,
                      repertorio_ministerio_id: v === "__none__" ? "" : v,
                      repertorio_funcao: "",
                    })}
                  >
                    <SelectTrigger><SelectValue placeholder="Ministério responsável (opcional)" /></SelectTrigger>
                    <SelectContent className="z-[100]">
                      <SelectItem value="__none__">Nenhum</SelectItem>
                      {ministerios?.map((m: any) => (
                        <SelectItem key={m.id} value={m.id}>
                          <span className="inline-flex items-center gap-2">
                            <MinistryIcon name={m.icone} ministryName={m.nome} color={m.cor} size={16} />
                            {m.nome}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.repertorio_ministerio_id && Array.isArray(repFuncoes) && repFuncoes.length > 0 && (
                    <Select
                      value={form.repertorio_funcao || "__none__"}
                      onValueChange={v => setForm({ ...form, repertorio_funcao: v === "__none__" ? "" : v })}
                    >
                      <SelectTrigger><SelectValue placeholder="Função responsável (opcional)" /></SelectTrigger>
                      <SelectContent className="z-[100]">
                        <SelectItem value="__none__">Qualquer função do ministério</SelectItem>
                        {repFuncoes.map((f: any) => <SelectItem key={f.id} value={f.nome}>{f.nome}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <Button className="w-full" onClick={handleSave}>Salvar</Button>
              </div>
            </DialogContent>
          </Dialog>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {eventos?.map((ev: any) => {
              const d = new Date(ev.data)
              const dia = d.toLocaleDateString("pt-BR", { day: "2-digit", timeZone: "UTC" })
              const mes = d.toLocaleDateString("pt-BR", { month: "short", timeZone: "UTC" }).replace(".", "")
              return (
                <Card key={ev.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-center justify-center rounded-lg bg-primary/10 text-primary min-w-[3rem] py-2 px-2">
                          <span className="text-lg font-bold leading-none">{dia}</span>
                          <span className="text-[10px] uppercase font-medium mt-0.5">{mes}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{ev.titulo}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            {ev.horario && <span>{ev.horario}</span>}
                            <span className={`px-1.5 py-0.5 rounded ${tipoColor(ev.tipo)}`}>{ev.tipo}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {ev.descricao && <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{ev.descricao}</p>}
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleSaveAsModelo(ev)} title="Salvar como modelo"><BookmarkPlus className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPosOpen(ev)} title="Posições"><Settings2 className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(ev)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(ev.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
            {eventos?.length === 0 && <p className="text-center text-muted-foreground py-8 col-span-full">Nenhum evento cadastrado.</p>}
          </div>
        </TabsContent>

        {/* === MODELOS TAB === */}
        <TabsContent value="modelos" className="space-y-4 mt-4">
          <Button className="w-full sm:w-auto" onClick={() => { resetModeloForm(); setModeloOpen(true) }}><Plus className="h-4 w-4 mr-1" />Novo Modelo</Button>
          <Dialog open={modeloOpen} onOpenChange={(v) => { setModeloOpen(v); if (!v) resetModeloForm() }}>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editingModelo ? "Editar" : "Novo"} Modelo</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Nome</Label><Input placeholder="Ex: Culto de Domingo" value={modeloForm.nome} onChange={e => setModeloForm({ ...modeloForm, nome: e.target.value })} /></div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <Label>Tipo</Label>
                    <Select value={modeloForm.tipo} onValueChange={v => setModeloForm({ ...modeloForm, tipo: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{tipos.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1"><Label>Horário</Label><Input type="time" value={modeloForm.horario} onChange={e => setModeloForm({ ...modeloForm, horario: e.target.value })} /></div>
                </div>
                <div><Label>Descrição</Label><Input value={modeloForm.descricao} onChange={e => setModeloForm({ ...modeloForm, descricao: e.target.value })} /></div>

                {/* Posições do modelo */}
                <div>
                  <Label>Posições necessárias</Label>
                  <div className="space-y-2 mt-2">
                    {modeloPosicoes.map((p, i) => {
                      const min = ministerios?.find((m: any) => m.id === p.ministerio_id)
                      return (
                        <div key={i} className="flex items-center gap-2 text-sm border rounded p-2">
                          <span className="flex-1 truncate inline-flex items-center gap-1.5 min-w-0">
                            <MinistryIcon name={min?.icone} ministryName={min?.nome} color={min?.cor} size={14} className="shrink-0" />
                            <span className="truncate">{min?.nome} — {p.funcao} (x{p.quantidade})</span>
                          </span>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setModeloPosicoes(ps => ps.filter((_, j) => j !== i))}><X className="h-3 w-3" /></Button>
                        </div>
                      )
                    })}
                  </div>
                  <ModeloPosicaoAdd ministerios={ministerios} onAdd={(p: any) => setModeloPosicoes(ps => [...ps, p])} />
                </div>

                <Button className="w-full" onClick={handleSaveModelo} disabled={!modeloForm.nome.trim()}>Salvar</Button>
              </div>
            </DialogContent>
          </Dialog>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {modelos?.map((m: any) => (
              <Card key={m.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-sm">{m.nome}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <span className={`px-1.5 py-0.5 rounded ${tipoColor(m.tipo)}`}>{m.tipo}</span>
                        {m.horario && <span>{m.horario}</span>}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditModelo(m)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteModelo(m.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                  {m.posicoes?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {m.posicoes.map((p: any) => (
                        <Badge key={p.id} variant="outline" className="text-[10px] gap-1">
                          <MinistryIcon name={p.ministerio_icone} ministryName={p.ministerio_nome} size={12} />
                          {p.funcao} x{p.quantidade}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            {modelos?.length === 0 && <p className="text-center text-muted-foreground py-8 col-span-full">Nenhum modelo cadastrado.</p>}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog posições do evento */}
      <Dialog open={!!posOpen} onOpenChange={(v) => { if (!v) { setPosOpen(null); setPosMinId(""); setPosFuncao("") } }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Posições — {posOpen?.titulo}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {eventoPosicoes?.length > 0 ? (
              <div className="space-y-2">
                {eventoPosicoes.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between text-sm border rounded p-2 gap-2">
                    <span className="truncate inline-flex items-center gap-1.5 min-w-0 flex-1">
                      <MinistryIcon name={p.ministerio_icone} ministryName={p.ministerio_nome} size={14} className="shrink-0" />
                      <span className="truncate">{p.ministerio_nome} — {p.funcao} (x{p.quantidade})</span>
                    </span>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive shrink-0" onClick={() => handleRemovePosicao(p.id)}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-2">Nenhuma posição definida.</p>
            )}

            <div className="border-t pt-4 space-y-3">
              <Label>Adicionar posição</Label>
              <Select value={posMinId} onValueChange={(v) => { setPosMinId(v); setPosFuncao("") }}>
                <SelectTrigger><SelectValue placeholder="Ministério" /></SelectTrigger>
                <SelectContent>
                  {ministerios?.map((m: any) => (
                    <SelectItem key={m.id} value={m.id}>
                      <span className="inline-flex items-center gap-2">
                        <MinistryIcon name={m.icone} ministryName={m.nome} color={m.cor} size={16} />
                        {m.nome}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {posMinId && (
                <Select value={posFuncao} onValueChange={setPosFuncao}>
                  <SelectTrigger><SelectValue placeholder="Função" /></SelectTrigger>
                  <SelectContent>
                    {minFuncoes?.map((f: any) => <SelectItem key={f.id} value={f.nome}>{f.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              <div className="flex gap-2">
                <div className="w-20"><Label>Qtd</Label><Input type="number" min="1" value={posQtd} onChange={e => setPosQtd(e.target.value)} /></div>
                <div className="flex-1 flex items-end">
                  <Button className="w-full" onClick={handleAddPosicao} disabled={!posMinId || !posFuncao}>Adicionar</Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminScreen>
  )
}

// Sub-component for adding positions to a modelo (inline, no API call)
function ModeloPosicaoAdd({ ministerios, onAdd }: { ministerios: any[]; onAdd: (p: any) => void }) {
  const [minId, setMinId] = useState("")
  const [funcao, setFuncao] = useState("")
  const [qtd, setQtd] = useState("1")
  const { data: funcoes } = useSWR(minId ? `/api/ministerios/${minId}/funcoes` : null, fetcher)

  const handleAdd = () => {
    if (!minId || !funcao) return
    onAdd({ ministerio_id: minId, funcao, quantidade: Number(qtd) || 1 })
    setFuncao(""); setQtd("1")
  }

  return (
    <div className="border-t pt-3 mt-3 space-y-2">
      <Select value={minId} onValueChange={(v) => { setMinId(v); setFuncao("") }}>
        <SelectTrigger><SelectValue placeholder="Ministério" /></SelectTrigger>
        <SelectContent>
          {ministerios?.map((m: any) => (
            <SelectItem key={m.id} value={m.id}>
              <span className="inline-flex items-center gap-2">
                <MinistryIcon name={m.icone} ministryName={m.nome} color={m.cor} size={16} />
                {m.nome}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {minId && (
        <Select value={funcao} onValueChange={setFuncao}>
          <SelectTrigger><SelectValue placeholder="Função" /></SelectTrigger>
          <SelectContent>
            {funcoes?.map((f: any) => <SelectItem key={f.id} value={f.nome}>{f.nome}</SelectItem>)}
          </SelectContent>
        </Select>
      )}
      <div className="flex gap-2">
        <div className="w-20"><Label>Qtd</Label><Input type="number" min="1" value={qtd} onChange={e => setQtd(e.target.value)} /></div>
        <div className="flex-1 flex items-end">
          <Button variant="outline" className="w-full" onClick={handleAdd} disabled={!minId || !funcao}>Adicionar</Button>
        </div>
      </div>
    </div>
  )
}
