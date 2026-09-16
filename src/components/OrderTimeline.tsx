import { Check, ChefHat, ClipboardCheck, PackageCheck, Truck } from "lucide-react";
import type { OrderStatus } from "@/lib/types";

const PASSOS_ENTREGA = [
  { status: "novo" as OrderStatus, label: "Pedido recebido", icon: ClipboardCheck },
  { status: "preparo" as OrderStatus, label: "Em preparo", icon: ChefHat },
  { status: "pronto" as OrderStatus, label: "Pronto", icon: PackageCheck },
  { status: "rota" as OrderStatus, label: "Saiu pra entrega", icon: Truck },
  { status: "entregue" as OrderStatus, label: "Entregue", icon: Check },
];

const PASSOS_RETIRADA = [
  { status: "novo" as OrderStatus, label: "Pedido recebido", icon: ClipboardCheck },
  { status: "preparo" as OrderStatus, label: "Em preparo", icon: ChefHat },
  { status: "pronto" as OrderStatus, label: "Pronto pra retirar", icon: PackageCheck },
];

const ORDEM_STATUS: OrderStatus[] = ["novo", "preparo", "pronto", "rota", "entregue", "finalizado"];

export default function OrderTimeline({ status, retirada }: { status: OrderStatus; retirada: boolean }) {
  const passos = retirada ? PASSOS_RETIRADA : PASSOS_ENTREGA;
  const indiceAtual = ORDEM_STATUS.indexOf(status);

  return (
    <div className="flex flex-col">
      {passos.map((passo, idx) => {
        const indicePasso = ORDEM_STATUS.indexOf(passo.status);
        const concluido = indiceAtual > indicePasso || status === "finalizado";
        const atual = indiceAtual === indicePasso && status !== "finalizado";
        const ultimo = idx === passos.length - 1;
        const Icon = passo.icon;

        return (
          <div key={passo.status} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
                  concluido || atual
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                <Icon className="size-4" />
              </div>
              {!ultimo && <div className={`w-0.5 flex-1 ${concluido ? "bg-primary" : "bg-border"}`} style={{ minHeight: 24 }} />}
            </div>
            <div className={`pb-6 ${atual ? "" : ""}`}>
              <p className={`text-sm font-medium ${concluido || atual ? "text-foreground" : "text-muted-foreground"}`}>
                {passo.label}
              </p>
              {atual && <p className="text-xs text-muted-foreground">Agora</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
