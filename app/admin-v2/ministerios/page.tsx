"use client"

import { useState } from "react"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Trash2, Users } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { MinistryIcon, MinistryIconPicker } from "@/components/ministry-icon"

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function MinisteriosAdminPage() {
  const { data: ministerios, mutate } = useSWR("/api/ministerios", fetcher)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ nome: "", descricao: "", cor: "#0a0a0a", icone: "Church", ordem: 0 })
  const [detailId, setDetailId] = useState<string | null>(null)
  const { data: detail } = useSWR(detailId ? `/api/ministerios/${detailId}` : null, fetcher)

  const resetForm = () => { setForm({ nome: "", descricao: "", cor: "#0a0a0a", icone: "Church", ordem: 0 }); setEditing(null) }

  const handleSave = async () => {
    const method = editing ? "PUT" : "POST"
    const url = editing ? `/api/ministerios/${editing.id}` : "/api/ministerios"
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
    if (res.ok) {
      toast({ title: editing ? "Ministério atualizado" : "Ministério criado" })
      mutate(); setOpen(false); resetForm()
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este ministério?")) return
    await fetch(`/api/ministerios/${id}`, { method: "DELETE" })
    toast({ title: "Ministério excluído" }); mutate()
  }

  const openEdit = (m: any) => {
    setForm({ nome: m.nome, descricao: m.descricao || "", cor: m.cor, icone: m.icone || "Church", ordem: m.ordem })
    setEditing(m); setOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Ministérios</h1>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" />Novo</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editing ? "Editar" : "Novo"} Ministério</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Nome</Label><Input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} /></div>
              <div><Label>Descrição</Label><Input value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} /></div>
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[100px]"><Label>Cor</Label><Input type="color" value={form.cor} onChange={e => setForm({ ...form, cor: e.target.value })} /></div>
                <div className="w-20"><Label>Ordem</Label><Input type="number" value={form.ordem} onChange={e => setForm({ ...form, ordem: Number(e.target.value) })} /></div>
              </div>
              <div>
                <Label className="mb-2 block">Ícone</Label>
                <MinistryIconPicker value={form.icone} onChange={(icone) => setForm({ ...form, icone })} />
              </div>
              <Button className="w-full" onClick={handleSave}>Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ministerios?.map((m: any) => (
          <Card key={m.id} className="relative">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <MinistryIcon name={m.icone} ministryName={m.nome} color={m.cor} size={22} />
                  <span>{m.nome}</span>
                </CardTitle>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(m)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(m.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {m.descricao && <p className="text-sm text-muted-foreground mb-2">{m.descricao}</p>}
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Users className="h-3 w-3" />{m.total_membros} membros
                </Badge>
                <div className="h-4 w-4 rounded-full border" style={{ backgroundColor: m.cor }} />
              </div>
              <Button variant="link" size="sm" className="px-0 mt-2" onClick={() => setDetailId(detailId === m.id ? null : m.id)}>
                {detailId === m.id ? "Ocultar membros" : "Ver membros"}
              </Button>
              {detailId === m.id && detail?.membros && (
                <div className="mt-2 space-y-1">
                  {detail.membros.length === 0 ? <p className="text-xs text-muted-foreground">Nenhum membro</p> : detail.membros.map((mb: any) => (
                    <div key={mb.user_id} className="flex items-center justify-between text-sm">
                      <span>{mb.nome}</span>
                      {mb.is_lider && <Badge variant="outline" className="text-xs">Líder</Badge>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
