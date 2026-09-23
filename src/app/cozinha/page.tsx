import CozinhaBoard, { type PedidoCozinha } from "@/components/CozinhaBoard";
import { getItensAgrupadosPorPedido, getPedidosAbertos } from "@/db/queries/pedidos";
import { requireFuncionarioAccess } from "@/lib/funcionarioAuth";

export const dynamic = "force-dynamic";

export default async function CozinhaPage() {
  const funcionario = await requireFuncionarioAccess("cozinha");

  const abertos = await getPedidosAbertos(funcionario.restauranteId);
  const doCozinha = abertos.filter((p) => p.status === "novo" || p.status === "preparo" || p.status === "pronto");
  const itensPorPedido = await getItensAgrupadosPorPedido(doCozinha.map((p) => p.id));

  const pedidos: PedidoCozinha[] = doCozinha.map((p) => ({
    id: p.id,
    origem: p.origem,
    mesa: p.mesa,
    clienteNome: p.clienteNome,
    status: p.status,
    total: p.total,
    criadoEm: p.criadoEm.getTime(),
    itens: (itensPorPedido.get(p.id) ?? []).map((i) => ({ nome: i.nome, quantidade: i.quantidade, observacao: i.observacao })),
  }));

  return <CozinhaBoard pedidos={pedidos} />;
}
