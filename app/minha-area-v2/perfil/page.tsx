"use client"

import { useState, useRef } from "react"
import useSWR from "swr"
import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { Camera, Loader2, Pencil, X, CalendarOff, Plus, Trash2, Crown } from "lucide-react"
import { MinistryIcon } from "@/components/ministry-icon"
import { APP_PATHS } from "@/lib/app-ui"
import { useAppUi } from "@/hooks/use-app-ui"
import {
  DsBtn,
  DsEmpty,
  DsField,
  DsHero,
  DsList,
  DsPage,
  DsPanel,
  DsRow,
  DsSection,
  RoleBadgesV2,
} from "@/components/app-v2/ds"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function formatDate(value?: string | null) {
  if (!value) return null
  return new Date(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" })
}

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

  if (!profile) {
    return (
      <DsPage>
        <p className="pib-mute text-center">Carregando…</p>
      </DsPage>
    )
  }

  return (
    <DsPage>
      <DsHero
        kicker="Sua conta"
        title="Eu"
        subtitle="Quem você é na igreja — e como quer servir."
        action={
          !editing ? (
            <DsBtn variant="ghost" size="icon" onClick={() => { setEditing(true); setForm(profile) }}>
              <Pencil className="h-4 w-4" />
            </DsBtn>
          ) : (
            <DsBtn variant="ghost" size="icon" onClick={() => { setEditing(false); setForm(null) }}>
              <X className="h-4 w-4" />
            </DsBtn>
          )
        }
      />

      <DsPanel className="p-5">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <Avatar className="h-16 w-16">
              <AvatarImage src={p.foto_url} />
              <AvatarFallback className="text-xl">{p.nome?.[0]}</AvatarFallback>
            </Avatar>
            {editing && (
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute bottom-0 right-0 rounded-full bg-[var(--pib-ink)] p-1.5 text-white"
                disabled={uploading}
              >
                {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="pib-title truncate text-lg leading-tight">{profile.nome}</p>
            <RoleBadgesV2 roles={profile.roles} legacyRole={profile.role} size="xs" className="mt-1.5" />
          </div>
        </div>
      </DsPanel>

      <DsSection title="Dados">
        <DsPanel className="p-4">
          {editing ? (
            <div className="space-y-3">
              <DsField label="Nome">
                <Input value={p.nome || ""} onChange={(e) => setForm({ ...p, nome: e.target.value })} />
              </DsField>
              <DsField label="Bio">
                <Textarea
                  value={p.bio || ""}
                  onChange={(e) => setForm({ ...p, bio: e.target.value })}
                  placeholder="Conte sobre você..."
                  className="h-20 resize-none"
                />
              </DsField>
              <div className="grid grid-cols-2 gap-3">
                <DsField label="Nascimento">
                  <Input
                    type="date"
                    value={p.nascimento?.split("T")[0] || ""}
                    onChange={(e) => setForm({ ...p, nascimento: e.target.value })}
                  />
                </DsField>
                <DsField label="Batismo">
                  <Input
                    type="date"
                    value={p.data_batismo?.split("T")[0] || ""}
                    onChange={(e) => setForm({ ...p, data_batismo: e.target.value })}
                  />
                </DsField>
              </div>
              <DsBtn className="w-full" onClick={handleSave} disabled={saving}>
                {saving ? "Salvando..." : "Salvar"}
              </DsBtn>
            </div>
          ) : (
            <div className="space-y-2">
              {profile.bio ? (
                <p className="text-sm leading-relaxed">{profile.bio}</p>
              ) : (
                <p className="pib-mute text-sm">Sem bio ainda.</p>
              )}
              {(profile.nascimento || profile.data_batismo) && (
                <div className="pib-mute flex flex-wrap gap-x-4 gap-y-1 text-xs">
                  {profile.nascimento && <span>Nascimento · {formatDate(profile.nascimento)}</span>}
                  {profile.data_batismo && <span>Batismo · {formatDate(profile.data_batismo)}</span>}
                </div>
              )}
            </div>
          )}
        </DsPanel>
      </DsSection>

      <DsSection
        title="Ministérios"
        action={
          <DsBtn href="/form-ministerios" variant="ghost" size="sm">
            Quero servir
          </DsBtn>
        }
      >
        {profile.ministerios?.length > 0 ? (
          <DsList>
            {profile.ministerios.map((m: any) => (
              <DsRow
                key={m.nome}
                as="div"
                leading={<MinistryIcon mono name={m.icone} ministryName={m.nome} size={20} />}
                title={m.nome}
                trailing={m.is_lider ? <Crown className="h-4 w-4" /> : <span className="inline-block h-4 w-4" />}
              />
            ))}
          </DsList>
        ) : (
          <DsEmpty
            title="Você ainda não participa de um ministério"
            description="Conte pra gente como você quer servir."
            action={
              <DsBtn href="/form-ministerios" size="sm">
                Quero servir
              </DsBtn>
            }
          />
        )}
      </DsSection>

      <DsSection
        title="Dons"
        action={
          <DsBtn href="/form-dons-espirituais" variant="ghost" size="sm">
            Refazer teste
          </DsBtn>
        }
      >
        {donsTop.length > 0 ? (
          <DsList>
            {donsTop.map((r: any) => (
              <DsRow
                key={r.gift}
                as="div"
                leading={<span className="pib-kicker w-6 shrink-0">{r.rank}°</span>}
                title={r.gift}
                trailing={<span className="pib-mute text-xs">{r.score}/12</span>}
              />
            ))}
          </DsList>
        ) : (
          <DsEmpty
            title="Você ainda não fez o teste"
            description="Descubra seus dons espirituais em poucos minutos."
            action={
              <DsBtn href="/form-dons-espirituais" size="sm">
                Fazer teste
              </DsBtn>
            }
          />
        )}
      </DsSection>

      <IndisponibilidadesSection />

      <DsSection title="Conta">
        <div className="space-y-2">
          {isPreview && (
            <Link
              href={APP_PATHS.v1.perfil}
              onClick={() => switchTo("v1")}
              className="pib-btn pib-btn--ghost w-full"
            >
              Voltar à versão atual
            </Link>
          )}
          <DsBtn variant="ghost" className="w-full" onClick={() => signOut({ callbackUrl: "/" })}>
            Sair da conta
          </DsBtn>
        </div>
      </DsSection>
    </DsPage>
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
    <DsSection
      title="Indisponibilidades"
      action={
        <DsBtn variant="ghost" size="icon" onClick={() => setAdding(!adding)}>
          {adding ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        </DsBtn>
      }
    >
      {adding && (
        <DsPanel className="space-y-3 p-4">
          <div className="grid grid-cols-2 gap-3">
            <DsField label="De">
              <Input
                type="date"
                value={dataInicio}
                onChange={(e) => {
                  setDataInicio(e.target.value)
                  if (!dataFim) setDataFim(e.target.value)
                }}
              />
            </DsField>
            <DsField label="Até">
              <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
            </DsField>
          </div>
          <DsField label="Motivo (opcional)">
            <Input value={motivo} onChange={(e) => setMotivo(e.target.value)} />
          </DsField>
          <DsBtn className="w-full" onClick={handleAdd} disabled={saving || !dataInicio || !dataFim}>
            {saving ? "Salvando..." : "Adicionar"}
          </DsBtn>
        </DsPanel>
      )}

      {items?.length > 0 ? (
        <DsList>
          {items.map((item: any) => (
            <DsRow
              key={item.id}
              as="div"
              leading={<CalendarOff className="h-4 w-4 shrink-0" />}
              title={
                <>
                  {formatDate(item.data_inicio)}
                  {item.data_inicio !== item.data_fim && ` — ${formatDate(item.data_fim)}`}
                </>
              }
              meta={item.motivo || undefined}
              trailing={
                <DsBtn variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </DsBtn>
              }
            />
          ))}
        </DsList>
      ) : !adding ? (
        <p className="pib-mute text-xs">Nenhuma indisponibilidade registrada</p>
      ) : null}
    </DsSection>
  )
}
