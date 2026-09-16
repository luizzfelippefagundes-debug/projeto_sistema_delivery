import PedidosHistoricoTable from "@/components/PedidosHistoricoTable";
import { getItensAgrupadosPorPedido, getPedidosFiltrados } from "@/db/queries/pedidos";
import { fmtBRL } from "@/lib/data";
import { requireFuncionarioAccess } from "@/lib/funcionarioAuth";
import type { OrderStatus, Origem } from "@/lib/types";

const STATUS_OPCOES: OrderStatus[] = ["novo", "preparo", "pronto", "rota", "entregue", "finalizado"];
const STATUS_LABEL: Record<OrderStatus, string> = {
  novo: "Novo",
  preparo: "Em preparo",
  pronto: "Pronto",
  rota: "Em rota",
  entregue: "Entregue",
  finalizado: "Finalizado",
};

function selectClass() {
  return "rounded-md border border-input bg-background px-3 py-2 text-sm";
}

function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}

function haDias(dias: number) {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return d.toISOString().slice(0, 10);
}

export default async function HistoricoPedidosPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; origem?: string; de?: string; ate?: string }>;
}) {
  const dono = await requireFuncionarioAccess("dono");
  const sp = await searchParams;

  const de = sp.de || haDias(30);
  const ate = sp.ate || hojeISO();

  const pedidos = await getPedidosFiltrados(dono.restauranteId, {
    status: (sp.status as OrderStatus) || undefined,
    origem: (sp.origem as Origem) || undefined,
    de: new Date(de + "T00:00:00"),
    ate: new Date(ate + "T00:00:00"),
  });
  const ordenados = [...pedidos].reverse();
  const itensPorPedido = await getItensAgrupadosPorPedido(ordenados.map((p) => p.id));
  const pedidosComItens = ordenados.map((p) => ({ pedido: p, itens: itensPorPedido.get(p.id) ?? [] }));

  const faturamentoPeriodo = pedidos.reduce((s, p) => s + p.total, 0);

  return (
    <div className="flex flex-col gap-5">
      <form className="flex flex-wrap items-end gap-3" method="GET">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground" htmlFor="de">
            De
          </label>
          <input type="date" id="de" name="de" defaultValue={de} className={selectClass()} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground" htmlFor="ate">
            Até
          </label>
          <input type="date" id="ate" name="ate" defaultValue={ate} className={selectClass()} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground" htmlFor="status">
            Status
          </label>
          <select id="status" name="status" defaultValue={sp.status || ""} className={selectClass()}>
            <option value="">Todos</option>
            {STATUS_OPCOES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground" htmlFor="origem">
            Origem
          </label>
          <select id="origem" name="origem" defaultValue={sp.origem || ""} className={selectClass()}>
            <option value="">Todas</option>
            <option value="salao">Salão</option>
            <option value="delivery">Delivery</option>
          </select>
        </div>
        <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
          Filtrar
        </button>
      </form>

      <p className="text-sm text-muted-foreground">
        {pedidos.length} pedido(s) no período · faturamento <span className="num font-semibold text-foreground">{fmtBRL(faturamentoPeriodo)}</span>
      </p>

      <PedidosHistoricoTable pedidos={pedidosComItens} />
    </div>
  );
}
