import MotoboyHistorico, { type PedidoHistorico } from "@/components/MotoboyHistorico";
import { getEntregasDoMotoboyDesde, getPedidosAbertos } from "@/db/queries/pedidos";
import { requireFuncionarioAccess } from "@/lib/funcionarioAuth";
import { inicioDoDia } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function MotoboyHistoricoPage() {
  const funcionario = await requireFuncionarioAccess("motoboy");

  const [abertos, entreguesHoje] = await Promise.all([
    getPedidosAbertos(funcionario.restauranteId),
    getEntregasDoMotoboyDesde(funcionario.restauranteId, funcionario.id, inicioDoDia()),
  ]);

  const emAndamento = abertos.filter((p) => p.origem === "delivery" && (p.status === "pronto" || p.status === "rota")).length;

  const historico: PedidoHistorico[] = entreguesHoje.map((p) => ({
    id: p.id,
    clienteNome: p.clienteNome,
    endereco: p.endereco,
    total: p.total,
    criadoEm: p.criadoEm,
  }));

  return <MotoboyHistorico pedidosEmAndamento={emAndamento} historico={historico} />;
}
