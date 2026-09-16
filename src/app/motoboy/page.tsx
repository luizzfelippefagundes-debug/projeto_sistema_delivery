import MotoboyBoard, { type PedidoEntrega } from "@/components/MotoboyBoard";
import { getConfiguracoes } from "@/db/queries/configuracoes";
import { getItensAgrupadosPorPedido, getPedidosAbertos } from "@/db/queries/pedidos";
import { requireFuncionarioAccess } from "@/lib/funcionarioAuth";

export const dynamic = "force-dynamic";

export default async function MotoboyPage() {
  const funcionario = await requireFuncionarioAccess("motoboy");

  const [abertos, config] = await Promise.all([
    getPedidosAbertos(funcionario.restauranteId),
    getConfiguracoes(funcionario.restauranteId),
  ]);

  const doDelivery = abertos.filter((p) => p.origem === "delivery" && (p.status === "pronto" || p.status === "rota"));
  const itensPorPedido = await getItensAgrupadosPorPedido(doDelivery.map((p) => p.id));

  const pedidos: PedidoEntrega[] = doDelivery
    .sort((a, b) => a.criadoEm.getTime() - b.criadoEm.getTime())
    .map((p) => ({
      id: p.id,
      clienteNome: p.clienteNome,
      telefoneCliente: p.telefoneCliente,
      endereco: p.endereco,
      formaPagamento: p.formaPagamento,
      status: p.status,
      total: p.total,
      itens: (itensPorPedido.get(p.id) ?? []).map((i) => ({ nome: i.nome, quantidade: i.quantidade, preco: i.preco })),
    }));

  return <MotoboyBoard pedidos={pedidos} enderecoLoja={config?.enderecoLoja ?? null} />;
}
