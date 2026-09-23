"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { criarZonaEntrega, removerZonaEntrega } from "@/actions/entrega.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fmtBRL } from "@/lib/data";

export interface ZonaEntrega {
  id: string;
  bairro: string;
  taxaEntrega: number;
  tempoEstimadoMin: number;
}

export default function ZonasEntregaManager({ zonas }: { zonas: ZonaEntrega[] }) {
  const [bairro, setBairro] = useState("");
  const [taxa, setTaxa] = useState("");
  const [tempo, setTempo] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [removendo, setRemovendo] = useState<string | null>(null);

  function adicionar() {
    const taxaNumero = Number(taxa.replace(",", "."));
    const tempoNumero = Number(tempo);
    if (!bairro.trim() || Number.isNaN(taxaNumero) || taxaNumero < 0 || !tempoNumero || tempoNumero <= 0) {
      setErro("Preencha bairro, taxa e tempo estimado válidos.");
      return;
    }
    setErro(null);
    startTransition(async () => {
      try {
        await criarZonaEntrega({ bairro, taxaEntrega: taxaNumero, tempoEstimadoMin: tempoNumero });
        setBairro("");
        setTaxa("");
        setTempo("");
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Não deu pra salvar.");
      }
    });
  }

  function remover(id: string) {
    setRemovendo(id);
    startTransition(async () => {
      await removerZonaEntrega(id);
      setRemovendo(null);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground">Zonas de entrega</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-xs text-muted-foreground">
          Cadastre a taxa e o tempo estimado por bairro. No checkout, o cliente vê essa estimativa assim que digita o
          bairro — sem precisar de mapa de verdade.
        </p>

        {zonas.length > 0 && (
          <div className="flex flex-col gap-2">
            {zonas.map((z) => (
              <div key={z.id} className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm">
                <span className="font-medium">{z.bairro}</span>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <span className="num">{fmtBRL(z.taxaEntrega)}</span>
                  <span>{z.tempoEstimadoMin} min</span>
                  <button
                    type="button"
                    disabled={pending && removendo === z.id}
                    onClick={() => remover(z.id)}
                    aria-label={`Remover ${z.bairro}`}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="zona-bairro">Bairro</Label>
            <Input id="zona-bairro" value={bairro} onChange={(e) => setBairro(e.target.value)} placeholder="Centro" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="zona-taxa">Taxa (R$)</Label>
            <Input
              id="zona-taxa"
              className="sm:w-24"
              value={taxa}
              onChange={(e) => setTaxa(e.target.value)}
              placeholder="6,99"
              inputMode="decimal"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="zona-tempo">Tempo (min)</Label>
            <Input
              id="zona-tempo"
              className="sm:w-24"
              value={tempo}
              onChange={(e) => setTempo(e.target.value)}
              placeholder="30"
              inputMode="numeric"
            />
          </div>
          <Button type="button" variant="outline" disabled={pending} onClick={adicionar}>
            <Plus /> Adicionar
          </Button>
        </div>

        {erro && <p className="text-sm text-destructive">{erro}</p>}
      </CardContent>
    </Card>
  );
}
