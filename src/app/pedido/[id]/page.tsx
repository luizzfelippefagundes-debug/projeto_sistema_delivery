import { auth, currentUser } from "@clerk/nextjs/server";
import { Banknote, MapPinned, Store } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import CustomerHeader from "@/components/CustomerHeader";
import CustomerTabBar from "@/components/CustomerTabBar";
import { CartaoPagamento, PixPagamento } from "@/components/PagamentoOnline";
import PedidoStatusWatcher from "@/components/PedidoStatusWatcher";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getClientePorClerkId } from "@/db/queries/clientes";
import { getPedidoComItens } from "@/db/queries/pedidos";
import { getRestaurantePorId } from "@/db/queries/restaurantes";
import { buscarPagamentoAsaas, buscarPixQrCode } from "@/lib/asaas";
import { fmtBRL, minAgo } from "@/lib/data";
import { MINUTOS_PARA_PAGAR, sincronizarPagamento } from "@/lib/pagamentoOnline";
import type { OrderStatus, Pagamento } from "@/lib/types";

export const dynamic = "force-dynamic";

function statusPagamento(forma: Pagamento | null, status: OrderStatus, online: boolean) {
  if (online) {
    if (status === "aguardando_pagamento") return { pago: false, label: "Aguardando pagamento online" };
    if (status === "cancelado") return { pago: false, label: "Pagamento não realizado" };
    return { pago: true, label: forma === "pix" ? "Pago no Pix" : "Pago no cartão" };
  }
  if (forma === "pix") return { pago: true, label: "Pago no Pix" };
  if (forma === "cartao") return { pago: false, label: "Pague no cartão na entrega/retirada" };
  return { pago: false, label: "Pague em dinheiro na entrega/retirada" };
}

/** Dados pra tela de pagar na própria página; null se não der pra montar
 * (aí o card mostra só o aviso de tentar de novo). */
async function dadosPagamento(pedido: { asaasPagamentoId: string | null; formaPagamento: Pagamento | null }) {
  if (!pedido.asaasPagamentoId) return null;
  try {
    const cobranca = await buscarPagamentoAsaas(pedido.asaasPagamentoId);
    if (pedido.formaPagamento !== "pix") return { tipo: "cartao" as const, valor: cobranca.value };
    const qr = await buscarPixQrCode(pedido.asaasPagamentoId);
    return { tipo: "pix" as const, valor: cobranca.value, qr };
  } catch (e) {
    console.error("[asaas] falha ao carregar pagamento do pedido", e);
    return null;
  }
}

export default async function PedidoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let resultado = await getPedidoComItens(id);
  if (!resultado) notFound();
  if (resultado.pedido.status === "aguardando_pagamento") {
    await sincronizarPagamento(resultado.pedido).catch((e) => console.error("[asaas] falha ao sincronizar pagamento:", e));
    resultado = (await getPedidoComItens(id)) ?? resultado;
  }
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
  const pagamento = statusPagamento(pedido.formaPagamento, pedido.status, !!pedido.asaasPagamentoId);
  const aPagar = pedido.status === "aguardando_pagamento" ? await dadosPagamento(pedido) : null;
  const usuario = aPagar?.tipo === "cartao" ? await currentUser() : null;
  // No cartão o cliente paga a taxa por cima do total; o valor cobrado de
  // verdade fica no Asaas.
  const valorCobrado =
    pedido.formaPagamento === "cartao" && pedido.asaasPagamentoId
      ? (aPagar?.valor ??
        (await buscarPagamentoAsaas(pedido.asaasPagamentoId)
          .then((c) => c.value)
          .catch(() => null)))
      : null;
  const taxaCartao = valorCobrado != null && valorCobrado > pedido.total ? valorCobrado - pedido.total : 0;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <CustomerHeader nomeRestaurante={restaurante?.nome} />

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

        {pedido.status === "aguardando_pagamento" && (
          <Card className="border-status-warn-fg/40">
            <CardContent className="px-5 py-4">
              {aPagar?.tipo === "pix" ? (
                <PixPagamento
                  qrCodeBase64={aPagar.qr.encodedImage}
                  copiaECola={aPagar.qr.payload}
                  valor={aPagar.valor}
                  expiraEm={pedido.criadoEm.getTime() + MINUTOS_PARA_PAGAR * 60_000}
                />
              ) : aPagar?.tipo === "cartao" ? (
                <CartaoPagamento
                  pedidoId={pedido.id}
                  valor={aPagar.valor}
                  telefoneInicial={pedido.telefoneCliente}
                  emailInicial={usuario?.primaryEmailAddress?.emailAddress}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Não deu pra carregar o pagamento agora. Atualize a página em instantes.
                </p>
              )}
            </CardContent>
          </Card>
        )}

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
            {taxaCartao > 0 && (
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Taxa do cartão</span>
                <span className="num">{fmtBRL(taxaCartao)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-border pt-3 text-sm font-semibold">
              <span>Total</span>
              <span className="num">{fmtBRL(pedido.total + taxaCartao)}</span>
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
