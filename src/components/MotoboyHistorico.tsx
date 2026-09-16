import { Banknote, CheckCircle2, Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { fmtBRL, fmtHora } from "@/lib/data";

export interface PedidoHistorico {
  id: string;
  clienteNome: string | null;
  endereco: string | null;
  total: number;
  criadoEm: Date;
}

const STATS_TINT = [
  "bg-status-neutral-bg text-status-neutral-fg",
  "bg-status-ok-bg text-status-ok-fg",
  "bg-status-warn-bg text-status-warn-fg",
];

function StatCard({
  label,
  valor,
  icon: Icon,
  tint,
}: {
  label: string;
  valor: string | number;
  icon: React.ComponentType<{ className?: string }>;
  tint: string;
}) {
  return (
    <Card className="gap-1 py-4">
      <CardContent className="flex items-center gap-3 px-4">
        <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${tint}`}>
          <Icon className="size-5" />
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="num font-heading text-lg font-semibold">{valor}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function MotoboyHistorico({ pedidosEmAndamento, historico }: { pedidosEmAndamento: number; historico: PedidoHistorico[] }) {
  const totalEntregueHoje = historico.reduce((s, p) => s + p.total, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Em andamento" valor={pedidosEmAndamento} icon={Package} tint={STATS_TINT[0]} />
        <StatCard label="Entregues hoje" valor={historico.length} icon={CheckCircle2} tint={STATS_TINT[1]} />
        <StatCard label="Total entregue hoje" valor={fmtBRL(totalEntregueHoje)} icon={Banknote} tint={STATS_TINT[2]} />
      </div>

      <div>
        <h2 className="mb-3 font-heading text-lg font-semibold">Minhas entregas de hoje</h2>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-2 font-medium">Hora</th>
                <th className="px-4 py-2 font-medium">Cliente</th>
                <th className="px-4 py-2 font-medium">Endereço</th>
                <th className="px-4 py-2 text-right font-medium">Valor</th>
              </tr>
            </thead>
            <tbody>
              {historico.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                    Nenhuma entrega concluída hoje ainda.
                  </td>
                </tr>
              )}
              {historico.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0">
                  <td className="whitespace-nowrap px-4 py-2.5 text-muted-foreground">{fmtHora(p.criadoEm.getTime())}</td>
                  <td className="px-4 py-2.5 font-medium">{p.clienteNome ?? "Cliente"}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{p.endereco ?? "—"}</td>
                  <td className="num px-4 py-2.5 text-right">{fmtBRL(p.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
