"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { useSession } from "next-auth/react"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Trash2, Check, X, AlertCircle, Crown, Users, Tag, CalendarDays, Share2, Bell, Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { SearchableSelect } from "@/components/searchable-select"
import { UserProfileDialog } from "@/components/user-profile-dialog"
import { MinistryIcon } from "@/components/ministry-icon"

const fetcher = (url: string) => fetch(url).then(r => r.json())

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

  const statusBadge = (s: string) => {
    const map: Record<string, string> = { confirmado: "bg-green-100 text-green-700", pendente: "bg-yellow-100 text-yellow-700", recusado: "bg-red-100 text-red-700" }
    return map[s] || ""
  }

  if (!ministerio) return <div className="p-8 text-center text-muted-foreground">Carregando...</div>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <MinistryIcon name={ministerio.icone} ministryName={ministerio.nome} color={ministerio.cor} size={36} />
        <div>
          <h1 className="text-2xl font-bold">{ministerio.nome}</h1>
          {ministerio.descricao && <p className="text-muted-foreground text-sm">{ministerio.descricao}</p>}
        </div>
        <div className="ml-auto h-6 w-6 rounded-full border" style={{ backgroundColor: ministerio.cor }} />
      </div>

      <Tabs defaultValue="membros">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="membros"><Users className="h-4 w-4 mr-1" />Membros</TabsTrigger>
          <TabsTrigger value="funcoes"><Tag className="h-4 w-4 mr-1" />Funções</TabsTrigger>
          <TabsTrigger value="escala"><CalendarDays className="h-4 w-4 mr-1" />Escala</TabsTrigger>
        </TabsList>

        {/* Membros */}
        <TabsContent value="membros" className="mt-4">
          {pendentes.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-medium mb-2 text-orange-600">Solicitações pendentes ({pendentes.length})</p>
              <div className="space-y-2">
                {pendentes.map((m: any) => (
                  <div key={m.user_id} className="flex items-center justify-between border border-orange-200 bg-orange-50/50 rounded-lg p-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={m.foto_url} />
                        <AvatarFallback>{m.nome?.[0]}</AvatarFallback>
                      </Avatar>
                      <p className="text-sm font-medium truncate">{m.nome}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" onClick={() => handleAceitarMembro(m.user_id)}><Check className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => handleRecusarMembro(m.user_id)}><X className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {lider.map((l: any) => (
            <Card key={l.user_id} className={`border-amber-200 bg-amber-50/50 ${isAdmin ? "cursor-pointer hover:border-amber-300" : ""}`} onClick={() => isAdmin && setEditMembro(l)}>
              <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                <Avatar className="h-14 w-14">
                  <AvatarImage src={l.foto_url} />
                  <AvatarFallback>{l.nome?.[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm">{l.nome}</p>
                  <Badge className="mt-1 bg-amber-100 text-amber-700 gap-1 text-xs"><Crown className="h-3 w-3" />Líder</Badge>
                  {l.role && l.role !== "membro" && <span className={`text-[10px] px-1.5 py-0.5 rounded ml-1 ${l.role === "admin" ? "bg-red-100 text-red-700" : l.role === "supervisor" ? "bg-purple-100 text-purple-700" : ""}`}>{l.role}</span>}
                </div>
              </CardContent>
            </Card>
          ))}
          {membros.filter((m: any) => !m.is_lider).map((m: any) => (
            <UserProfileDialog key={m.user_id} userId={m.user_id}>
              <Card className={isAdmin ? "cursor-pointer hover:border-primary/30" : "cursor-pointer"} onClick={(e: any) => { if (isAdmin) { e.stopPropagation(); setEditMembro(m) } }}>
                <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={m.foto_url} />
                    <AvatarFallback>{m.nome?.[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{m.nome}</p>
                    {m.role && m.role !== "membro" && <span className={`text-[10px] px-1.5 py-0.5 rounded ${m.role === "admin" ? "bg-red-100 text-red-700" : m.role === "supervisor" ? "bg-purple-100 text-purple-700" : m.role === "lider" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}`}>{m.role}</span>}
                  </div>
                </CardContent>
              </Card>
            </UserProfileDialog>
          ))}
          </div>
          {membros.length === 0 && <p className="text-center text-muted-foreground py-4">Nenhum membro neste ministério.</p>}
        </TabsContent>

        {/* Funções */}
        <TabsContent value="funcoes" className="space-y-4 mt-4">
          {isAdmin && (
            <div className="flex gap-2">
              <Input placeholder="Nova função (ex: vocal, guitarra)" value={novaFuncao} onChange={e => setNovaFuncao(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleAddFuncao()} />
              <Button onClick={handleAddFuncao} disabled={!novaFuncao.trim()}><Plus className="h-4 w-4" /></Button>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {funcoes?.map((f: any) => (
              <Badge key={f.id} variant="secondary" className="text-sm gap-1 py-1 px-3">
                {f.nome}
                {isAdmin && (
                  <button onClick={() => handleRemoveFuncao(f.id)} className="ml-1 hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                )}
              </Badge>
            ))}
            {(!funcoes || funcoes.length === 0) && <p className="text-muted-foreground text-sm">Nenhuma função cadastrada.</p>}
          </div>
        </TabsContent>

        {/* Escala */}
        <TabsContent value="escala" className="space-y-4 mt-4">
          {!eventoId ? (
            <>
              <p className="text-sm text-muted-foreground">Selecione um evento para gerenciar a escala:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {futureEventos?.map((ev: any) => {
                  const d = new Date(ev.data)
                  const dia = d.toLocaleDateString("pt-BR", { day: "2-digit", timeZone: "UTC" })
                  const mes = d.toLocaleDateString("pt-BR", { month: "short", timeZone: "UTC" }).replace(".", "")
                  return (
                    <Card key={ev.id} className="cursor-pointer hover:border-primary/30 transition-colors" onClick={() => setEventoId(ev.id)}>
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className="flex flex-col items-center justify-center rounded-lg bg-primary/10 text-primary min-w-[3rem] py-2 px-2">
                          <span className="text-lg font-bold leading-none">{dia}</span>
                          <span className="text-[10px] uppercase font-medium mt-0.5">{mes}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm truncate">{ev.titulo}</p>
                          <p className="text-xs text-muted-foreground">{ev.horario || ev.tipo}</p>
                          {(() => {
                            const evEscalas = allMinEscalas?.filter((e: any) => e.evento_id === ev.id) || []
                            if (evEscalas.length === 0) return null
                            return (
                              <p className="text-[11px] text-muted-foreground mt-1 truncate">
                                <Users className="h-3 w-3 inline mr-1" />
                                {evEscalas.map((e: any) => e.user_nome).join(", ")}
                              </p>
                            )
                          })()}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
                {(!futureEventos || futureEventos.length === 0) && (
                  <p className="text-center text-muted-foreground py-4 col-span-full">Nenhum evento futuro.</p>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={() => setEventoId("")}>
                  ← Voltar aos eventos
                </Button>
                <Button onClick={() => { setAddOpen(true); setAddUser(""); setAddFuncao("") }}>
                  <Plus className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">Escalar</span>
                </Button>
              </div>

              {selectedEvento && (
                <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
                  <div className="flex flex-col items-center justify-center rounded-lg bg-primary/10 text-primary min-w-[3rem] py-2 px-2">
                    <span className="text-lg font-bold leading-none">{new Date(selectedEvento.data).toLocaleDateString("pt-BR", { day: "2-digit", timeZone: "UTC" })}</span>
                    <span className="text-[10px] uppercase font-medium mt-0.5">{new Date(selectedEvento.data).toLocaleDateString("pt-BR", { month: "short", timeZone: "UTC" }).replace(".", "")}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{selectedEvento.titulo}</p>
                    <p className="text-xs text-muted-foreground">{selectedEvento.horario || ""} {selectedEvento.tipo}</p>
                  </div>
                </div>
              )}

              {/* Posições necessárias como cards clicáveis */}
              {eventoPosicoes?.filter((p: any) => p.ministerio_id === id).length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Posições necessárias:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {eventoPosicoes.filter((p: any) => p.ministerio_id === id).map((p: any) => {
                      const assigned = minEscalas.filter((e: any) => e.funcao === p.funcao)
                      const filled = assigned.length
                      const isFull = filled >= p.quantidade
                      return (
                        <Card key={p.id} className={`cursor-pointer transition-colors ${isFull ? "border-green-200 bg-green-50/50" : "hover:border-primary/30"}`}
                          onClick={() => { if (!isFull) { setAddOpen(true); setAddUser(""); setAddFuncao(p.funcao) } }}>
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-sm">{p.funcao}</span>
                              <Badge variant={isFull ? "default" : "outline"} className="text-xs">{filled}/{p.quantidade}</Badge>
                            </div>
                            {assigned.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {assigned.map((e: any) => (
                                  <span key={e.id} className="text-xs text-muted-foreground">{e.user_nome}</span>
                                ))}
                              </div>
                            )}
                            {!isFull && <p className="text-xs text-primary mt-1">Toque para escalar</p>}
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </div>
              )}

              {minEscalas.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={handleShareWhatsApp}>
                    <Share2 className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">Compartilhar</span>
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleNotifyEscalados} disabled={notifying}>
                    {notifying ? <Loader2 className="h-4 w-4 sm:mr-1 animate-spin" /> : <Bell className="h-4 w-4 sm:mr-1" />}
                    <span className="hidden sm:inline">Notificar</span>
                  </Button>
                </div>
              )}

              {minEscalas.length === 0 && (
                <p className="text-center text-muted-foreground py-4">Nenhum membro escalado para este evento.</p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {minEscalas.map((e: any) => (
                <Card key={e.id}>
                  <CardContent className="p-4 flex flex-col items-center text-center gap-2 relative">
                    <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-7 w-7 text-destructive" onClick={() => handleRemoveEscala(e.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    <Avatar className="h-14 w-14">
                      <AvatarImage src={e.foto_url} />
                      <AvatarFallback>{e.user_nome?.[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{e.user_nome}</p>
                      {e.funcao && <p className="text-xs text-muted-foreground">{e.funcao}</p>}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${statusBadge(e.status)}`}>{e.status}</span>
                      {e.status === "pendente" && (
                        <>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-green-600" onClick={() => handleStatus(e.id, "confirmado")}><Check className="h-3 w-3" /></Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-red-600" onClick={() => handleStatus(e.id, "recusado")}><X className="h-3 w-3" /></Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

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
            <Button className="w-full" onClick={handleEscalar} disabled={!addUser}>Escalar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog conflito */}
      <Dialog open={!!conflictDialog} onOpenChange={() => setConflictDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="flex items-center gap-2 text-destructive"><AlertCircle className="h-5 w-5" />Conflito de Escala</DialogTitle></DialogHeader>
          <p className="text-sm">{conflictDialog?.message}</p>
          <Button variant="outline" onClick={() => setConflictDialog(null)}>Entendi</Button>
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
    </div>
  )
}
