"use client";

import { useState, useTransition } from "react";
import { atualizarNumeroMesas } from "@/actions/configuracoes.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function NumeroMesasCard({ numeroAtual }: { numeroAtual: number }) {
  const [editando, setEditando] = useState(false);
  const [numero, setNumero] = useState(String(numeroAtual));
  const [pending, startTransition] = useTransition();

  function salvar() {
    const valor = Number(numero);
    if (!Number.isFinite(valor)) return;
    startTransition(async () => {
      await atualizarNumeroMesas(valor);
      setEditando(false);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground">Número de mesas</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-xs text-muted-foreground">
          Define quantas mesas aparecem na Comanda e quantos QR codes são gerados abaixo.
        </p>
        {editando ? (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              type="number"
              min={1}
              max={50}
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              className="flex-1 sm:max-w-32"
            />
            <div className="flex gap-2">
              <Button size="sm" disabled={pending} onClick={salvar}>
                {pending ? "Salvando…" : "Salvar"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setEditando(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium">{numeroAtual} mesas</p>
            <Button size="sm" variant="outline" onClick={() => setEditando(true)}>
              Editar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
