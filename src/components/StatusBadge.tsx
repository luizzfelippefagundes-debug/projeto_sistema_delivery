import { Badge } from "@/components/ui/badge";
import { STATUS_LABEL } from "@/lib/data";
import type { OrderStatus } from "@/lib/types";

const STATUS_CLASS: Record<OrderStatus, string> = {
  novo: "bg-status-neutral-bg text-status-neutral-fg",
  preparo: "bg-status-warn-bg text-status-warn-fg",
  pronto: "bg-status-ok-bg text-status-ok-fg",
  rota: "bg-status-warn-bg text-status-warn-fg",
  entregue: "bg-status-muted-bg text-status-muted-fg",
  finalizado: "bg-status-muted-bg text-status-muted-fg",
};

export default function StatusBadge({ status }: { status: OrderStatus }) {
  return <Badge className={STATUS_CLASS[status]}>{STATUS_LABEL[status]}</Badge>;
}
