"use client";

import { Printer } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useTransition } from "react";
import { avancarStatusCozinha } from "@/actions/pedidos.actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { fmtBRL, minAgo, origemLabel } from "@/lib/data";
import type { OrderStatus } from "@/lib/types";

export interface PedidoCozinha {
  id: string;
  origem: "salao" | "delivery";
  mesa: number | null;
  clienteNome: string | null;
  status: OrderStatus;
  total: number;
  criadoEm: number;
  itens: { nome: string; quantidade: number }[];
}

const COLS: { key: OrderStatus; label: string }[] = [
  { key: "novo", label: "Novo" },
  { key: "preparo", label: "Em preparo" },
  { key: "pronto", label: "Pronto" },
];

export default function CozinhaBoard({ pedidos }: { pedidos: PedidoCozinha[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const id = setInterval(() => router.refresh(), 15000);
    return () => clearInterval(id);
  }, [router]);

  return (
    <div className="grid gap-5 sm:grid-cols-3">
      {COLS.map((col) => {
        const doGrupo = pedidos.filter((o) => o.status === col.key).sort((a, b) => a.criadoEm - b.criadoEm);
        const next = col.key === "novo" ? "preparo" : col.key === "preparo" ? "pronto" : null;
        const nextLabel =
          col.key === "novo" ? "Iniciar preparo →" : col.key === "preparo" ? "Marcar pronto →" : "Aguardando retirada/entrega";

        return (
          <div key={col.key}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{col.label}</h3>
              <Badge variant="outline">{doGrupo.length}</Badge>
            </div>
            <div className="flex flex-col gap-3">
              {doGrupo.length === 0 && <p className="text-sm text-muted-foreground">Nada por aqui.</p>}
              {doGrupo.map((o) => (
                <Card key={o.id} className="gap-3 py-4">
                  <CardContent className="flex flex-col gap-3 px-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold">{origemLabel(o)}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{minAgo(o.criadoEm)}</span>
                        <a href={`/imprimir/${o.id}`} target="_blank" rel="noopener noreferrer">
                          <Button size="icon-sm" variant="outline" aria-label="Imprimir comanda">
                            <Printer />
                          </Button>
                        </a>
                      </div>
                    </div>
                    <ul className="list-disc pl-4 text-xs text-muted-foreground">
                      {o.itens.map((i) => (
                        <li key={i.nome}>
                          {i.quantidade}x {i.nome}
                        </li>
                      ))}
                    </ul>
                    <div className="flex items-center justify-between gap-2">
                      <span className="num text-sm font-bold">{fmtBRL(o.total)}</span>
                      {next ? (
                        <Button
                          size="sm"
                          disabled={pending}
                          onClick={() => startTransition(() => avancarStatusCozinha(o.id, next))}
                        >
                          {nextLabel}
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">{nextLabel}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
