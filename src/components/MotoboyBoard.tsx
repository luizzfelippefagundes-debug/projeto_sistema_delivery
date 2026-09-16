"use client";

import { Banknote, Maximize2, MapPinned, Navigation, Phone, Store } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { avancarStatusEntrega } from "@/actions/pedidos.actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import StatusBadge from "@/components/StatusBadge";
import { fmtBRL } from "@/lib/data";
import type { OrderStatus, Pagamento } from "@/lib/types";

export interface PedidoEntrega {
  id: string;
  clienteNome: string | null;
  telefoneCliente: string | null;
  endereco: string | null;
  formaPagamento: Pagamento | null;
  status: OrderStatus;
  total: number;
  itens: { nome: string; quantidade: number; preco: number }[];
}

/** Pix é cobrado na hora do pedido (no bot ou no cardápio) — dinheiro e
 * cartão o motoboy ainda precisa cobrar na entrega. Não temos gateway de
 * pagamento real integrado ainda, então essa é a regra por enquanto. */
function statusPagamento(forma: Pagamento | null) {
  if (forma === "pix") return { pago: true, label: "Pago no Pix" };
  if (forma === "cartao") return { pago: false, label: "Cobrar no cartão" };
  return { pago: false, label: "Cobrar em dinheiro" };
}

function mapaUrls(endereco: string, enderecoLoja: string | null) {
  const destino = encodeURIComponent(endereco);
  const origem = enderecoLoja ? encodeURIComponent(enderecoLoja) : "";
  return {
    embed: origem
      ? `https://maps.google.com/maps?saddr=${origem}&daddr=${destino}&z=14&output=embed`
      : `https://maps.google.com/maps?q=${destino}&z=15&output=embed`,
    rota: origem
      ? `https://www.google.com/maps/dir/?api=1&origin=${origem}&destination=${destino}`
      : `https://www.google.com/maps/dir/?api=1&destination=${destino}`,
  };
}

export default function MotoboyBoard({
  pedidos,
  enderecoLoja,
}: {
  pedidos: PedidoEntrega[];
  enderecoLoja: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [mapaExpandido, setMapaExpandido] = useState<{ endereco: string; nome: string } | null>(null);

  useEffect(() => {
    const id = setInterval(() => router.refresh(), 15000);
    return () => clearInterval(id);
  }, [router]);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
      {pedidos.length === 0 && (
        <p className="text-sm text-muted-foreground">Nenhuma entrega em andamento.</p>
      )}
      {pedidos.map((o) => {
        const acao =
          o.status === "pronto"
            ? { label: "Confirmar saída", proximo: "rota" as const }
            : o.status === "rota"
              ? { label: "Confirmar entrega", proximo: "entregue" as const }
              : null;
        const retirada = !o.endereco || /retirada/i.test(o.endereco);
        const pagamento = statusPagamento(o.formaPagamento);
        const urls = o.endereco ? mapaUrls(o.endereco, enderecoLoja) : null;

        return (
          <Card key={o.id} className="gap-0 overflow-hidden py-0">
            <CardContent className="flex flex-col gap-0 p-0">
              <div className="flex items-start justify-between gap-3 p-4">
                <div>
                  <p className="font-semibold">{o.clienteNome ?? "Cliente"}</p>
                  {o.telefoneCliente && (
                    <a
                      href={`tel:${o.telefoneCliente}`}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <Phone className="size-3" /> {o.telefoneCliente}
                    </a>
                  )}
                </div>
                <StatusBadge status={o.status} />
              </div>

              <div className="flex flex-col gap-1 border-t border-border px-4 py-3">
                {o.itens.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {item.quantidade}x {item.nome}
                    </span>
                    <span className="num text-muted-foreground">{fmtBRL(item.preco * item.quantidade)}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between border-t border-border px-4 py-3">
                <span className="text-sm font-semibold">Total</span>
                <span className="num text-base font-bold">{fmtBRL(o.total)}</span>
              </div>

              <div className="flex items-center gap-2 border-t border-border px-4 py-3">
                <Badge className={pagamento.pago ? "bg-status-ok-bg text-status-ok-fg" : "bg-status-warn-bg text-status-warn-fg"}>
                  <Banknote className="size-3" /> {pagamento.label}
                </Badge>
              </div>

              {retirada || !urls ? (
                <div className="flex items-center gap-2 border-t border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                  <Store className="size-4" /> Retirada no balcão
                </div>
              ) : (
                <div className="border-t border-border">
                  <div className="flex items-start gap-1.5 px-4 pt-3 text-sm">
                    <MapPinned className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <span>{o.endereco}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMapaExpandido({ endereco: o.endereco!, nome: o.clienteNome ?? "Cliente" })}
                    className="group relative mx-4 my-3 block aspect-[16/10] w-auto overflow-hidden rounded-lg border border-border"
                  >
                    <iframe
                      title={`Mapa — ${o.endereco}`}
                      className="size-full pointer-events-none"
                      loading="lazy"
                      src={urls.embed}
                    />
                    <span className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/30 group-hover:opacity-100">
                      <span className="flex items-center gap-1.5 rounded-full bg-background px-3 py-1.5 text-xs font-semibold shadow-lg">
                        <Maximize2 className="size-3.5" /> Ampliar mapa
                      </span>
                    </span>
                  </button>
                  <div className="px-4 pb-3">
                    <a href={urls.rota} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="w-full">
                        <Navigation /> Traçar rota
                      </Button>
                    </a>
                  </div>
                </div>
              )}

              <div className="border-t border-border p-4">
                {acao ? (
                  <Button className="w-full" disabled={pending} onClick={() => startTransition(() => avancarStatusEntrega(o.id, acao.proximo))}>
                    {acao.label}
                  </Button>
                ) : (
                  <p className="text-center text-xs text-muted-foreground">Aguardando ficar pronto</p>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}

      <Dialog open={!!mapaExpandido} onOpenChange={(v) => !v && setMapaExpandido(null)}>
        <DialogContent className="flex h-[85vh] w-[calc(100%-2rem)] flex-col gap-2 overflow-hidden p-3 sm:max-w-3xl">
          <DialogHeader className="p-1">
            <DialogTitle>Rota até {mapaExpandido?.nome}</DialogTitle>
          </DialogHeader>
          {mapaExpandido && (
            <iframe
              title="Mapa ampliado"
              className="size-full flex-1 rounded-lg border border-border"
              src={mapaUrls(mapaExpandido.endereco, enderecoLoja).embed}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
