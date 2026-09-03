"use client";

import { useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertCircle, Plus, Trash2, Check, X } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { SearchableSelect } from "@/components/searchable-select";
import { MinistryIcon } from "@/components/ministry-icon";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function EscalasAdminPage() {
  const { data: eventos } = useSWR("/api/eventos", fetcher);
  const { data: ministerios } = useSWR("/api/ministerios", fetcher);
  const [eventoId, setEventoId] = useState("");
  const { data: escalas, mutate } = useSWR(
    eventoId ? `/api/escalas?evento_id=${eventoId}` : null,
    fetcher,
  );
  const [addOpen, setAddOpen] = useState(false);
  const [addMin, setAddMin] = useState("");
  const [addUser, setAddUser] = useState("");
  const [addFuncao, setAddFuncao] = useState("");
  const [conflictDialog, setConflictDialog] = useState<any>(null);

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

  const escalasGrouped =
    ministerios?.reduce(
      (acc: any, m: any) => {
        acc[m.id] = {
          nome: m.nome,
          icone: m.icone,
          escalas: escalas?.filter((e: any) => e.ministerio_id === m.id) || [],
        };
        return acc;
      },
      {} as Record<string, any>,
    ) || {};

  const activeMinisterios = Object.entries(escalasGrouped).filter(
    ([_, v]: any) => v.escalas.length > 0,
  );

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

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      confirmado: "bg-green-100 text-green-700",
      pendente: "bg-yellow-100 text-yellow-700",
      recusado: "bg-red-100 text-red-700",
    };
    return map[s] || "";
  };

  return (
    <div className="space-y-6 px-4 py-5 md:px-0 md:py-0">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="pib-kicker">Igreja</p>
          <h1 className="pib-display text-3xl">Cultos</h1>
          <p className="pib-mute mt-1 text-sm">Escolha o culto e preencha as escalas de todos os ministérios.</p>
        </div>
        {eventoId && (
          <Button
            onClick={() => {
              setAddOpen(true);
              setAddMin("");
              setAddUser("");
            }}
          >
            <Plus className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Escalar membro</span>
          </Button>
        )}
      </div>

      {!eventoId ? (
        <>
          <p className="text-sm text-[var(--pib-mute)]">Selecione um culto:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {futureEventos?.map((ev: any) => {
              const d = new Date(ev.data);
              const dia = d.toLocaleDateString("pt-BR", { day: "2-digit", timeZone: "UTC" });
              const mes = d.toLocaleDateString("pt-BR", { month: "short", timeZone: "UTC" }).replace(".", "");
              return (
                <Card key={ev.id} className="cursor-pointer hover:border-primary/30 transition-colors" onClick={() => setEventoId(ev.id)}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="flex flex-col items-center justify-center rounded-lg bg-primary/10 text-primary min-w-[3rem] py-2 px-2">
                      <span className="text-lg font-bold leading-none">{dia}</span>
                      <span className="text-[10px] uppercase font-medium mt-0.5">{mes}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{ev.titulo}</p>
                      <p className="text-xs text-muted-foreground">{ev.horario || ev.tipo}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {(!futureEventos || futureEventos.length === 0) && (
              <p className="text-center text-muted-foreground py-8 col-span-full">Nenhum evento futuro.</p>
            )}
          </div>
        </>
      ) : (
        <>
          <Button variant="ghost" size="sm" onClick={() => setEventoId("")}>
            ← Voltar aos eventos
          </Button>

          {escalas && (
            <>
              {activeMinisterios.length === 0 && escalas.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum membro escalado para este evento.
                </p>
              ) : (
                <Tabs defaultValue={activeMinisterios[0]?.[0] || "all"}>
                  <TabsList className="flex-wrap h-auto">
                    <TabsTrigger value="all">Todos ({escalas.length})</TabsTrigger>
                    {activeMinisterios.map(([id, v]: any) => (
                      <TabsTrigger key={id} value={id} className="inline-flex items-center gap-1.5">
                        <MinistryIcon name={v.icone} ministryName={v.nome} size={14} />
                        {v.nome} ({v.escalas.length})
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  <TabsContent
                    value="all"
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4"
                  >
                    {escalas.map((e: any) => (
                      <EscalaRow
                        key={e.id}
                        e={e}
                        onRemove={handleRemove}
                        onStatus={handleStatus}
                        statusBadge={statusBadge}
                      />
                    ))}
                  </TabsContent>

                  {activeMinisterios.map(([id, v]: any) => (
                    <TabsContent
                      key={id}
                      value={id}
                      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4"
                    >
                      {v.escalas.map((e: any) => (
                        <EscalaRow
                          key={e.id}
                          e={e}
                          onRemove={handleRemove}
                          onStatus={handleStatus}
                          statusBadge={statusBadge}
                        />
                      ))}
                    </TabsContent>
                  ))}
                </Tabs>
              )}
            </>
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
                        <MinistryIcon name={m.icone} ministryName={m.nome} color={m.cor} size={16} />
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
            <Button
              className="w-full"
              onClick={handleAdd}
              disabled={!addMin || !addUser}
            >
              Escalar
            </Button>
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
          <p className="text-xs text-muted-foreground">
            Para escalar mesmo assim, ative &quot;Permite escala múltipla&quot;
            no perfil do membro em Membros.
          </p>
          <Button variant="outline" onClick={() => setConflictDialog(null)}>
            Entendi
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EscalaRow({
  e,
  onRemove,
  onStatus,
  statusBadge,
}: {
  e: any;
  onRemove: (id: string) => void;
  onStatus: (id: string, s: string) => void;
  statusBadge: (s: string) => string;
}) {
  return (
    <Card>
      <CardContent className="p-4 flex flex-col items-center text-center gap-2 relative">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-1 right-1 h-7 w-7 text-destructive"
          onClick={() => onRemove(e.id)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
        <Avatar className="h-14 w-14">
          <AvatarImage src={e.foto_url} />
          <AvatarFallback>{e.user_nome?.[0]}</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium">{e.user_nome}</p>
          <p className="text-xs text-muted-foreground">{e.ministerio_nome}</p>
          {e.funcao && (
            <p className="text-xs text-muted-foreground">{e.funcao}</p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <span
            className={`text-xs px-1.5 py-0.5 rounded ${statusBadge(e.status)}`}
          >
            {e.status}
          </span>
          {e.status === "pendente" && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-green-600"
                onClick={() => onStatus(e.id, "confirmado")}
              >
                <Check className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-red-600"
                onClick={() => onStatus(e.id, "recusado")}
              >
                <X className="h-3 w-3" />
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
