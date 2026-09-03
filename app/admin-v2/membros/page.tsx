"use client"

import { useMemo, useState } from "react"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Search, Plus, X, Crown, Trash2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import type { RoleBadgeItem } from "@/components/role-badges"
import { AdminScreen, AdminPrimaryAction } from "@/components/app-v2/admin-screen"
import { DsEmpty, DsList, DsRow, DsStatus, RoleBadgesV2 } from "@/components/app-v2/ds"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const GLOBAL_ROLES = [
  { value: "admin", label: "Administrador" },
  { value: "supervisor", label: "Supervisor" },
  { value: "membro", label: "Membro" },
  { value: "congregado", label: "Congregado" },
  { value: "visitante", label: "Visitante" },
]

function primaryRole(user: any): RoleBadgeItem {
  if (user.roles?.length) {
    const global = user.roles.find((r: RoleBadgeItem) => !r.context_id || r.context_type === "global")
    return global || user.roles[0]
  }
  return { role_name: user.role === "visitor" ? "visitante" : user.role || "membro" }
}

export default function MembrosAdminPage() {
  const { data: users, mutate } = useSWR("/api/users", fetcher)
  const { data: ministerios } = useSWR("/api/ministerios", fetcher)
  const [search, setSearch] = useState("")
  const [filterMin, setFilterMin] = useState("all")
  const [editUser, setEditUser] = useState<any>(null)
  const [addMinId, setAddMinId] = useState("")
  const [editNome, setEditNome] = useState("")
  const [addRoleName, setAddRoleName] = useState("membro")
  const [addRoleMinistry, setAddRoleMinistry] = useState("")
  const [busy, setBusy] = useState(false)

  const filtered = useMemo(() => {
    if (!users) return null
    const q = search.trim().toLowerCase()
    return users
      .filter((u: any) => {
        const matchSearch =
          !q ||
          u.nome?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q)
        const matchMin =
          filterMin === "all"
            ? true
            : filterMin === "none"
              ? !u.ministerios?.length
              : u.ministerios?.some((m: any) => m.ministerio_id === filterMin)
        return matchSearch && matchMin
      })
      .sort((a: any, b: any) => (a.nome || "").localeCompare(b.nome || "", "pt-BR"))
  }, [users, search, filterMin])

  const openEdit = (u: any) => {
    setEditUser(u)
    setEditNome(u.nome || "")
    setAddMinId("")
    setAddRoleName("membro")
    setAddRoleMinistry("")
  }

  const refreshEditUser = async (id: string) => {
    const updated = await mutate()
    const list = updated || (await fetch("/api/users").then((r) => r.json()))
    const fresh = list?.find((u: any) => u.id === id)
    if (fresh) setEditUser(fresh)
  }

  const handleUpdate = async (id: string, data: any) => {
    setBusy(true)
    try {
      await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...data }),
      })
      toast({ title: "Usuário atualizado" })
      await refreshEditUser(id)
    } finally {
      setBusy(false)
    }
  }

  const handleAddMinisterio = async (userId: string) => {
    if (!addMinId) return
    setBusy(true)
    try {
      await fetch("/api/users/ministerios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, ministerio_id: addMinId }),
      })
      toast({ title: "Ministério vinculado" })
      setAddMinId("")
      await refreshEditUser(userId)
    } finally {
      setBusy(false)
    }
  }

  const handleRemoveMinisterio = async (userId: string, ministerioId: string) => {
    setBusy(true)
    try {
      await fetch("/api/users/ministerios", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, ministerio_id: ministerioId }),
      })
      toast({ title: "Ministério desvinculado" })
      await refreshEditUser(userId)
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async (id: string) => {
    setBusy(true)
    try {
      await fetch("/api/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      toast({ title: "Usuário deletado" })
      setEditUser(null)
      mutate()
    } finally {
      setBusy(false)
    }
  }

  const handleToggleLider = async (userId: string, ministerioId: string, isLider: boolean) => {
    setBusy(true)
    try {
      await fetch("/api/users/ministerios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          ministerio_id: ministerioId,
          is_lider: !isLider,
        }),
      })
      toast({ title: isLider ? "Removido como líder" : "Promovido a líder" })
      await refreshEditUser(userId)
    } finally {
      setBusy(false)
    }
  }

  const handleAddRole = async (userId: string) => {
    const body: any = { role_name: addRoleName }
    if (addRoleName === "lider") {
      if (!addRoleMinistry) return
      body.ministerio_id = addRoleMinistry
    }

    setBusy(true)
    try {
      const res = await fetch(`/api/accounts/${userId}/roles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast({
          title: "Erro ao adicionar papel",
          description: err.error || err.message,
          variant: "destructive",
        })
        return
      }
      toast({ title: "Papel adicionado" })
      setAddRoleName("membro")
      setAddRoleMinistry("")
      await refreshEditUser(userId)
    } finally {
      setBusy(false)
    }
  }

  const handleRemoveRole = async (userId: string, role: RoleBadgeItem) => {
    const body: any = {
      role_name: role.role_name,
      context_id: role.context_id || null,
    }
    if (role.context_type === "ministry" && role.context_id) {
      const min = ministerios?.find((m: any) => m.nome === role.context_name)
      if (min) body.ministerio_id = min.id
    }
    setBusy(true)
    try {
      const res = await fetch(`/api/accounts/${userId}/roles`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        toast({ title: "Erro ao remover papel", variant: "destructive" })
        return
      }
      toast({ title: "Papel removido" })
      await refreshEditUser(userId)
    } finally {
      setBusy(false)
    }
  }

  const rolesList: RoleBadgeItem[] = editUser
    ? editUser.roles?.length
      ? editUser.roles
      : [{ role_name: editUser.role === "visitor" ? "visitante" : editUser.role }]
    : []

  return (
    <AdminScreen
      kicker="Igreja"
      title="Pessoas"
      subtitle={
        filtered
          ? `${filtered.length} pessoa${filtered.length !== 1 ? "s" : ""} — papéis e ministérios`
          : "Carregando…"
      }
    >
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou email"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterMin} onValueChange={setFilterMin}>
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue placeholder="Ministério" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os ministérios</SelectItem>
            <SelectItem value="none">Sem ministério</SelectItem>
            {ministerios?.map((m: any) => (
              <SelectItem key={m.id} value={m.id}>
                {m.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!filtered ? (
        <p className="pib-mute py-8 text-center text-sm">Carregando membros…</p>
      ) : filtered.length === 0 ? (
        <DsEmpty title="Nenhum membro encontrado" />
      ) : (
        <DsList>
          {filtered.map((u: any) => {
            const role = primaryRole(u)
            const minCount = u.ministerios?.length || 0
            const liderCount = u.ministerios?.filter((m: any) => m.is_lider).length || 0
            return (
              <DsRow
                key={u.id}
                onClick={() => openEdit(u)}
                leading={
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={u.foto_url} />
                    <AvatarFallback>{u.nome?.[0]}</AvatarFallback>
                  </Avatar>
                }
                title={
                  <span className="flex items-center gap-2">
                    <span className="truncate">{u.nome}</span>
                    {!u.ativo && <DsStatus tone="no">Inativo</DsStatus>}
                  </span>
                }
                meta={
                  <span className="flex flex-col gap-1">
                    <span className="truncate">{u.email}</span>
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <RoleBadgesV2 roles={[role]} size="xs" />
                      {u.roles?.length > 1 && (
                        <span>+{u.roles.length - 1} papel{u.roles.length > 2 ? "es" : ""}</span>
                      )}
                      {minCount > 0 && (
                        <span>
                          {minCount} ministério{minCount !== 1 ? "s" : ""}
                          {liderCount > 0 ? ` · ${liderCount} liderança${liderCount !== 1 ? "s" : ""}` : ""}
                        </span>
                      )}
                    </span>
                  </span>
                }
              />
            )
          })}
        </DsList>
      )}

      <Dialog
        open={!!editUser}
        onOpenChange={(v) => {
          if (!v) setEditUser(null)
        }}
      >
        <DialogContent className="max-h-[90vh] gap-0 overflow-hidden p-0 sm:max-w-lg">
          {editUser && (
            <>
              <DialogHeader className="space-y-3 border-b px-5 py-4 text-left">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={editUser.foto_url} />
                    <AvatarFallback>{editUser.nome?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <DialogTitle className="truncate text-base">{editUser.nome}</DialogTitle>
                    <p className="truncate text-sm text-muted-foreground">{editUser.email}</p>
                  </div>
                </div>
                <RoleBadgesV2
                  roles={editUser.roles}
                  legacyRole={editUser.role}
                  size="xs"
                />
              </DialogHeader>

              <div className="max-h-[calc(90vh-8rem)] space-y-6 overflow-y-auto px-5 py-5">
                {/* Dados */}
                <section className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Dados
                  </h3>
                  <div className="space-y-1.5">
                    <Label htmlFor="membro-nome">Nome</Label>
                    <div className="flex gap-2">
                      <Input
                        id="membro-nome"
                        value={editNome}
                        onChange={(e) => setEditNome(e.target.value)}
                      />
                      <Button
                        size="sm"
                        disabled={busy || !editNome.trim() || editNome === editUser.nome}
                        onClick={() => handleUpdate(editUser.id, { nome: editNome })}
                      >
                        Salvar
                      </Button>
                    </div>
                  </div>
                  <div className="rounded-lg border divide-y">
                    <div className="flex items-center justify-between px-3 py-2.5">
                      <Label htmlFor="ativo" className="font-normal">
                        Conta ativa
                      </Label>
                      <Switch
                        id="ativo"
                        checked={!!editUser.ativo}
                        disabled={busy}
                        onCheckedChange={(v) => handleUpdate(editUser.id, { ativo: v })}
                      />
                    </div>
                    <div className="flex items-center justify-between px-3 py-2.5">
                      <div>
                        <Label htmlFor="escala-mult" className="font-normal">
                          Escala múltipla
                        </Label>
                        <p className="text-[11px] text-muted-foreground">
                          Pode servir em mais de um ministério no mesmo evento
                        </p>
                      </div>
                      <Switch
                        id="escala-mult"
                        checked={!!editUser.permite_escala_multipla}
                        disabled={busy}
                        onCheckedChange={(v) =>
                          handleUpdate(editUser.id, { permite_escala_multipla: v })
                        }
                      />
                    </div>
                  </div>
                </section>

                <Separator />

                {/* Papéis */}
                <section className="space-y-3">
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Papéis no sistema
                    </h3>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      Admin, membro, etc. Líder de ministério fica em Ministérios abaixo.
                    </p>
                  </div>

                  <ul className="space-y-1.5">
                    {rolesList.map((role, idx) => (
                      <li
                        key={`${role.role_name}-${role.context_id || "g"}-${idx}`}
                        className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2"
                      >
                        <RoleBadgesV2 roles={[role]} size="sm" />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          disabled={busy || rolesList.length <= 1}
                          title={
                            rolesList.length <= 1
                              ? "Mantenha ao menos um papel"
                              : "Remover papel"
                          }
                          onClick={() => handleRemoveRole(editUser.id, role)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </li>
                    ))}
                  </ul>

                  <div className="flex flex-col gap-2 rounded-lg bg-muted/40 p-3">
                    <Label className="text-xs text-muted-foreground">Adicionar papel</Label>
                    <div className="flex gap-2">
                      <Select
                        value={addRoleName}
                        onValueChange={(v) => {
                          setAddRoleName(v)
                          if (v !== "lider") setAddRoleMinistry("")
                        }}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {GLOBAL_ROLES.map((r) => (
                            <SelectItem key={r.value} value={r.value}>
                              {r.label}
                            </SelectItem>
                          ))}
                          <SelectItem value="lider">Líder (com ministério)</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        disabled={
                          busy || (addRoleName === "lider" && !addRoleMinistry)
                        }
                        onClick={() => handleAddRole(editUser.id)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {addRoleName === "lider" && (
                      <Select value={addRoleMinistry} onValueChange={setAddRoleMinistry}>
                        <SelectTrigger>
                          <SelectValue placeholder="Escolha o ministério" />
                        </SelectTrigger>
                        <SelectContent>
                          {ministerios?.map((m: any) => (
                            <SelectItem key={m.id} value={m.id}>
                              {m.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </section>

                <Separator />

                {/* Ministérios */}
                <section className="space-y-3">
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Ministérios
                    </h3>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      Participação e liderança. Promover a líder sincroniza o papel contextual.
                    </p>
                  </div>

                  {(editUser.ministerios?.length ?? 0) === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum ministério vinculado.</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {editUser.ministerios.map((m: any) => (
                        <li
                          key={m.ministerio_id}
                          className="flex items-center gap-2 rounded-lg border px-3 py-2"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{m.nome}</p>
                            {m.is_lider && (
                              <p className="flex items-center gap-1 text-[11px] text-primary">
                                <Crown className="h-3 w-3" /> Líder
                              </p>
                            )}
                          </div>
                          <Button
                            variant={m.is_lider ? "secondary" : "outline"}
                            size="sm"
                            className="h-8 shrink-0 text-xs"
                            disabled={busy}
                            onClick={() =>
                              handleToggleLider(editUser.id, m.ministerio_id, m.is_lider)
                            }
                          >
                            <Crown className="mr-1 h-3 w-3" />
                            {m.is_lider ? "Remover" : "Líder"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                            disabled={busy}
                            onClick={() =>
                              handleRemoveMinisterio(editUser.id, m.ministerio_id)
                            }
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="flex gap-2">
                    <Select value={addMinId} onValueChange={setAddMinId}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Vincular ministério" />
                      </SelectTrigger>
                      <SelectContent>
                        {ministerios
                          ?.filter(
                            (m: any) =>
                              !editUser.ministerios?.some(
                                (em: any) => em.ministerio_id === m.id
                              )
                          )
                          .map((m: any) => (
                            <SelectItem key={m.id} value={m.id}>
                              {m.nome}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      disabled={busy || !addMinId}
                      onClick={() => handleAddMinisterio(editUser.id)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </section>

                <Separator />

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full text-destructive border-destructive/30 hover:bg-destructive/5">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir usuário
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir {editUser.nome}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Ação irreversível. O usuário e os dados vinculados serão removidos.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={() => handleDelete(editUser.id)}
                      >
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AdminScreen>
  )
}
