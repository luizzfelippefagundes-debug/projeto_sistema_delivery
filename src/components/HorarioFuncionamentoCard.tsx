"use client";

import { useState, useTransition } from "react";
import { atualizarHorarios } from "@/actions/configuracoes.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { type Horarios, resumoHorarios } from "@/lib/horario";

const DIAS = [
  { dia: 1, nome: "Segunda" },
  { dia: 2, nome: "Terça" },
  { dia: 3, nome: "Quarta" },
  { dia: 4, nome: "Quinta" },
  { dia: 5, nome: "Sexta" },
  { dia: 6, nome: "Sábado" },
  { dia: 0, nome: "Domingo" },
];

const PADRAO = { abre: "18:00", fecha: "22:00" };

export default function HorarioFuncionamentoCard({ horariosAtuais }: { horariosAtuais: Horarios | null }) {
  const [horarios, setHorarios] = useState<Horarios>(horariosAtuais ?? Array(7).fill(null));
  const [erro, setErro] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);
  const [pending, startTransition] = useTransition();

  function mudarDia(dia: number, valor: Horarios[number]) {
    setSalvo(false);
    setHorarios((atual) => atual.map((h, i) => (i === dia ? valor : h)));
  }

  function salvar() {
    setErro(null);
    startTransition(async () => {
      try {
        await atualizarHorarios(horarios);
        setSalvo(true);
      } catch (e) {
        const msg = e instanceof Error && !e.message.includes("react.dev/errors") ? e.message : null;
        setErro(msg ?? "Não deu pra salvar. Confira os horários e tente de novo.");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground">Horário do delivery</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-xs text-muted-foreground">
          Aparece no topo do cardápio. Fora desse horário o site não deixa fazer pedido. Desligue o dia em que não abrir.
        </p>
        <div className="flex flex-col divide-y divide-border">
          {DIAS.map(({ dia, nome }) => {
            const h = horarios[dia];
            return (
              <div key={dia} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-2">
                <Switch
                  checked={h != null}
                  onCheckedChange={(ligado) => mudarDia(dia, ligado ? (h ?? PADRAO) : null)}
                  aria-label={`${nome} aberto`}
                />
                <span className="w-20 text-sm font-medium">{nome}</span>
                {h ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={h.abre}
                      onChange={(e) => mudarDia(dia, { ...h, abre: e.target.value })}
                      className="h-9 w-28"
                      aria-label={`${nome} abre`}
                    />
                    <span className="text-xs text-muted-foreground">às</span>
                    <Input
                      type="time"
                      value={h.fecha}
                      onChange={(e) => mudarDia(dia, { ...h, fecha: e.target.value })}
                      className="h-9 w-28"
                      aria-label={`${nome} fecha`}
                    />
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">Fechado</span>
                )}
              </div>
            );
          })}
        </div>
        {erro && <p className="text-sm text-destructive">{erro}</p>}
        <div className="flex items-center justify-between gap-3">
          <p className="min-w-0 text-xs text-muted-foreground">
            {salvo ? "Salvo! " : ""}
            {horarios.some(Boolean) ? resumoHorarios(horarios) : "Nenhum dia aberto"}
          </p>
          <Button size="sm" disabled={pending} onClick={salvar} className="shrink-0">
            {pending ? "Salvando…" : "Salvar horário"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
