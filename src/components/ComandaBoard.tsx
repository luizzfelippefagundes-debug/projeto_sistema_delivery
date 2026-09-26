"use client";

import { useState } from "react";
import MesaModal, { type PedidoAbertoResumo } from "@/components/MesaModal";
import StatusBadge from "@/components/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ItemCardapio, OrderStatus } from "@/lib/types";

export default function ComandaBoard({
  itensCardapio,
  pedidosPorMesa,
  numeroMesas = 8,
}: {
  itensCardapio: ItemCardapio[];
  pedidosPorMesa: Record<number, PedidoAbertoResumo[]>;
  numeroMesas?: number;
}) {
  const MESAS = Array.from({ length: numeroMesas }, (_, i) => i + 1);
  const [mesaAberta, setMesaAberta] = useState<number | null>(null);

  return (
    <div>
      <p className="mb-4 text-sm text-muted-foreground">Toque numa mesa pra lançar o pedido direto pra cozinha.</p>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {MESAS.map((n) => {
          const pedidos = pedidosPorMesa[n] ?? [];
          const ocupada = pedidos.length > 0;
          const totalItens = pedidos.reduce((s, p) => s + p.itemCount, 0);
          const statusMaisAvancado: OrderStatus | undefined = pedidos.at(-1)?.status;
          return (
            <Card
              key={n}
              className="cursor-pointer gap-2 py-4 transition-colors hover:border-primary/40"
              onClick={() => setMesaAberta(n)}
            >
              <CardHeader className="px-4">
                <Badge className={ocupada ? "bg-status-danger-bg text-status-danger-fg" : "bg-status-ok-bg text-status-ok-fg"}>
                  {ocupada ? "Ocupada" : "Livre"}
                </Badge>
                <CardTitle className="font-heading text-2xl">Mesa {n}</CardTitle>
              </CardHeader>
              <CardContent className="px-4 text-xs text-muted-foreground">
                {ocupada ? (
                  <div className="flex items-center gap-1.5">
                    <span>{totalItens} item(ns)</span>
                    {statusMaisAvancado && <StatusBadge status={statusMaisAvancado} />}
                  </div>
                ) : (
                  "disponível"
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {mesaAberta !== null && (
        <MesaModal
          mesa={mesaAberta}
          itensCardapio={itensCardapio}
          pedidosAbertos={pedidosPorMesa[mesaAberta] ?? []}
          onClose={() => setMesaAberta(null)}
        />
      )}
    </div>
  );
}
