"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { fmtBRL } from "@/lib/data";

const DIAS_SUMINDO = 14;

interface ClienteResumo {
  nome: string;
  qtdPedidos: number;
  totalGasto: number;
  ultimoPedido: Date;
}

function diasAtras(data: Date) {
  return Math.floor((Date.now() - data.getTime()) / (1000 * 60 * 60 * 24));
}

export default function ClientesMobileList({ clientes }: { clientes: ClienteResumo[] }) {
  const [selecionado, setSelecionado] = useState<ClienteResumo | null>(null);

  if (clientes.length === 0) {
    return <p className="text-sm text-muted-foreground sm:hidden">Nenhum cliente de delivery ainda.</p>;
  }

  return (
    <>
      <div className="flex flex-col gap-2 sm:hidden">
        {clientes.map((c) => {
          const dias = diasAtras(c.ultimoPedido);
          const estaSumindo = dias > DIAS_SUMINDO;
          return (
            <button
              key={c.nome}
              type="button"
              onClick={() => setSelecionado(c)}
              className="flex items-center justify-between gap-2 rounded-xl border border-border bg-card p-4 text-left"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{c.nome}</p>
                <p className="num text-xs text-muted-foreground">{fmtBRL(c.totalGasto)} · {c.qtdPedidos} pedido(s)</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge className={estaSumindo ? "bg-status-warn-bg text-status-warn-fg" : "bg-status-ok-bg text-status-ok-fg"}>
                  {estaSumindo ? `${dias}d sumido` : "Ativo"}
                </Badge>
                <ChevronRight className="size-4 text-muted-foreground" />
              </div>
            </button>
          );
        })}
      </div>

      <Dialog open={!!selecionado} onOpenChange={(v) => !v && setSelecionado(null)}>
        <DialogContent className="w-[calc(100%-2rem)] gap-0 overflow-hidden p-0 sm:max-w-sm">
          <DialogHeader className="p-4">
            <DialogTitle>{selecionado?.nome}</DialogTitle>
          </DialogHeader>
          {selecionado && (
            <div className="flex flex-col gap-4 px-4 pb-4">
              {(() => {
                const dias = diasAtras(selecionado.ultimoPedido);
                const estaSumindo = dias > DIAS_SUMINDO;
                return (
                  <div>
                    <Badge className={estaSumindo ? "bg-status-warn-bg text-status-warn-fg" : "bg-status-ok-bg text-status-ok-fg"}>
                      {estaSumindo ? `${dias}d sumido` : "Ativo"}
                    </Badge>
                  </div>
                );
              })()}

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground">Pedidos</p>
                  <p className="num font-semibold">{selecionado.qtdPedidos}</p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground">Total gasto</p>
                  <p className="num font-semibold">{fmtBRL(selecionado.totalGasto)}</p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground">Ticket médio</p>
                  <p className="num font-semibold">{fmtBRL(selecionado.totalGasto / selecionado.qtdPedidos)}</p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground">Último pedido</p>
                  <p className="font-semibold">{selecionado.ultimoPedido.toLocaleDateString("pt-BR")}</p>
                </div>
              </div>

              <Link href={`/dono/clientes/${encodeURIComponent(selecionado.nome)}`}>
                <Button variant="outline" className="w-full">
                  Ver histórico completo
                </Button>
              </Link>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
