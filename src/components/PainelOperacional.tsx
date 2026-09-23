"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import ComandaBoard from "@/components/ComandaBoard";
import CozinhaBoard, { type PedidoCozinha } from "@/components/CozinhaBoard";
import type { PedidoAbertoResumo } from "@/components/MesaModal";
import ResumoDoDia from "@/components/ResumoDoDia";
import { useAlertaPedidoNovo } from "@/lib/useAlertaPedidoNovo";
import type { ItemCardapio } from "@/lib/types";

/** Visão combinada de mesas + cozinha numa página só — pra quem cobre as
 * duas pontas sozinho (ex: a dona atendendo e cozinhando ao mesmo tempo),
 * em vez de ficar trocando entre /atendente e /cozinha. */
export default function PainelOperacional({
  itensCardapio,
  pedidosPorMesa,
  pedidosCozinha,
  resumo,
}: {
  itensCardapio: ItemCardapio[];
  pedidosPorMesa: Record<number, PedidoAbertoResumo[]>;
  pedidosCozinha: PedidoCozinha[];
  resumo: { pedidosHoje: number; faturadoHoje: number; atrasados: number };
}) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => router.refresh(), 15000);
    return () => clearInterval(id);
  }, [router]);

  const idsNovos = pedidosCozinha.filter((p) => p.status === "novo").map((p) => p.id);
  useAlertaPedidoNovo(idsNovos);

  return (
    <div className="flex flex-col gap-8">
      <ResumoDoDia {...resumo} />

      <div>
        <h2 className="mb-3 font-heading text-lg font-semibold">Mesas</h2>
        <ComandaBoard itensCardapio={itensCardapio} pedidosPorMesa={pedidosPorMesa} />
      </div>

      <div>
        <h2 className="mb-3 font-heading text-lg font-semibold">Pedidos pra cozinha</h2>
        <CozinhaBoard pedidos={pedidosCozinha} />
      </div>
    </div>
  );
}
