import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import CustomerHeader from "@/components/CustomerHeader";
import CustomerTabBar from "@/components/CustomerTabBar";
import StatusBadge from "@/components/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { getClientePorClerkId } from "@/db/queries/clientes";
import { getItensAgrupadosPorPedido, getPedidosPorClienteId, getPedidosPorIds } from "@/db/queries/pedidos";
import { getRestaurantePorId, getRestaurantePrincipal } from "@/db/queries/restaurantes";
import { fmtBRL } from "@/lib/data";

export const dynamic = "force-dynamic";

/** Sem conta, não tem `clienteId` pra buscar o histórico — a aba "Pedidos"
 * manda aqui os ids que salvou no navegador de quem fez o pedido (ver
 * `pedidosConvidado.ts`), e é por eles que buscamos os pedidos de quem não
 * logou. */
export default async function MeusPedidosPage({
  searchParams,
}: {
  searchParams: Promise<{ guest?: string }>;
}) {
  const { userId } = await auth();
  const { guest } = await searchParams;

  const cliente = userId ? await getClientePorClerkId(userId) : null;
  const idsConvidado = !userId && guest ? guest.split(",").filter(Boolean).slice(0, 20) : [];

  const pedidos = cliente
    ? await getPedidosPorClienteId(cliente.id)
    : idsConvidado.length > 0
      ? await getPedidosPorIds(idsConvidado)
      : [];

  const itensPorPedido = await getItensAgrupadosPorPedido(pedidos.map((p) => p.id));

  const restaurante = cliente
    ? await getRestaurantePorId(cliente.restauranteId)
    : pedidos[0]
      ? await getRestaurantePorId(pedidos[0].restauranteId)
      : await getRestaurantePrincipal();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <CustomerHeader nomeRestaurante={restaurante?.nome} logoUrl={restaurante?.logoUrl} slug={restaurante?.slug} />

      <div className="mx-auto flex w-full max-w-lg flex-col gap-4 p-4 pb-24 md:p-6">
        <h1 className="font-heading text-xl font-semibold">Meus pedidos</h1>

        {pedidos.length === 0 && (
          <p className="text-sm text-muted-foreground">Você ainda não fez nenhum pedido por aqui.</p>
        )}

        <div className="flex flex-col gap-3">
          {pedidos.map((p) => {
            const itens = itensPorPedido.get(p.id) ?? [];
            const nomes = itens.map((i) => i.nome);
            const titulo =
              nomes.length === 0
                ? "Pedido"
                : nomes.length <= 2
                  ? nomes.join(", ")
                  : `${nomes.slice(0, 2).join(", ")} +${nomes.length - 2}`;
            return (
              <Link key={p.id} href={`/pedido/${p.id}`}>
                <Card className="transition-colors hover:border-primary/40">
                  <CardContent className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{titulo}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.criadoEm.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="num text-sm font-semibold">{fmtBRL(p.total)}</span>
                      <StatusBadge status={p.status} />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {restaurante && (
        <div className="fixed inset-x-0 bottom-0 z-40">
          <CustomerTabBar slug={restaurante.slug} />
        </div>
      )}
    </div>
  );
}
