import { ClipboardList, ShoppingBag, Truck } from "lucide-react";
import { fmtBRL, minAgo, STATUS_LABEL } from "@/lib/data";
import { requireFuncionarioAccess } from "@/lib/funcionarioAuth";
import { getItensAgrupadosPorPedido, getPedidosDoDia } from "@/db/queries/pedidos";
import { Card, CardContent } from "@/components/ui/card";

export default async function DonoDashboardPage() {
  const dono = await requireFuncionarioAccess("dono");
  const pedidosHoje = await getPedidosDoDia(dono.restauranteId);
  const itensPorPedido = await getItensAgrupadosPorPedido(pedidosHoje.map((p) => p.id));

  const faturadoHoje = pedidosHoje.reduce((s, p) => s + p.total, 0);
  const emAndamento = pedidosHoje.filter((p) => p.status !== "finalizado");

  const tiles = [
    { icon: ShoppingBag, label: "Faturado hoje", value: fmtBRL(faturadoHoje), tint: "bg-status-ok-bg text-status-ok-fg" },
    { icon: ClipboardList, label: "Pedidos hoje", value: String(pedidosHoje.length), tint: "bg-status-neutral-bg text-status-neutral-fg" },
    { icon: Truck, label: "Em andamento", value: String(emAndamento.length), tint: "bg-status-warn-bg text-status-warn-fg" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-2xl font-semibold">Olá, {dono.nome} 👋</h2>
        <p className="text-sm text-muted-foreground">Aqui está o resumo de hoje na Dashi Sushi.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {tiles.map((t) => (
          <Card key={t.label} className="gap-1 py-4">
            <CardContent className="flex items-center gap-3 px-4">
              <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${t.tint}`}>
                <t.icon className="size-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.label}</p>
                <p className="num font-heading text-xl font-semibold">{t.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <h3 className="mb-3 font-heading text-lg font-semibold">Pedidos de hoje</h3>
        <div className="flex flex-col gap-2">
          {pedidosHoje.length === 0 && <p className="text-sm text-muted-foreground">Nenhum pedido ainda hoje.</p>}
          {[...pedidosHoje]
            .reverse()
            .map((p) => {
              const itens = itensPorPedido.get(p.id) ?? [];
              const origemTxt = p.origem === "salao" ? `Mesa ${p.mesa}` : p.clienteNome || "Delivery";
              return (
                <Card key={p.id} className="py-3">
                  <CardContent className="flex items-center justify-between gap-3 px-4">
                    <div>
                      <p className="text-sm font-medium">{origemTxt}</p>
                      <p className="text-xs text-muted-foreground">
                        {itens.length} item(ns) · {STATUS_LABEL[p.status]}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="num text-sm font-semibold">{fmtBRL(p.total)}</p>
                      <p className="text-xs text-muted-foreground">{minAgo(p.criadoEm.getTime())}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </div>
      </div>
    </div>
  );
}
