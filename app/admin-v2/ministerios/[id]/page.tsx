"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { useSession } from "next-auth/react"
import useSWR from "swr"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertCircle, Bell, Check, ChevronDown, Loader2, Plus, Share2, Trash2, X } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { SearchableSelect } from "@/components/searchable-select"
import { UserProfileDialog } from "@/components/user-profile-dialog"
import { MinistryIcon } from "@/components/ministry-icon"
import { AdminScreen } from "@/components/app-v2/admin-screen"
import {
  DsBtn,
  DsChip,
  DsEmpty,
  DsList,
  DsRow,
  DsSection,
  DsStatus,
  RoleBadgesV2,
  useDsConfirm,
} from "@/components/app-v2/ds"

const fetcher = (url: string) => fetch(url).then(r => r.json())

const STATUS_TONE: Record<string, "pending" | "ok" | "no"> = {
  pendente: "pending",
  confirmado: "ok",
  recusado: "no",
}

export default function MinisterioDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: session } = useSession()
  const [eventoId, setEventoId] = useState("")
  const { data: eventos } = useSWR("/api/eventos", fetcher)
  const selectedEventoDate = eventos?.find((e: any) => e.id === eventoId)?.data?.split("T")[0] as string | undefined
  const { data: ministerio, mutate: mutateMin } = useSWR(
    `/api/ministerios/${id}${selectedEventoDate ? `?data=${selectedEventoDate}` : ""}`,
    fetcher
  )
  const { data: funcoes, mutate: mutateFuncoes } = useSWR(`/api/ministerios/${id}/funcoes`, fetcher)
  const { data: allMinEscalas } = useSWR(`/api/escalas?ministerio_id=${id}`, fetcher)
  const { data: lastEscalas } = useSWR(`/api/escalas?ministerio_id=${id}&future=false`, fetcher)
  const [novaFuncao, setNovaFuncao] = useState("")
  const { ask, node: confirmNode } = useDsConfirm()

  const { data: escalas, mutate: mutateEscalas } = useSWR(eventoId ? `/api/escalas?evento_id=${eventoId}` : null, fetcher)
  const { data: eventoPosicoes } = useSWR(eventoId ? `/api/eventos/${eventoId}/posicoes` : null, fetcher)
  const [addOpen, setAddOpen] = useState(false)
  const [addUser, setAddUser] = useState("")
  const [addFuncao, setAddFuncao] = useState("")
  const [conflictDialog, setConflictDialog] = useState<any>(null)
  const [notifying, setNotifying] = useState(false)

  const isAdmin = session?.user?.role === "admin"
  const pendentes = ministerio?.membros?.filter((m: any) => m.pendente) || []
  const lider = ministerio?.membros?.filter((m: any) => m.is_lider && !m.pendente) || []
  const membros = ministerio?.membros?.filter((m: any) => !m.pendente) || []
  const minEscalas = escalas?.filter((e: any) => e.ministerio_id === id) || []
  const [editMembro, setEditMembro] = useState<any>(null)

  const handleUpdateRole = async (userId: string, role: string) => {
    await fetch("/api/users", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: userId, role }) })
    toast({ title: "Papel atualizado" }); setEditMembro(null); mutateMin()
  }

  const handleAceitarMembro = async (userId: string) => {
    await fetch("/api/users/ministerios", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, ministerio_id: id, pendente: false }) })
    toast({ title: "Membro aceito" }); mutateMin()
  }

  const handleRecusarMembro = async (userId: string) => {
    await fetch("/api/users/ministerios", { method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, ministerio_id: id }) })
    toast({ title: "Solicitação recusada" }); mutateMin()
  }

  const now = new Date()
  const todayUTC = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
  const futureEventos = eventos?.filter((e: any) => new Date(e.data) >= todayUTC)
    .sort((a: any, b: any) => new Date(a.data).getTime() - new Date(b.data).getTime())

  const handleAddFuncao = async () => {
    if (!novaFuncao.trim()) return
    const res = await fetch(`/api/ministerios/${id}/funcoes`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome: novaFuncao.trim() }),
    })
    if (res.ok) { toast({ title: "Função criada" }); mutateFuncoes(); setNovaFuncao("") }
    else if (res.status === 409) toast({ title: "Função já existe", variant: "destructive" })
  }

  const handleRemoveFuncao = async (funcaoId: string) => {
    const ok = await ask({ title: "Remover função?", danger: true, confirmLabel: "Remover" })
    if (!ok) return
    await fetch(`/api/ministerios/${id}/funcoes`, {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ funcao_id: funcaoId }),
    })
    toast({ title: "Função removida" }); mutateFuncoes()
  }

  const handleEscalar = async () => {
    if (!eventoId || !addUser) return
    const res = await fetch("/api/escalas", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ evento_id: eventoId, ministerio_id: id, user_id: addUser, funcao: addFuncao || null }),
    })
    if (res.status === 409) { setConflictDialog(await res.json()); return }
    if (res.ok) {
      const data = await res.json()
      if (data.warning) toast({ title: "Aviso", description: data.warning })
      else toast({ title: "Membro escalado" })
      mutateEscalas(); setAddOpen(false); setAddUser(""); setAddFuncao("")
    }
  }

  const handleRemoveEscala = async (escalaId: string) => {
    const ok = await ask({ title: "Remover da escala?", danger: true, confirmLabel: "Remover" })
    if (!ok) return
    await fetch(`/api/escalas/${escalaId}`, { method: "DELETE" })
    toast({ title: "Removido da escala" }); mutateEscalas()
  }

  const handleStatus = async (escalaId: string, status: string) => {
    const res = await fetch(`/api/escalas/${escalaId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      toast({
        title: err.error || "Não foi possível atualizar o status",
        variant: "destructive",
      })
      return
    }
    toast({ title: `Status: ${status}` }); mutateEscalas()
  }

  const selectedEvento = futureEventos?.find((e: any) => e.id === eventoId)

  const handleShareWhatsApp = () => {
    if (!selectedEvento || minEscalas.length === 0) return
    const data = new Date(selectedEvento.data).toLocaleDateString("pt-BR", { timeZone: "UTC" })
    let text = `*Escala - ${ministerio.nome}*\n${selectedEvento.titulo} — ${data}${selectedEvento.horario ? ` às ${selectedEvento.horario}` : ""}\n\n`
    minEscalas.forEach((e: any) => { text += `• ${e.user_nome}${e.funcao ? ` (${e.funcao})` : ""}\n` })

    if (navigator.share) {
      navigator.share({ text }).catch(() => {})
    } else {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank")
    }
  }

  const handleNotifyEscalados = async () => {
    if (!eventoId || minEscalas.length === 0) return
    setNotifying(true)
    try {
      const res = await fetch("/api/escalas/notify", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ evento_id: eventoId, ministerio_id: id }),
      })
      const data = await res.json()
      if (res.ok) toast({ title: "Notificações enviadas", description: `${data.total} escalado(s) notificado(s)` })
      else toast({ title: "Erro ao notificar", description: data.error, variant: "destructive" })
    } catch { toast({ title: "Erro ao notificar", variant: "destructive" }) }
    finally { setNotifying(false) }
  }

  if (!ministerio) {
    return (
      <AdminScreen kicker="Ministério" title="Carregando…">
        <p className="pib-mute text-sm">Buscando dados do ministério…</p>
      </AdminScreen>
    )
  }

  return (
    <AdminScreen
      kicker="Ministério"
      title={ministerio.nome}
      subtitle={ministerio.descricao || "Pedidos, time e escala do culto"}
      action={
        <MinistryIcon
          name={ministerio.icone}
          ministryName={ministerio.nome}
          mono
          size={36}
        />
      }
    >
      {/* 1. Pedidos pendentes */}
      {pendentes.length > 0 && (
        <DsSection title={`Pedidos pendentes (${pendentes.length})`}>
          <DsList>
            {pendentes.map((m: any) => (
              <DsRow
                key={m.user_id}
                as="div"
                leading={
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={m.foto_url} />
                    <AvatarFallback>{m.nome?.[0]}</AvatarFallback>
                  </Avatar>
                }
                title={m.nome}
                meta="Quer servir neste ministério"
                trailing={
                  <div className="flex items-center gap-1.5">
                    <DsBtn variant="ghost" size="icon" onClick={() => handleAceitarMembro(m.user_id)} aria-label="Aceitar">
                      <Check className="h-4 w-4" />
                    </DsBtn>
                    <DsBtn variant="ghost" size="icon" onClick={() => handleRecusarMembro(m.user_id)} aria-label="Recusar">
                      <X className="h-4 w-4" />
                    </DsBtn>
                  </div>
                }
              />
            ))}
          </DsList>
        </DsSection>
      )}

      {/* 2. Escala do culto */}
      <DsSection title="Escala do culto">
        {!eventoId ? (
          !futureEventos || futureEventos.length === 0 ? (
            <DsEmpty title="Nenhum evento futuro" description="Crie um evento na agenda para escalar o time." />
          ) : (
            <DsList>
              {futureEventos.map((ev: any) => {
                const d = new Date(ev.data)
                const data = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", timeZone: "UTC" }).replace(".", "")
                const evEscalas = allMinEscalas?.filter((e: any) => e.evento_id === ev.id) || []
                return (
                  <DsRow
                    key={ev.id}
                    onClick={() => setEventoId(ev.id)}
                    title={ev.titulo}
                    meta={
                      evEscalas.length > 0
                        ? `${data}${ev.horario ? ` · ${ev.horario}` : ""} — ${evEscalas.map((e: any) => e.user_nome).join(", ")}`
                        : `${data}${ev.horario ? ` · ${ev.horario}` : ""}`
                    }
                  />
                )
              })}
            </DsList>
          )
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <DsBtn variant="ghost" size="sm" onClick={() => setEventoId("")}>
                ← Eventos
              </DsBtn>
              <DsBtn size="sm" onClick={() => { setAddOpen(true); setAddUser(""); setAddFuncao("") }}>
                <Plus className="h-4 w-4" /> Escalar
              </DsBtn>
            </div>

            {selectedEvento && (
              <div className="pib-panel p-4">
                <p className="text-sm font-semibold">{selectedEvento.titulo}</p>
                <p className="pib-mute text-xs">
                  {new Date(selectedEvento.data).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", timeZone: "UTC" })}
                  {selectedEvento.horario ? ` · ${selectedEvento.horario}` : ""}
                </p>
              </div>
            )}

            {eventoPosicoes?.filter((p: any) => p.ministerio_id === id).length > 0 && (
              <div className="space-y-2">
                <p className="pib-mute text-sm">Posições necessárias:</p>
                <DsList>
                  {eventoPosicoes.filter((p: any) => p.ministerio_id === id).map((p: any) => {
                    const assigned = minEscalas.filter((e: any) => e.funcao === p.funcao)
                    const filled = assigned.length
                    const isFull = filled >= p.quantidade
                    return (
                      <DsRow
                        key={p.id}
                        as={isFull ? "div" : "button"}
                        onClick={isFull ? undefined : () => { setAddOpen(true); setAddUser(""); setAddFuncao(p.funcao) }}
                        title={p.funcao}
                        meta={assigned.map((e: any) => e.user_nome).join(", ") || (isFull ? undefined : "Toque para escalar")}
                        trailing={<DsStatus tone={isFull ? "ok" : "pending"}>{filled}/{p.quantidade}</DsStatus>}
                      />
                    )
                  })}
                </DsList>
              </div>
            )}

            {minEscalas.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <DsBtn variant="ghost" size="sm" onClick={handleShareWhatsApp}>
                  <Share2 className="h-4 w-4" /> Compartilhar
                </DsBtn>
                <DsBtn variant="ghost" size="sm" onClick={handleNotifyEscalados} disabled={notifying}>
                  {notifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
                  Notificar
                </DsBtn>
              </div>
            )}

            {minEscalas.length === 0 ? (
              <DsEmpty title="Nenhum membro escalado" description="Escale alguém para este culto." />
            ) : (
              <DsList>
                {minEscalas.map((e: any) => (
                  <DsRow
                    key={e.id}
                    as="div"
                    leading={
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={e.foto_url} />
                        <AvatarFallback>{e.user_nome?.[0]}</AvatarFallback>
                      </Avatar>
                    }
                    title={e.user_nome}
                    meta={e.funcao}
                    trailing={
                      <div className="flex items-center gap-1.5">
                        <DsStatus tone={STATUS_TONE[e.status] || "neutral"}>{e.status}</DsStatus>
                        {e.status === "pendente" && (
                          <>
                            <DsBtn variant="ghost" size="icon" onClick={() => handleStatus(e.id, "confirmado")} aria-label="Confirmar">
                              <Check className="h-4 w-4" />
                            </DsBtn>
                            <DsBtn variant="ghost" size="icon" onClick={() => handleStatus(e.id, "recusado")} aria-label="Recusar">
                              <X className="h-4 w-4" />
                            </DsBtn>
                          </>
                        )}
                        <DsBtn variant="ghost" size="icon" onClick={() => handleRemoveEscala(e.id)} aria-label="Remover">
                          <Trash2 className="h-4 w-4" />
                        </DsBtn>
                      </div>
                    }
                  />
                ))}
              </DsList>
            )}
          </div>
        )}
      </DsSection>

      {/* 3. Time */}
      <DsSection title="Time">
        {lider.length === 0 && membros.filter((m: any) => !m.is_lider).length === 0 ? (
          <DsEmpty title="Nenhum membro neste ministério" />
        ) : (
          <DsList>
            {lider.map((l: any) => (
              <DsRow
                key={l.user_id}
                as={isAdmin ? "button" : "div"}
                onClick={isAdmin ? () => setEditMembro(l) : undefined}
                leading={
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={l.foto_url} />
                    <AvatarFallback>{l.nome?.[0]}</AvatarFallback>
                  </Avatar>
                }
                title={l.nome}
                meta="Líder"
                trailing={<RoleBadgesV2 legacyRole={l.role && l.role !== "membro" ? l.role : undefined} size="xs" />}
              />
            ))}
            {membros.filter((m: any) => !m.is_lider).map((m: any) => {
              const row = (
                <DsRow
                  as={isAdmin ? "button" : "div"}
                  onClick={isAdmin ? () => setEditMembro(m) : undefined}
                  leading={
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={m.foto_url} />
                      <AvatarFallback>{m.nome?.[0]}</AvatarFallback>
                    </Avatar>
                  }
                  title={m.nome}
                  trailing={<RoleBadgesV2 legacyRole={m.role && m.role !== "membro" ? m.role : undefined} size="xs" />}
                />
              )
              return isAdmin ? (
                <div key={m.user_id}>{row}</div>
              ) : (
                <UserProfileDialog key={m.user_id} userId={m.user_id}>
                  {row}
                </UserProfileDialog>
              )
            })}
          </DsList>
        )}
      </DsSection>

      {/* 4. Funções — accordion */}
      <details className="pib-panel group">
        <summary className="flex cursor-pointer list-none items-center justify-between p-4 text-sm font-semibold">
          Funções
          <ChevronDown className="h-4 w-4 shrink-0 text-[var(--pib-mute)] transition-transform group-open:rotate-180" />
        </summary>
        <div className="space-y-3 border-t border-[var(--pib-line)] p-4">
          {isAdmin && (
            <div className="flex gap-2">
              <Input
                placeholder="Nova função (ex: vocal, guitarra)"
                value={novaFuncao}
                onChange={e => setNovaFuncao(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleAddFuncao()}
              />
              <DsBtn onClick={handleAddFuncao} disabled={!novaFuncao.trim()}>
                <Plus className="h-4 w-4" />
              </DsBtn>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {funcoes?.map((f: any) => (
              <DsChip key={f.id}>
                {f.nome}
                {isAdmin && (
                  <button type="button" onClick={() => handleRemoveFuncao(f.id)} className="pib-mute hover:text-[var(--pib-ink)]">
                    <X className="h-3 w-3" />
                  </button>
                )}
              </DsChip>
            ))}
            {(!funcoes || funcoes.length === 0) && <p className="pib-mute text-sm">Nenhuma função cadastrada.</p>}
          </div>
        </div>
      </details>

      {/* Dialog escalar membro */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Escalar Membro</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Membro</Label>
              <SearchableSelect
                value={addUser}
                onValueChange={setAddUser}
                placeholder="Buscar membro..."
                options={membros.map((m: any) => {
                  const last = lastEscalas?.find((l: any) => l.user_id === m.user_id)
                  const lastDate = last ? new Date(last.data).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "UTC" }) : null
                  const subParts = [
                    m.is_lider ? "Líder" : null,
                    m.indisponivel ? "Indisponível nesta data" : null,
                    lastDate ? `Última: ${lastDate}` : null,
                  ].filter(Boolean)
                  return { value: m.user_id, label: m.nome, sublabel: subParts.length ? subParts.join(" · ") : undefined }
                })}
              />
            </div>
            <div>
              <Label>Função</Label>
              <Select value={addFuncao} onValueChange={setAddFuncao}>
                <SelectTrigger><SelectValue placeholder="Selecione (opcional)" /></SelectTrigger>
                <SelectContent>
                  {funcoes?.map((f: any) => (
                    <SelectItem key={f.id} value={f.nome}>{f.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DsBtn className="w-full" onClick={handleEscalar} disabled={!addUser}>Escalar</DsBtn>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog conflito */}
      <Dialog open={!!conflictDialog} onOpenChange={() => setConflictDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="flex items-center gap-2 text-destructive"><AlertCircle className="h-5 w-5" />Conflito de Escala</DialogTitle></DialogHeader>
          <p className="text-sm">{conflictDialog?.message}</p>
          <DsBtn variant="ghost" onClick={() => setConflictDialog(null)}>Entendi</DsBtn>
        </DialogContent>
      </Dialog>

      {/* Dialog editar membro */}
      {isAdmin && (
        <Dialog open={!!editMembro} onOpenChange={(v) => { if (!v) setEditMembro(null) }}>
          <DialogContent>
            <DialogHeader><DialogTitle>Editar {editMembro?.nome}</DialogTitle></DialogHeader>
            {editMembro && (
              <div className="space-y-4">
                <div>
                  <Label>Papel no sistema</Label>
                  <Select value={editMembro.role || "membro"} onValueChange={v => handleUpdateRole(editMembro.user_id, v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="supervisor">Supervisor</SelectItem>
                      <SelectItem value="lider">Líder</SelectItem>
                      <SelectItem value="membro">Membro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}

      {confirmNode}
    </AdminScreen>
  )
}
