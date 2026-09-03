"use client"

import { useState } from "react"
import Link from "next/link"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Pencil, Trash2, ChevronRight } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { MinistryIcon, MinistryIconPicker } from "@/components/ministry-icon"
import { AdminScreen } from "@/components/app-v2/admin-screen"
import { DsList, useDsConfirm } from "@/components/app-v2/ds"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function MinisteriosAdminPage() {
  const { ask, node: confirmNode } = useDsConfirm()
  const { data: ministerios, mutate } = useSWR("/api/ministerios", fetcher)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ nome: "", descricao: "", cor: "#0a0a0a", icone: "Church", ordem: 0 })

  const resetForm = () => {
    setForm({ nome: "", descricao: "", cor: "#0a0a0a", icone: "Church", ordem: 0 })
    setEditing(null)
  }

  const handleSave = async () => {
    const method = editing ? "PUT" : "POST"
    const url = editing ? `/api/ministerios/${editing.id}` : "/api/ministerios"
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      toast({ title: editing ? "Ministério atualizado" : "Ministério criado" })
      mutate()
      setOpen(false)
      resetForm()
    }
  }

  const handleDelete = async (id: string) => {
    const ok = await ask({
      title: "Excluir ministério?",
      description: "Esta ação não pode ser desfeita.",
      danger: true,
      confirmLabel: "Excluir",
    })
    if (!ok) return
    await fetch(`/api/ministerios/${id}`, { method: "DELETE" })
    toast({ title: "Ministério excluído" })
    mutate()
  }

  const openEdit = (m: any) => {
    setForm({
      nome: m.nome,
      descricao: m.descricao || "",
      cor: m.cor || "#0a0a0a",
      icone: m.icone || "Church",
      ordem: m.ordem,
    })
    setEditing(m)
    setOpen(true)
  }

  return (
    <AdminScreen
      kicker="Igreja"
      title="Ministérios"
      subtitle="Catálogo — o dia a dia fica dentro de cada ministério"
      action={
        <Dialog
          open={open}
          onOpenChange={(v) => {
            setOpen(v)
            if (!v) resetForm()
          }}
        >
          <DialogTrigger asChild>
            <button type="button" className="pib-btn pib-btn--primary">
              <Plus className="h-4 w-4" /> Novo
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Editar" : "Novo"} ministério</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome</Label>
                <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
              </div>
              <div>
                <Label>Descrição</Label>
                <Input
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                />
              </div>
              <div className="flex flex-wrap gap-4">
                <div className="min-w-[100px] flex-1">
                  <Label>Cor</Label>
                  <Input
                    type="color"
                    value={form.cor}
                    onChange={(e) => setForm({ ...form, cor: e.target.value })}
                  />
                </div>
                <div className="w-20">
                  <Label>Ordem</Label>
                  <Input
                    type="number"
                    value={form.ordem}
                    onChange={(e) => setForm({ ...form, ordem: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div>
                <Label className="mb-2 block">Ícone</Label>
                <MinistryIconPicker
                  value={form.icone}
                  onChange={(icone) => setForm({ ...form, icone })}
                />
              </div>
              <Button className="w-full" onClick={handleSave}>
                Salvar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      }
    >
      <DsList>
        {(ministerios || []).map((m: any) => (
          <div key={m.id} className="flex items-center gap-1 pr-2">
            <Link href={`/admin/ministerios/${m.id}`} className="pib-row min-w-0 flex-1">
              <MinistryIcon mono name={m.icone} ministryName={m.nome} size={22} />
              <div className="pib-row__body">
                <div className="pib-row__title">{m.nome}</div>
                {m.descricao ? <div className="pib-row__meta">{m.descricao}</div> : null}
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-[var(--pib-mute)]" />
            </Link>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => openEdit(m)}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-destructive"
              onClick={() => handleDelete(m.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </DsList>
      {confirmNode}
    </AdminScreen>
  )
}
