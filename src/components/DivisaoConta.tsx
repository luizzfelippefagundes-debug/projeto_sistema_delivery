"use client";

import { Minus, Plus, Users } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { fmtBRL } from "@/lib/data";
import { calcularPorPessoa } from "@/lib/divisaoConta";

/** Calculadora de "dividir a conta" — puramente local (não salva nada),
 * só ajuda quem tá pagando ou quem tá cobrando a saber quanto cada um
 * deve, sem precisar puxar calculadora à parte. */
export default function DivisaoConta({ total }: { total: number }) {
  const [pessoas, setPessoas] = useState(1);
  const porPessoa = calcularPorPessoa(total, pessoas);

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Users className="size-4" /> Dividir entre
        </span>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="icon-sm"
            variant="outline"
            disabled={pessoas <= 1}
            onClick={() => setPessoas((p) => Math.max(1, p - 1))}
            aria-label="Diminuir número de pessoas"
          >
            <Minus />
          </Button>
          <span className="num w-6 text-center text-sm font-semibold">{pessoas}</span>
          <Button
            type="button"
            size="icon-sm"
            variant="outline"
            onClick={() => setPessoas((p) => p + 1)}
            aria-label="Aumentar número de pessoas"
          >
            <Plus />
          </Button>
        </div>
      </div>
      {pessoas > 1 && (
        <div className="flex justify-between text-sm font-semibold text-primary">
          <span>{pessoas}x</span>
          <span className="num">{fmtBRL(porPessoa)} por pessoa</span>
        </div>
      )}
    </div>
  );
}
