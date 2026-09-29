"use client";

import { useState, useTransition } from "react";
import { atualizarTaxasMaquininha, type TaxasMaquininhaInput } from "@/actions/configuracoes.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const CAMPOS: { campo: keyof TaxasMaquininhaInput; label: string }[] = [
  { campo: "taxaPix", label: "Pix" },
  { campo: "taxaDebito", label: "Débito" },
  { campo: "taxaCreditoVista", label: "Crédito à vista" },
  { campo: "taxaCredito2x", label: "Crédito 2x" },
  { campo: "taxaCredito3x", label: "Crédito 3x" },
  { campo: "taxaCredito4x", label: "Crédito 4x" },
];

function paraTexto(valores: TaxasMaquininhaInput): Record<keyof TaxasMaquininhaInput, string> {
  return {
    taxaPix: String(valores.taxaPix),
    taxaDebito: String(valores.taxaDebito),
    taxaCreditoVista: String(valores.taxaCreditoVista),
    taxaCredito2x: String(valores.taxaCredito2x),
    taxaCredito3x: String(valores.taxaCredito3x),
    taxaCredito4x: String(valores.taxaCredito4x),
  };
}

/** Percentuais que a maquininha cobra em cada forma de recebimento — usados
 * pra somar automaticamente no total da mesa na hora de fechar, pra dona
 * não perder margem quando o cliente paga parcelado. Vem preenchido com as
 * taxas reais da maquininha dela, mas é editável se a taxa mudar. */
export default function TaxasMaquininhaCard({ taxasAtuais }: { taxasAtuais: TaxasMaquininhaInput }) {
  const [editando, setEditando] = useState(false);
  const [valores, setValores] = useState(paraTexto(taxasAtuais));
  const [pending, startTransition] = useTransition();

  function salvar() {
    startTransition(async () => {
      await atualizarTaxasMaquininha({
        taxaPix: Number(valores.taxaPix),
        taxaDebito: Number(valores.taxaDebito),
        taxaCreditoVista: Number(valores.taxaCreditoVista),
        taxaCredito2x: Number(valores.taxaCredito2x),
        taxaCredito3x: Number(valores.taxaCredito3x),
        taxaCredito4x: Number(valores.taxaCredito4x),
      });
      setEditando(false);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground">Taxas da maquininha</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-xs text-muted-foreground">
          Copiadas do app da maquininha. Ao fechar uma mesa no cartão, essa taxa é somada no total cobrado do
          cliente, pra você não perder dinheiro no parcelamento.
        </p>
        {editando ? (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {CAMPOS.map(({ campo, label }) => (
                <div key={campo} className="flex flex-col gap-1">
                  <Label htmlFor={campo} className="text-xs text-muted-foreground">
                    {label}
                  </Label>
                  <div className="relative">
                    <Input
                      id={campo}
                      type="number"
                      step="0.01"
                      min={0}
                      max={100}
                      value={valores[campo]}
                      onChange={(e) => setValores((prev) => ({ ...prev, [campo]: e.target.value }))}
                      className="pr-7"
                    />
                    <span className="absolute top-1/2 right-2.5 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button size="sm" disabled={pending} onClick={salvar}>
                {pending ? "Salvando…" : "Salvar"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setValores(paraTexto(taxasAtuais));
                  setEditando(false);
                }}
              >
                Cancelar
              </Button>
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3">
              {CAMPOS.map(({ campo, label }) => (
                <div key={campo} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="num font-medium">{taxasAtuais[campo]}%</span>
                </div>
              ))}
            </div>
            <Button size="sm" variant="outline" className="self-start" onClick={() => setEditando(true)}>
              Editar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
