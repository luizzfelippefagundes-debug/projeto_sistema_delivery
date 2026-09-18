import { Banknote, CheckCircle2, Inbox, MapPin, Package } from "lucide-react";
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
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold">Minhas entregas de hoje</h2>
          {historico.length > 0 && (
            <span className="text-xs font-medium text-muted-foreground">
              {historico.length} entrega{historico.length === 1 ? "" : "s"}
            </span>
          )}
        </div>

        {historico.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-10 text-center">
            <div className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Inbox className="size-5" />
            </div>
            <p className="text-sm font-medium">Nenhuma entrega concluída hoje ainda</p>
            <p className="text-xs text-muted-foreground">Suas entregas finalizadas aparecem aqui em tempo real.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {historico.map((p) => (
              <Card key={p.id} className="py-3">
                <CardContent className="flex items-center gap-3 px-4">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-status-ok-bg text-status-ok-fg">
                    <CheckCircle2 className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{p.clienteNome ?? "Cliente"}</p>
                    <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                      <MapPin className="size-3 shrink-0" />
                      {p.endereco ?? "Endereço não informado"}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="num text-sm font-semibold">{fmtBRL(p.total)}</p>
                    <p className="text-xs text-muted-foreground">{fmtHora(p.criadoEm.getTime())}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
