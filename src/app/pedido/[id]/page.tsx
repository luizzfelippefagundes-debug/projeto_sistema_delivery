import { auth } from "@clerk/nextjs/server";
import { Banknote, MapPinned, Store } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import CustomerHeader from "@/components/CustomerHeader";
import CustomerTabBar from "@/components/CustomerTabBar";
import OrderTimeline from "@/components/OrderTimeline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getClientePorClerkId } from "@/db/queries/clientes";
import { getPedidoComItens } from "@/db/queries/pedidos";
import { getRestaurantePorId } from "@/db/queries/restaurantes";
import { fmtBRL, minAgo } from "@/lib/data";
import type { Pagamento } from "@/lib/types";

export const dynamic = "force-dynamic";

function statusPagamento(forma: Pagamento | null) {
  if (forma === "pix") return { pago: true, label: "Pago no Pix" };
  if (forma === "cartao") return { pago: false, label: "Pague no cartão na entrega/retirada" };
  return { pago: false, label: "Pague em dinheiro na entrega/retirada" };
}

export default async function PedidoPage({ params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { id } = await params;
  const resultado = await getPedidoComItens(id);
  if (!resultado) notFound();
  const { pedido, itens } = resultado;

  const cliente = await getClientePorClerkId(userId);
  if (!cliente || pedido.clienteId !== cliente.id) notFound();

  const restaurante = await getRestaurantePorId(pedido.restauranteId);
  const retirada = !pedido.endereco || /retirada/i.test(pedido.endereco);
  const pagamento = statusPagamento(pedido.formaPagamento);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <CustomerHeader nomeRestaurante={restaurante?.nome} />

      <div className="mx-auto flex w-full max-w-lg flex-col gap-5 p-4 pb-24 md:p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Pedido #{pedido.id.slice(0, 8)}
          </p>
          <p className="text-sm text-muted-foreground">Feito há {minAgo(pedido.criadoEm.getTime())}</p>
        </div>

        <Card>
          <CardContent className="px-5 py-4">
            <OrderTimeline status={pedido.status} retirada={retirada} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-3 px-4 py-4">
            <div className="flex items-start gap-2 text-sm">
              {retirada ? (
                <>
                  <Store className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <span>Retirada no balcão</span>
                </>
              ) : (
                <>
                  <MapPinned className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <span>{pedido.endereco}</span>
                </>
              )}
            </div>
            <div>
              <Badge className={pagamento.pago ? "bg-status-ok-bg text-status-ok-fg" : "bg-status-warn-bg text-status-warn-fg"}>
                <Banknote className="size-3" /> {pagamento.label}
              </Badge>
            </div>
            {pedido.cpfNota && <p className="text-xs text-muted-foreground">CPF na nota: {pedido.cpfNota}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-1 px-4 py-4">
            {itens.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <div>
                  <span className="text-muted-foreground">
                    {item.quantidade}x {item.nome}
                  </span>
                  {item.observacao && <p className="text-xs text-muted-foreground">↳ {item.observacao}</p>}
                </div>
                <span className="num">{fmtBRL(item.preco * item.quantidade)}</span>
              </div>
            ))}
            {pedido.taxaEntrega != null && pedido.taxaEntrega > 0 && (
              <div className="mt-2 flex justify-between border-t border-border pt-2 text-sm text-muted-foreground">
                <span>Taxa de entrega</span>
                <span className="num">{fmtBRL(pedido.taxaEntrega)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-border pt-3 text-sm font-semibold">
              <span>Total</span>
              <span className="num">{fmtBRL(pedido.total)}</span>
            </div>
          </CardContent>
        </Card>

        {restaurante && (
          <Link href={`/loja/${restaurante.slug}`}>
            <Button variant="outline" className="w-full">
              Fazer novo pedido
            </Button>
          </Link>
        )}
      </div>

      {restaurante && (
        <div className="fixed inset-x-0 bottom-0 z-40">
          <CustomerTabBar slug={restaurante.slug} />
        </div>
      )}
    </div>
  );
}
