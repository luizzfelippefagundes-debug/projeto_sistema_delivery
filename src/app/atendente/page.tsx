import ComandaBoard from "@/components/ComandaBoard";
import { getItensCardapio } from "@/db/queries/cardapio";
import { getConfiguracoes } from "@/db/queries/configuracoes";
import { getMesasComFechamentoPendente } from "@/db/queries/fechamentoMesa";
import { getItensAgrupadosPorPedido, getPedidosAbertos } from "@/db/queries/pedidos";
import { requireFuncionarioAccess } from "@/lib/funcionarioAuth";
import type { OrderStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AtendentePage() {
  const funcionario = await requireFuncionarioAccess("atendente");

  const [itensCardapioTodos, pedidosAbertos, config, mesasQuerFechar] = await Promise.all([
    getItensCardapio(funcionario.restauranteId),
    getPedidosAbertos(funcionario.restauranteId),
    getConfiguracoes(funcionario.restauranteId),
    getMesasComFechamentoPendente(funcionario.restauranteId),
  ]);

  const itensCardapio = itensCardapioTodos.filter((i) => i.ativo);
  const pedidosSalao = pedidosAbertos.filter((p) => p.origem === "salao" && p.mesa != null);
  const itensPorPedido = await getItensAgrupadosPorPedido(pedidosSalao.map((p) => p.id));

  const pedidosPorMesa: Record<number, { id: string; status: OrderStatus; itemCount: number }[]> = {};
  for (const p of pedidosSalao) {
    const mesa = p.mesa as number;
    (pedidosPorMesa[mesa] ??= []).push({
      id: p.id,
      status: p.status,
      itemCount: itensPorPedido.get(p.id)?.length ?? 0,
    });
  }

  return (
    <ComandaBoard
      itensCardapio={itensCardapio}
      pedidosPorMesa={pedidosPorMesa}
      numeroMesas={config?.numeroMesas ?? 8}
      mesasQuerFechar={mesasQuerFechar}
    />
  );
}
