"use client";

import { CheckCircle2, Truck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useTransition } from "react";
import { confirmarEntregaForca } from "@/actions/pedidos.actions";
import ComandaBoard from "@/components/ComandaBoard";
import CozinhaBoard, { type PedidoCozinha } from "@/components/CozinhaBoard";
import type { PedidoAbertoResumo } from "@/components/MesaModal";
import ResumoDoDia from "@/components/ResumoDoDia";
import { Button } from "@/components/ui/button";
import { fmtBRL } from "@/lib/data";
import type { TaxasMaquininha } from "@/lib/taxaMaquininha";
import type { ItemCardapio } from "@/lib/types";

/** Visão combinada de mesas + cozinha numa página só — pra quem cobre as
 * duas pontas sozinho (ex: a dona atendendo e cozinhando ao mesmo tempo),
 * em vez de ficar trocando entre /atendente e /cozinha. */
interface PedidoRota {
  id: string;
  clienteNome: string | null;
  endereco: string | null;
  total: number;
  criadoEm: number;
}

export default function PainelOperacional({
  itensCardapio,
  pedidosPorMesa,
  pedidosCozinha,
  deliveryEmRota = [],
  resumo,
  taxas,
  numeroMesas = 8,
  mesasQuerFechar,
}: {
  itensCardapio: ItemCardapio[];
  pedidosPorMesa: Record<number, PedidoAbertoResumo[]>;
  pedidosCozinha: PedidoCozinha[];
  deliveryEmRota?: PedidoRota[];
  resumo: { pedidosHoje: number; faturadoHoje: number; atrasados: number };
  taxas: TaxasMaquininha;
  numeroMesas?: number;
  mesasQuerFechar?: Set<number>;
}) {
  const router = useRouter();
  const [confirmando, startConfirmar] = useTransition();

  useEffect(() => {
    const id = setInterval(() => router.refresh(), 15000);
    return () => clearInterval(id);
  }, [router]);

  function forcarEntrega(pedidoId: string) {
    startConfirmar(() => confirmarEntregaForca(pedidoId));
  }

  return (
    <div className="flex flex-col gap-8">
      <ResumoDoDia {...resumo} />

      {deliveryEmRota.length > 0 && (
        <div>
          <h2 className="mb-3 font-heading text-lg font-semibold">Delivery em rota</h2>
          <div className="flex flex-col gap-2">
            {deliveryEmRota.map((p) => (
              <div
                key={p.id}
                className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-status-warn-bg">
                    <Truck className="size-4 text-status-warn-fg" />
                  </div>
                  <div>
                    <p className="font-medium">{p.clienteNome ?? "Cliente"}</p>
                    {p.endereco && <p className="text-xs text-muted-foreground">{p.endereco}</p>}
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <span className="num text-sm font-semibold">{fmtBRL(p.total)}</span>
                  <Button
                    size="sm"
                    disabled={confirmando}
                    onClick={() => forcarEntrega(p.id)}
                  >
                    <CheckCircle2 className="size-4" />
                    {confirmando ? "Confirmando…" : "Confirmar entrega"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-3 font-heading text-lg font-semibold">Mesas</h2>
        <ComandaBoard
          itensCardapio={itensCardapio}
          pedidosPorMesa={pedidosPorMesa}
          taxas={taxas}
          numeroMesas={numeroMesas}
          mesasQuerFechar={mesasQuerFechar}
        />
      </div>

      <div>
        <h2 className="mb-3 font-heading text-lg font-semibold">Pedidos pra cozinha</h2>
        <CozinhaBoard pedidos={pedidosCozinha} />
      </div>
    </div>
  );
}
