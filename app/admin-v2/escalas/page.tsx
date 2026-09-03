"use client";

import { useState } from "react";
import useSWR from "swr";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertCircle, Check, Plus, Trash2, X } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { SearchableSelect } from "@/components/searchable-select";
import { MinistryIcon } from "@/components/ministry-icon";
import { AdminScreen } from "@/components/app-v2/admin-screen";
import { DsBtn, DsChip, DsEmpty, DsList, DsRow, DsStatus, DsWell, useDsConfirm } from "@/components/app-v2/ds";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const STATUS_TONE: Record<string, "pending" | "ok" | "no"> = {
  pendente: "pending",
  confirmado: "ok",
  recusado: "no",
};

export default function EscalasAdminPage() {
  const { data: eventos } = useSWR("/api/eventos", fetcher);
  const { data: ministerios } = useSWR("/api/ministerios", fetcher);
  const [eventoId, setEventoId] = useState("");
  const [ministerioFiltro, setMinisterioFiltro] = useState("todos");
  const { data: escalas, mutate } = useSWR(
    eventoId ? `/api/escalas?evento_id=${eventoId}` : null,
    fetcher,
  );
  const [addOpen, setAddOpen] = useState(false);
  const [addMin, setAddMin] = useState("");
  const [addUser, setAddUser] = useState("");
  const [addFuncao, setAddFuncao] = useState("");
  const [conflictDialog, setConflictDialog] = useState<any>(null);
  const { ask, node: confirmNode } = useDsConfirm();

  // Busca membros e funções do ministério selecionado
  const selectedEventoDate = eventos?.find((e: any) => e.id === eventoId)?.data?.split("T")[0]
  const { data: minDetail } = useSWR(
    addMin
      ? `/api/ministerios/${addMin}${selectedEventoDate ? `?data=${selectedEventoDate}` : ""}`
      : null,
    fetcher,
  );
  const { data: minFuncoes } = useSWR(
    addMin ? `/api/ministerios/${addMin}/funcoes` : null,
    fetcher,
  );

  const todayUTC = new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()))
  const futureEventos = eventos
    ?.filter(
      (e: any) => new Date(e.data) >= todayUTC,
    )
    .sort(
      (a: any, b: any) =>
        new Date(a.data).getTime() - new Date(b.data).getTime(),
    );

  const selectedEvento =
    eventos?.find((e: any) => e.id === eventoId) || null;

  const ministeriosComEscala = (ministerios || [])
    .map((m: any) => ({
      ...m,
      count: escalas?.filter((e: any) => e.ministerio_id === m.id).length || 0,
    }))
    .filter((m: any) => m.count > 0);

  const escalasFiltradas =
    ministerioFiltro === "todos"
      ? escalas
      : escalas?.filter((e: any) => e.ministerio_id === ministerioFiltro);

  const handleAdd = async () => {
    if (!eventoId || !addMin || !addUser) return;
    const res = await fetch("/api/escalas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        evento_id: eventoId,
        ministerio_id: addMin,
        user_id: addUser,
        funcao: addFuncao || null,
      }),
    });

    if (res.status === 409) {
      const data = await res.json();
      setConflictDialog(data);
      return;
    }

    if (res.ok) {
      const data = await res.json();
      if (data.warning) toast({ title: "Aviso", description: data.warning });
      else toast({ title: "Membro escalado" });
      mutate();
      setAddOpen(false);
      setAddUser("");
      setAddFuncao("");
    }
  };

  const handleRemove = async (id: string) => {
    const ok = await ask({ title: "Remover da escala?", danger: true, confirmLabel: "Remover" });
    if (!ok) return;
    await fetch(`/api/escalas/${id}`, { method: "DELETE" });
    toast({ title: "Removido da escala" });
    mutate();
  };

  const handleStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/escalas/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast({
        title: err.error || "Não foi possível atualizar o status",
        variant: "destructive",
      });
      return;
    }
    toast({ title: `Status: ${status}` });
    mutate();
  };

  if (!eventoId) {
    return (
      <AdminScreen
        kicker="Igreja"
        title="Cultos"
        subtitle="Escolha o culto e preencha as escalas de todos os ministérios."
      >
        {!futureEventos || futureEventos.length === 0 ? (
          <DsEmpty title="Nenhum evento futuro" description="Crie um evento na agenda para poder escalar membros." />
        ) : (
          <DsList>
            {futureEventos.map((ev: any) => {
              const d = new Date(ev.data);
              const data = d
                .toLocaleDateString("pt-BR", { day: "2-digit", month: "short", timeZone: "UTC" })
                .replace(".", "");
              return (
                <DsRow
                  key={ev.id}
                  onClick={() => setEventoId(ev.id)}
                  title={ev.titulo}
                  meta={`${data}${ev.horario ? ` · ${ev.horario}` : ""}`}
                />
              );
            })}
          </DsList>
        )}
      </AdminScreen>
    );
  }

  return (
    <AdminScreen
      kicker="Igreja"
      title={selectedEvento?.titulo || "Culto"}
      subtitle={
        selectedEvento
          ? new Date(selectedEvento.data)
              .toLocaleDateString("pt-BR", { day: "2-digit", month: "long", timeZone: "UTC" }) +
            (selectedEvento.horario ? ` · ${selectedEvento.horario}` : "")
          : undefined
      }
      action={
        <div className="flex flex-wrap gap-2">
          <DsBtn
            variant="ghost"
            size="sm"
            onClick={() => {
              setEventoId("");
              setMinisterioFiltro("todos");
            }}
          >
            ← Cultos
          </DsBtn>
          <DsBtn
            size="sm"
            onClick={() => {
              setAddOpen(true);
              setAddMin("");
              setAddUser("");
              setAddFuncao("");
            }}
          >
            <Plus className="h-4 w-4" /> Escalar
          </DsBtn>
        </div>
      }
    >
      {escalas && (
        <>
          <DsWell className="gap-2">
            <DsChip active={ministerioFiltro === "todos"} onClick={() => setMinisterioFiltro("todos")}>
              Todos ({escalas.length})
            </DsChip>
            {ministeriosComEscala.map((m: any) => (
              <DsChip key={m.id} active={ministerioFiltro === m.id} onClick={() => setMinisterioFiltro(m.id)}>
                <MinistryIcon name={m.icone} ministryName={m.nome} mono size={12} />
                {m.nome} ({m.count})
              </DsChip>
            ))}
          </DsWell>

          {escalasFiltradas?.length === 0 ? (
            <DsEmpty
              title="Nenhum membro escalado"
              description="Use “Escalar” para adicionar alguém a este culto."
            />
          ) : (
            <DsList>
              {escalasFiltradas?.map((e: any) => (
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
                  meta={[e.ministerio_nome, e.funcao].filter(Boolean).join(" · ")}
                  trailing={
                    <div className="flex items-center gap-1.5">
                      <DsStatus tone={STATUS_TONE[e.status] || "neutral"}>{e.status}</DsStatus>
                      {e.status === "pendente" && (
                        <>
                          <DsBtn
                            variant="ghost"
                            size="icon"
                            onClick={() => handleStatus(e.id, "confirmado")}
                            aria-label="Confirmar"
                          >
                            <Check className="h-4 w-4" />
                          </DsBtn>
                          <DsBtn
                            variant="ghost"
                            size="icon"
                            onClick={() => handleStatus(e.id, "recusado")}
                            aria-label="Recusar"
                          >
                            <X className="h-4 w-4" />
                          </DsBtn>
                        </>
                      )}
                      <DsBtn
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemove(e.id)}
                        aria-label="Remover"
                      >
                        <Trash2 className="h-4 w-4" />
                      </DsBtn>
                    </div>
                  }
                />
              ))}
            </DsList>
          )}
        </>
      )}

      {/* Dialog adicionar */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Escalar Membro</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Ministério</Label>
              <Select
                value={addMin}
                onValueChange={(v) => {
                  setAddMin(v);
                  setAddUser("");
                  setAddFuncao("");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {ministerios?.map((m: any) => (
                    <SelectItem key={m.id} value={m.id}>
                      <span className="inline-flex items-center gap-2">
                        <MinistryIcon name={m.icone} ministryName={m.nome} mono size={16} />
                        {m.nome}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {addMin && minDetail?.membros && (
              <div>
                <Label>Membro</Label>
                <SearchableSelect
                  value={addUser}
                  onValueChange={setAddUser}
                  placeholder="Buscar membro..."
                  options={minDetail.membros.map((mb: any) => ({
                    value: mb.user_id,
                    label: mb.nome,
                    sublabel: [mb.is_lider ? "Líder" : null, mb.indisponivel ? "Indisponível nesta data" : null]
                      .filter(Boolean)
                      .join(" · ") || undefined,
                  }))}
                />
              </div>
            )}
            <div>
              <Label>Função (opcional)</Label>
              <Select value={addFuncao} onValueChange={setAddFuncao}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {minFuncoes?.map((f: any) => (
                    <SelectItem key={f.id} value={f.nome}>
                      {f.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DsBtn className="w-full" onClick={handleAdd} disabled={!addMin || !addUser}>
              Escalar
            </DsBtn>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog conflito */}
      <Dialog
        open={!!conflictDialog}
        onOpenChange={() => setConflictDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Conflito de Escala
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm">{conflictDialog?.message}</p>
          <p className="pib-mute text-xs">
            Para escalar mesmo assim, ative &quot;Permite escala múltipla&quot;
            no perfil do membro em Membros.
          </p>
          <DsBtn variant="ghost" onClick={() => setConflictDialog(null)}>
            Entendi
          </DsBtn>
        </DialogContent>
      </Dialog>

      {confirmNode}
    </AdminScreen>
  );
}
