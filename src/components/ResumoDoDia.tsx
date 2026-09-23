import { AlertTriangle, Banknote, ClipboardList } from "lucide-react";
import { fmtBRL } from "@/lib/data";

export default function ResumoDoDia({
  pedidosHoje,
  faturadoHoje,
  atrasados,
}: {
  pedidosHoje: number;
  faturadoHoje: number;
  atrasados: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-status-neutral-bg text-status-neutral-fg">
          <ClipboardList className="size-4" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Pedidos hoje</p>
          <p className="num font-heading text-lg font-semibold">{pedidosHoje}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-status-ok-bg text-status-ok-fg">
          <Banknote className="size-4" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Faturado hoje</p>
          <p className="num font-heading text-lg font-semibold">{fmtBRL(faturadoHoje)}</p>
        </div>
      </div>
      <div className="col-span-2 flex items-center gap-3 rounded-xl border border-border bg-card p-3 sm:col-span-1">
        <div
          className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
            atrasados > 0 ? "bg-status-danger-bg text-status-danger-fg" : "bg-status-neutral-bg text-status-neutral-fg"
          }`}
        >
          <AlertTriangle className="size-4" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Atrasados</p>
          <p className="num font-heading text-lg font-semibold">{atrasados}</p>
        </div>
      </div>
    </div>
  );
}
