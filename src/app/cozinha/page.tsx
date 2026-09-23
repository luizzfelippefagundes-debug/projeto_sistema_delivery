import CozinhaBoard, { type PedidoCozinha } from "@/components/CozinhaBoard";
import PainelOperacional from "@/components/PainelOperacional";
import { getItensCardapio } from "@/db/queries/cardapio";
import { getItensAgrupadosPorPedido, getPedidosAbertos, getPedidosDoDia } from "@/db/queries/pedidos";
import { estaAtrasado } from "@/lib/data";
import { requireFuncionarioAccess } from "@/lib/funcionarioAuth";
import type { OrderStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CozinhaPage() {
  const funcionario = await requireFuncionarioAccess("cozinha");
  const tambemAtende = funcionario.papel === "dono" || funcionario.acessosExtras.includes("atendente");

  const abertos = await getPedidosAbertos(funcionario.restauranteId);
  const doCozinha = abertos.filter((p) => p.status === "novo" || p.status === "preparo" || p.status === "pronto");
  const pedidosSalao = abertos.filter((p) => p.origem === "salao" && p.mesa != null);
  const idsComItens = [...new Set([...doCozinha.map((p) => p.id), ...pedidosSalao.map((p) => p.id)])];
  const itensPorPedido = await getItensAgrupadosPorPedido(idsComItens);

  const pedidosCozinha: PedidoCozinha[] = doCozinha.map((p) => ({
    id: p.id,
    origem: p.origem,
    mesa: p.mesa,
    clienteNome: p.clienteNome,
    status: p.status,
    total: p.total,
    criadoEm: p.criadoEm.getTime(),
    itens: (itensPorPedido.get(p.id) ?? []).map((i) => ({ nome: i.nome, quantidade: i.quantidade, observacao: i.observacao })),
  }));

  if (!tambemAtende) {
    return <CozinhaBoard pedidos={pedidosCozinha} />;
  }

  const [itensCardapioTodos, pedidosHoje] = await Promise.all([
    getItensCardapio(funcionario.restauranteId),
    getPedidosDoDia(funcionario.restauranteId),
  ]);
  const itensCardapio = itensCardapioTodos.filter((i) => i.ativo);

  const pedidosPorMesa: Record<number, { id: string; status: OrderStatus; itemCount: number }[]> = {};
  for (const p of pedidosSalao) {
    const mesa = p.mesa as number;
    (pedidosPorMesa[mesa] ??= []).push({
      id: p.id,
      status: p.status,
      itemCount: itensPorPedido.get(p.id)?.length ?? 0,
    });
  }

  const resumo = {
    pedidosHoje: pedidosHoje.length,
    faturadoHoje: pedidosHoje.reduce((s, p) => s + p.total, 0),
    atrasados: doCozinha.filter((p) => estaAtrasado(p.criadoEm.getTime(), p.status)).length,
  };

  return (
    <PainelOperacional
      itensCardapio={itensCardapio}
      pedidosPorMesa={pedidosPorMesa}
      pedidosCozinha={pedidosCozinha}
      resumo={resumo}
    />
  );
}
