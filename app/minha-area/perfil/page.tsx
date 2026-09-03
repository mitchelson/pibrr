"use client"

import { useState, useRef } from "react"
import useSWR from "swr"
import { useSession } from "next-auth/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { Camera, Loader2, Pencil, X, Calendar, Sparkles, CalendarOff, Plus, Trash2, Crown } from "lucide-react"
import { MinistryIcon } from "@/components/ministry-icon"
import { RoleBadges } from "@/components/role-badges"
import { SolicitarMinisterio } from "@/app/minha-area/solicitar-ministerio"
import { signOut } from "next-auth/react"
import Link from "next/link"
import { TryV2Link } from "@/components/app-v2/try-v2-link"

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function PerfilPage() {
  const { data: session } = useSession()
  const userId = session?.user?.id
  const { data: profile, mutate } = useSWR(userId ? `/api/users/${userId}/profile` : null, fetcher)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const p = form ?? profile ?? {}

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
      toast({ title: "Perfil atualizado!" })
    }
    setSaving(false)
  }

  if (!profile) return <div className="p-6 text-center text-gray-400">Carregando...</div>

  return (
    <div className="min-h-screen bg-white">
      {/* Header estilo Instagram */}
      <div className="border-b px-4 py-3 flex items-center justify-between">
        <h1 className="font-semibold text-lg">{profile.nome?.split(" ")[0]}</h1>
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

      <div className="px-4 py-5 space-y-5">
        {/* Avatar + stats */}
        <div className="flex items-center gap-5">
          <div className="relative">
            <Avatar className="h-20 w-20">
              <AvatarImage src={p.foto_url} />
              <AvatarFallback className="text-2xl">{p.nome?.[0]}</AvatarFallback>
            </Avatar>
            {editing && (
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute bottom-0 right-0 bg-black text-white rounded-full p-1.5"
                disabled={uploading}
              >
                {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
          </div>
          <div className="flex gap-6 text-center">
            <div>
              <p className="font-bold text-lg">{profile.ministerios?.length || 0}</p>
              <p className="text-xs text-gray-500">Ministérios</p>
            </div>
            <div>
              <p className="font-bold text-lg">{profile.dons ? 3 : 0}</p>
              <p className="text-xs text-gray-500">Dons</p>
            </div>
            <div>
              <p className="font-bold text-lg">{profile.proximas_escalas?.length || 0}</p>
              <p className="text-xs text-gray-500">Escalas</p>
            </div>
          </div>
        </div>

        {/* Nome e bio */}
        {editing ? (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Nome</Label>
              <Input value={p.nome || ""} onChange={(e) => setForm({ ...p, nome: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Bio</Label>
              <Textarea value={p.bio || ""} onChange={(e) => setForm({ ...p, bio: e.target.value })} placeholder="Conte sobre você..." className="resize-none h-20" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="min-w-0">
                <Label className="text-xs">Nascimento</Label>
                <Input type="date" value={p.nascimento?.split("T")[0] || ""} onChange={(e) => setForm({ ...p, nascimento: e.target.value })} className="text-sm w-full" />
              </div>
              <div className="min-w-0">
                <Label className="text-xs">Batismo</Label>
                <Input type="date" value={p.data_batismo?.split("T")[0] || ""} onChange={(e) => setForm({ ...p, data_batismo: e.target.value })} className="text-sm w-full" />
              </div>
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        ) : (
          <div>
            <p className="font-semibold text-sm">{profile.nome}</p>
            <RoleBadges roles={profile.roles} legacyRole={profile.role} size="xs" className="mt-1.5" />
            {profile.bio && <p className="text-sm text-gray-700 mt-1">{profile.bio}</p>}
          </div>
        )}

        {/* Ministérios */}
        <section>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Ministérios</h3>
          {profile.ministerios?.length > 0 ? (
            <div className="flex flex-wrap gap-2 mb-3">
              {profile.ministerios.map((m: any) => (
                <span key={m.nome} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-muted text-sm">
                  <MinistryIcon name={m.icone} ministryName={m.nome} color={m.cor} size={14} />
                  <span>{m.nome}</span>
                  {m.is_lider && <Crown className="h-3 w-3 text-primary" />}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mb-3">Você ainda não participa de um ministério.</p>
          )}
          <SolicitarMinisterio />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/form-ministerios">Interesse em ministérios</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/form-dons-espirituais">Dons espirituais</Link>
            </Button>
          </div>
        </section>

        {/* Dons Espirituais */}
        {profile.dons && (
          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              <Sparkles className="h-3 w-3 inline mr-1" />Dons Espirituais
            </h3>
            <div className="space-y-1.5">
              {(profile.dons as any[]).filter((r: any) => r.rank <= 3).map((r: any) => (
                <div key={r.gift} className="flex items-center gap-2 bg-green-50 rounded-lg px-3 py-2">
                  <span className="text-xs font-bold text-green-700">{r.rank}°</span>
                  <span className="text-sm flex-1">{r.gift}</span>
                  <span className="text-xs text-green-600 font-semibold">{r.score}/12</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Próximas escalas */}
        {profile.proximas_escalas?.length > 0 && (
          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              <Calendar className="h-3 w-3 inline mr-1" />Próximas Escalas
            </h3>
            <div className="space-y-2">
              {profile.proximas_escalas.map((e: any, i: number) => (
                <div key={i} className="flex items-center gap-3 border rounded-lg p-3">
                  <MinistryIcon name={e.icone} ministryName={e.ministerio} size={20} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{e.titulo}</p>
                    <p className="text-xs text-gray-500">{e.ministerio}{e.funcao ? ` · ${e.funcao}` : ""}</p>
                  </div>
                  <p className="text-xs text-gray-500">{new Date(e.data).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", timeZone: "UTC" })}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Indisponibilidades */}
        <IndisponibilidadesSection />

        <div className="pt-2">
          <TryV2Link />
        </div>

        {/* Sair */}
        <Button variant="outline" className="w-full text-red-500 border-red-200" onClick={() => signOut({ callbackUrl: "/" })}>
          Sair da conta
        </Button>
      </div>
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
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data_inicio: dataInicio, data_fim: dataFim, motivo: motivo || null }),
    })
    setAdding(false); setDataInicio(""); setDataFim(""); setMotivo("")
    setSaving(false); mutate()
  }

  const handleDelete = async (id: string) => {
    await fetch("/api/users/me/indisponibilidades", {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    mutate()
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          <CalendarOff className="h-3 w-3 inline mr-1" />Indisponibilidades
        </h3>
        <button onClick={() => setAdding(!adding)} className="text-gray-400 hover:text-black">
          {adding ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        </button>
      </div>

      {adding && (
        <div className="bg-gray-50 rounded-lg p-3 mb-3 space-y-2">
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
            <div key={item.id} className="flex items-center gap-2 bg-red-50 rounded-lg px-3 py-2">
              <CalendarOff className="h-4 w-4 text-red-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">
                  {new Date(item.data_inicio).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", timeZone: "UTC" })}
                  {item.data_inicio !== item.data_fim && ` — ${new Date(item.data_fim).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", timeZone: "UTC" })}`}
                </p>
                {item.motivo && <p className="text-xs text-gray-500 truncate">{item.motivo}</p>}
              </div>
              <button onClick={() => handleDelete(item.id)} className="text-gray-400 hover:text-red-500">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : !adding ? (
        <p className="text-xs text-gray-400">Nenhuma indisponibilidade registrada</p>
      ) : null}
    </section>
  )
}
