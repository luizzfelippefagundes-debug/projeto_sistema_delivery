"use client";

import { useState, useTransition } from "react";
import { atualizarEnderecoLoja } from "@/actions/configuracoes.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function EnderecoLojaCard({ enderecoAtual }: { enderecoAtual: string | null }) {
  const [editando, setEditando] = useState(false);
  const [endereco, setEndereco] = useState(enderecoAtual ?? "");
  const [pending, startTransition] = useTransition();

  function salvar() {
    startTransition(async () => {
      await atualizarEnderecoLoja(endereco);
      setEditando(false);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground">Endereço da loja</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-xs text-muted-foreground">
          De onde as entregas saem — usado pra traçar a rota certa no mapa do motoboy.
        </p>
        {editando ? (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              placeholder="Rua, número, bairro, cidade - UF"
              className="flex-1"
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
            <p className="text-sm">{enderecoAtual || "Não definido"}</p>
            <Button size="sm" variant="outline" onClick={() => setEditando(true)}>
              {enderecoAtual ? "Editar" : "Definir"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
