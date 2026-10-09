import { auth } from "@clerk/nextjs/server";
import { Banknote, MapPinned, Store } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cancelarPedidoCliente } from "@/actions/pedidos.actions";
import CancelarPedidoButton from "@/components/CancelarPedidoButton";
import CustomerHeader from "@/components/CustomerHeader";
import CustomerTabBar from "@/components/CustomerTabBar";
import PedidoStatusWatcher from "@/components/PedidoStatusWatcher";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getClientePorClerkId } from "@/db/queries/clientes";
import { getPedidoComItens } from "@/db/queries/pedidos";
import { getRestaurantePorId } from "@/db/queries/restaurantes";
import { podeCancelarPedido } from "@/lib/cancelamento";
import { fmtBRL, minAgo } from "@/lib/data";
import type { Pagamento } from "@/lib/types";

export const dynamic = "force-dynamic";

function statusPagamento(forma: Pagamento | null) {
  if (forma === "pix") return { pago: true, label: "Pago no Pix" };
  if (forma === "cartao") return { pago: false, label: "Pague no cartão na entrega/retirada" };
  return { pago: false, label: "Pague em dinheiro na entrega/retirada" };
}

export default async function PedidoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const resultado = await getPedidoComItens(id);
  if (!resultado) notFound();
  const { pedido, itens } = resultado;

  // Pedido de quem não tinha conta (checkout sem login) não tem dono pra
  // conferir — o próprio id, praticamente impossível de adivinhar, já é o
  // que dá acesso. Só quando o pedido tem clienteId (cliente com conta) é
  // que exigimos ser o dono dele pra ver.
  if (pedido.clienteId) {
    const { userId } = await auth();
    const cliente = userId ? await getClientePorClerkId(userId) : null;
    if (!cliente || pedido.clienteId !== cliente.id) notFound();
  }

  const restaurante = await getRestaurantePorId(pedido.restauranteId);
  const retirada = !pedido.endereco || /retirada/i.test(pedido.endereco);
  const pagamento = statusPagamento(pedido.formaPagamento);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <CustomerHeader nomeRestaurante={restaurante?.nome} logoUrl={restaurante?.logoUrl} slug={restaurante?.slug} />

      <div className="mx-auto flex w-full max-w-lg flex-col gap-5 p-4 pb-24 md:p-6">
        <div>
          {(() => {
            const nomes = itens.map((i) => i.nome);
            const titulo =
              nomes.length === 0
                ? "Pedido"
                : nomes.length <= 2
                  ? nomes.join(", ")
                  : `${nomes.slice(0, 2).join(", ")} +${nomes.length - 2}`;
            return (
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {titulo}
              </p>
            );
          })()}
          <p className="text-sm text-muted-foreground">Feito há {minAgo(pedido.criadoEm.getTime())}</p>
        </div>

        <Card>
          <CardContent className="flex flex-col gap-3 px-5 py-4">
            <PedidoStatusWatcher
              pedidoId={pedido.id}
              statusInicial={pedido.status}
              retiradaInicial={retirada}
            />
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

        {podeCancelarPedido(pedido.status) && <CancelarPedidoButton aoConfirmar={cancelarPedidoCliente.bind(null, pedido.id)} />}

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
