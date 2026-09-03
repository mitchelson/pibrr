"use client"

import { useState, useRef } from "react"
import useSWR from "swr"
import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { Camera, Loader2, Pencil, X, Calendar, Sparkles, CalendarOff, Plus, Trash2, Crown } from "lucide-react"
import { MinistryIcon } from "@/components/ministry-icon"
import { RoleBadges } from "@/components/role-badges"
import { APP_PATHS } from "@/lib/app-ui"
import { useAppUi } from "@/hooks/use-app-ui"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function PerfilV2Page() {
  const { data: session } = useSession()
  const { switchTo, isPreview } = useAppUi()
  const userId = session?.user?.id
  const { data: profile, mutate } = useSWR(userId ? `/api/users/${userId}/profile` : null, fetcher)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const p = form ?? profile ?? {}
  const donsTop = Array.isArray(profile?.dons) ? profile.dons.filter((r: any) => r.rank <= 3) : []

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append("file", file)
    const res = await fetch("/api/upload", { method: "POST", body: fd })
    if (res.ok) {
      const { url } = await res.json()
      setForm({ ...p, foto_url: url })
    }
    setUploading(false)
  }

  const handleSave = async () => {
    setSaving(true)
    const res = await fetch("/api/users/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: p.nome,
        bio: p.bio,
        nascimento: p.nascimento || null,
        data_batismo: p.data_batismo || null,
        foto_url: p.foto_url,
      }),
    })
    if (res.ok) {
      mutate()
      setEditing(false)
      setForm(null)
      toast({ title: "Perfil atualizado" })
    }
    setSaving(false)
  }

  if (!profile) return <div className="p-6 text-center text-muted-foreground">Carregando…</div>

  return (
    <div className="mx-auto max-w-lg px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">Perfil</h1>
        {!editing ? (
          <Button variant="ghost" size="sm" onClick={() => { setEditing(true); setForm(profile) }}>
            <Pencil className="h-4 w-4" />
          </Button>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => { setEditing(false); setForm(null) }}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <Avatar className="h-20 w-20">
            <AvatarImage src={p.foto_url} />
            <AvatarFallback className="text-2xl">{p.nome?.[0]}</AvatarFallback>
          </Avatar>
          {editing && (
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-0 right-0 rounded-full bg-foreground p-1.5 text-background"
              disabled={uploading}
            >
              {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
        </div>
        <div className="flex gap-6 text-center">
          <div>
            <p className="text-lg font-bold">{profile.ministerios?.length || 0}</p>
            <p className="text-xs text-muted-foreground">Ministérios</p>
          </div>
          <div>
            <p className="text-lg font-bold">{donsTop.length}</p>
            <p className="text-xs text-muted-foreground">Dons</p>
          </div>
          <div>
            <p className="text-lg font-bold">{profile.proximas_escalas?.length || 0}</p>
            <p className="text-xs text-muted-foreground">Escalas</p>
          </div>
        </div>
      </div>

      {editing ? (
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Nome</Label>
            <Input value={p.nome || ""} onChange={(e) => setForm({ ...p, nome: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs">Bio</Label>
            <Textarea value={p.bio || ""} onChange={(e) => setForm({ ...p, bio: e.target.value })} placeholder="Conte sobre você..." className="h-20 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Nascimento</Label>
              <Input type="date" value={p.nascimento?.split("T")[0] || ""} onChange={(e) => setForm({ ...p, nascimento: e.target.value })} className="text-sm" />
            </div>
            <div>
              <Label className="text-xs">Batismo</Label>
              <Input type="date" value={p.data_batismo?.split("T")[0] || ""} onChange={(e) => setForm({ ...p, data_batismo: e.target.value })} className="text-sm" />
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      ) : (
        <div>
          <p className="text-sm font-semibold">{profile.nome}</p>
          <RoleBadges roles={profile.roles} legacyRole={profile.role} size="xs" className="mt-1.5" />
          {profile.bio && <p className="mt-1 text-sm text-muted-foreground">{profile.bio}</p>}
        </div>
      )}

      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ministérios</h3>
        {profile.ministerios?.length > 0 ? (
          <div className="mb-3 flex flex-wrap gap-2">
            {profile.ministerios.map((m: any) => (
              <span key={m.nome} className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1.5 text-sm">
                <MinistryIcon name={m.icone} ministryName={m.nome} color={m.cor} size={14} />
                <span>{m.nome}</span>
                {m.is_lider && <Crown className="h-3 w-3" />}
              </span>
            ))}
          </div>
        ) : (
          <p className="mb-3 text-sm text-muted-foreground">Você ainda não participa de um ministério.</p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/form-ministerios">Quero servir</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/form-dons-espirituais">Dons espirituais</Link>
          </Button>
        </div>
      </section>

      {donsTop.length > 0 && (
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Sparkles className="mr-1 inline h-3 w-3" />
            Dons espirituais
          </h3>
          <div className="space-y-1.5">
            {donsTop.map((r: any) => (
              <div key={r.gift} className="flex items-center gap-2 rounded-lg border px-3 py-2">
                <span className="text-xs font-bold">{r.rank}°</span>
                <span className="flex-1 text-sm">{r.gift}</span>
                <span className="text-xs text-muted-foreground">{r.score}/12</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {profile.proximas_escalas?.length > 0 && (
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Calendar className="mr-1 inline h-3 w-3" />
            Próximas escalas
          </h3>
          <div className="space-y-2">
            {profile.proximas_escalas.map((e: any, i: number) => (
              <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
                <MinistryIcon name={e.icone} ministryName={e.ministerio} size={20} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{e.titulo}</p>
                  <p className="text-xs text-muted-foreground">
                    {e.ministerio}
                    {e.funcao ? ` · ${e.funcao}` : ""}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(e.data).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", timeZone: "UTC" })}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      <IndisponibilidadesSection />

      {isPreview && (
        <Button variant="ghost" className="w-full" asChild>
          <Link href={APP_PATHS.v1.perfil} onClick={() => switchTo("v1")}>
            Voltar à versão atual
          </Link>
        </Button>
      )}

      <Button variant="outline" className="w-full" onClick={() => signOut({ callbackUrl: "/" })}>
        Sair da conta
      </Button>
    </div>
  )
}

function IndisponibilidadesSection() {
  const { data: items, mutate } = useSWR("/api/users/me/indisponibilidades", fetcher)
  const [adding, setAdding] = useState(false)
  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")
  const [motivo, setMotivo] = useState("")
  const [saving, setSaving] = useState(false)

  const handleAdd = async () => {
    if (!dataInicio || !dataFim) return
    setSaving(true)
    await fetch("/api/users/me/indisponibilidades", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data_inicio: dataInicio, data_fim: dataFim, motivo: motivo || null }),
    })
    setAdding(false)
    setDataInicio("")
    setDataFim("")
    setMotivo("")
    setSaving(false)
    mutate()
  }

  const handleDelete = async (id: string) => {
    await fetch("/api/users/me/indisponibilidades", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    mutate()
  }

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <CalendarOff className="mr-1 inline h-3 w-3" />
          Indisponibilidades
        </h3>
        <button onClick={() => setAdding(!adding)} className="text-muted-foreground hover:text-foreground">
          {adding ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        </button>
      </div>
      {adding && (
        <div className="mb-3 space-y-2 rounded-lg border p-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">De</Label>
              <Input type="date" value={dataInicio} onChange={(e) => { setDataInicio(e.target.value); if (!dataFim) setDataFim(e.target.value) }} className="text-sm" />
            </div>
            <div>
              <Label className="text-xs">Até</Label>
              <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="text-sm" />
            </div>
          </div>
          <Input placeholder="Motivo (opcional)" value={motivo} onChange={(e) => setMotivo(e.target.value)} className="text-sm" />
          <Button size="sm" onClick={handleAdd} disabled={saving || !dataInicio || !dataFim} className="w-full">
            {saving ? "Salvando..." : "Adicionar"}
          </Button>
        </div>
      )}
      {items?.length > 0 ? (
        <div className="space-y-2">
          {items.map((item: any) => (
            <div key={item.id} className="flex items-center gap-2 rounded-lg border px-3 py-2">
              <CalendarOff className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  {new Date(item.data_inicio).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", timeZone: "UTC" })}
                  {item.data_inicio !== item.data_fim &&
                    ` — ${new Date(item.data_fim).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", timeZone: "UTC" })}`}
                </p>
                {item.motivo && <p className="truncate text-xs text-muted-foreground">{item.motivo}</p>}
              </div>
              <button onClick={() => handleDelete(item.id)} className="text-muted-foreground hover:text-foreground">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : !adding ? (
        <p className="text-xs text-muted-foreground">Nenhuma indisponibilidade registrada</p>
      ) : null}
    </section>
  )
}
