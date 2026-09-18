"use client";

import { X } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { atualizarAcessosExtras, criarTurno, removerTurno } from "@/actions/funcionarios.actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DIA_SEMANA_LABEL } from "@/lib/types";
import type { Funcionario, PapelFuncionario, Turno } from "@/lib/types";

const AREAS_EXTRAS: { value: PapelFuncionario; label: string }[] = [
  { value: "atendente", label: "Comanda (atendente)" },
  { value: "cozinha", label: "Cozinha" },
  { value: "motoboy", label: "Motoboy" },
];

export default function GerenciarFuncionarioSheet({
  funcionario,
  turnos,
  onOpenChange,
}: {
  funcionario: Funcionario | null;
  turnos: Turno[];
  onOpenChange: (v: boolean) => void;
}) {
  const [acessos, setAcessos] = useState<PapelFuncionario[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [diaNovoTurno, setDiaNovoTurno] = useState("1");
  const [horaInicioNovoTurno, setHoraInicioNovoTurno] = useState("");
  const [horaFimNovoTurno, setHoraFimNovoTurno] = useState("");
  const [erroTurno, setErroTurno] = useState<string | null>(null);
  const [pendingTurno, startTurnoTransition] = useTransition();

  useEffect(() => {
    if (funcionario) {
      setAcessos(funcionario.acessosExtras);
      setErro(null);
    }
  }, [funcionario]);

  function alternarArea(area: PapelFuncionario, marcado: boolean) {
    setAcessos((prev) => (marcado ? [...prev, area] : prev.filter((a) => a !== area)));
  }

  function salvar() {
    if (!funcionario) return;
    setErro(null);
    startTransition(async () => {
      try {
        await atualizarAcessosExtras(
          funcionario.id,
          acessos.filter((a) => a !== funcionario.papel),
        );
        onOpenChange(false);
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Não deu pra salvar.");
      }
    });
  }

  function adicionarTurno() {
    if (!funcionario) return;
    setErroTurno(null);
    startTurnoTransition(async () => {
      try {
        await criarTurno({
          funcionarioId: funcionario.id,
          diaSemana: Number(diaNovoTurno),
          horaInicio: horaInicioNovoTurno,
          horaFim: horaFimNovoTurno,
        });
        setHoraInicioNovoTurno("");
        setHoraFimNovoTurno("");
      } catch (e) {
        setErroTurno(e instanceof Error ? e.message : "Não deu pra adicionar o turno.");
      }
    });
  }

  return (
    <Dialog open={!!funcionario} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
        <DialogHeader className="p-4">
          <DialogTitle>Gerenciar acesso — {funcionario?.nome}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 pb-4">
          <div className="flex flex-col gap-3">
            <Label>Permissões extras</Label>
            <p className="text-xs text-muted-foreground">
              Além da própria área, essa pessoa também pode acessar:
            </p>
            {AREAS_EXTRAS.filter((a) => a.value !== funcionario?.papel).map((a) => (
              <div key={a.value} className="flex items-center justify-between">
                <span className="text-sm">{a.label}</span>
                <Switch
                  checked={acessos.includes(a.value)}
                  onCheckedChange={(v) => alternarArea(a.value, v)}
                />
              </div>
            ))}
          </div>

          {erro && <p className="text-sm text-destructive">{erro}</p>}

          <div className="flex flex-col gap-3 border-t border-border pt-4">
            <Label>Turnos fixos</Label>
            <div className="flex flex-wrap gap-1.5">
              {turnos.length === 0 && <span className="text-xs text-muted-foreground">Nenhum turno cadastrado.</span>}
              {turnos.map((t) => (
                <Badge key={t.id} className="gap-1 bg-status-neutral-bg text-status-neutral-fg">
                  {DIA_SEMANA_LABEL[t.diaSemana]} {t.horaInicio}–{t.horaFim}
                  <button
                    type="button"
                    disabled={pendingTurno}
                    onClick={() => startTurnoTransition(() => removerTurno(t.id))}
                    className="ml-0.5 rounded-full hover:opacity-70"
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex items-end gap-2">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Dia</Label>
                <Select value={diaNovoTurno} onValueChange={(v) => v && setDiaNovoTurno(v)}>
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DIA_SEMANA_LABEL.map((label, i) => (
                      <SelectItem key={i} value={String(i)}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Início</Label>
                <Input
                  className="w-20"
                  placeholder="18:00"
                  value={horaInicioNovoTurno}
                  onChange={(e) => setHoraInicioNovoTurno(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Fim</Label>
                <Input
                  className="w-20"
                  placeholder="22:00"
                  value={horaFimNovoTurno}
                  onChange={(e) => setHoraFimNovoTurno(e.target.value)}
                />
              </div>
              <Button type="button" variant="outline" disabled={pendingTurno} onClick={adicionarTurno}>
                Adicionar
              </Button>
            </div>
            {erroTurno && <p className="text-sm text-destructive">{erroTurno}</p>}
          </div>
        </div>
        <div className="mt-auto flex flex-col gap-2 border-t border-border p-4">
          <Button disabled={pending} onClick={salvar}>
            {pending ? "Salvando…" : "Salvar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
