import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import StatusBadge from "@/components/StatusBadge";
import { getHistoricoCliente } from "@/db/queries/clientes";
import { fmtBRL, origemLabel } from "@/lib/data";
import { requireFuncionarioAccess } from "@/lib/funcionarioAuth";
import { notFound } from "next/navigation";

export default async function HistoricoClientePage({
  params,
}: {
  params: Promise<{ nome: string }>;
}) {
  const dono = await requireFuncionarioAccess("dono");
  const { nome: nomeParam } = await params;
  const nome = decodeURIComponent(nomeParam);
  const historico = await getHistoricoCliente(dono.restauranteId, nome);

  if (historico.length === 0) notFound();

  const totalGasto = historico.reduce((s, h) => s + h.pedido.total, 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/dono/clientes" className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline">
          <ArrowLeft className="size-4" /> Voltar pra clientes
        </Link>
        <h2 className="font-heading text-2xl font-semibold">{nome}</h2>
        <p className="text-sm text-muted-foreground">
          {historico.length} pedido{historico.length === 1 ? "" : "s"} — {fmtBRL(totalGasto)} no total
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {historico.map(({ pedido, itens }) => (
          <Card key={pedido.id}>
            <CardContent className="flex flex-col gap-3 px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{origemLabel(pedido)}</p>
                  <p className="text-xs text-muted-foreground">
                    {pedido.criadoEm.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                  </p>
                </div>
                <StatusBadge status={pedido.status} />
              </div>
              <div className="flex flex-col gap-1 border-t border-border pt-2">
                {itens.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {item.quantidade}x {item.nome}
                    </span>
                    <span className="num">{fmtBRL(item.preco * item.quantidade)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between border-t border-border pt-2 text-sm font-semibold">
                <span>Total</span>
                <span className="num">{fmtBRL(pedido.total)}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
