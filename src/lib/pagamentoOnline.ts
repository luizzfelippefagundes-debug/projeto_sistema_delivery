import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "../db";
import { itensPedido, pedidos } from "../db/schema";
import { devolverEstoque } from "../db/queries/cardapio";
import { fmtBRL } from "./data";
import { notificarNovoPedido } from "./webPush";

// Updates condicionados ao status "aguardando_pagamento" deixam os dois
// handlers idempotentes — o Asaas pode reenviar o mesmo evento.

export async function confirmarPagamentoOnline(checkoutId: string) {
  const [pedido] = await getDb()
    .update(pedidos)
    .set({ status: "novo" })
    .where(and(eq(pedidos.asaasCheckoutId, checkoutId), eq(pedidos.status, "aguardando_pagamento")))
    .returning();
  if (!pedido) return;

  await notificarNovoPedido(pedido.restauranteId, ["cozinha", "atendente"], {
    title: "Novo pedido pelo site! (pago)",
    body: `${pedido.clienteNome ?? "Cliente"} · ${fmtBRL(pedido.total)}`,
    url: "/cozinha",
  });

  revalidatePath("/cozinha");
  revalidatePath("/atendente");
  revalidatePath("/motoboy");
  revalidatePath("/dono");
}

export async function cancelarPagamentoOnline(checkoutId: string) {
  const db = getDb();
  const [pedido] = await db
    .update(pedidos)
    .set({ status: "cancelado" })
    .where(and(eq(pedidos.asaasCheckoutId, checkoutId), eq(pedidos.status, "aguardando_pagamento")))
    .returning();
  if (!pedido) return;

  const itens = await db.select().from(itensPedido).where(eq(itensPedido.pedidoId, pedido.id));
  await devolverEstoque(
    itens.filter((i) => i.itemCardapioId).map((i) => ({ itemCardapioId: i.itemCardapioId!, quantidade: i.quantidade })),
  );
  revalidatePath("/dono/estoque");
}
