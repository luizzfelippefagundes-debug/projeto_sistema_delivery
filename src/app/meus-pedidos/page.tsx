import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import CustomerHeader from "@/components/CustomerHeader";
import CustomerTabBar from "@/components/CustomerTabBar";
import StatusBadge from "@/components/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { getClientePorClerkId } from "@/db/queries/clientes";
import { getPedidosPorClienteId } from "@/db/queries/pedidos";
import { getRestaurantePorId, getRestaurantePrincipal } from "@/db/queries/restaurantes";
import { fmtBRL } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function MeusPedidosPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const cliente = await getClientePorClerkId(userId);
  const pedidos = cliente ? await getPedidosPorClienteId(cliente.id) : [];
  const restaurante = cliente ? await getRestaurantePorId(cliente.restauranteId) : await getRestaurantePrincipal();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <CustomerHeader nomeRestaurante={restaurante?.nome} />

      <div className="mx-auto flex w-full max-w-lg flex-col gap-4 p-4 pb-24 md:p-6">
        <h1 className="font-heading text-xl font-semibold">Meus pedidos</h1>

        {pedidos.length === 0 && (
          <p className="text-sm text-muted-foreground">Você ainda não fez nenhum pedido por aqui.</p>
        )}

        <div className="flex flex-col gap-3">
          {pedidos.map((p) => (
            <Link key={p.id} href={`/pedido/${p.id}`}>
              <Card className="transition-colors hover:border-primary/40">
                <CardContent className="flex items-center justify-between gap-3 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">Pedido #{p.id.slice(0, 8)}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.criadoEm.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="num text-sm font-semibold">{fmtBRL(p.total)}</span>
                    <StatusBadge status={p.status} />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
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
