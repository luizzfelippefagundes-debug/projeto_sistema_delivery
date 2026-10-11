import { and, eq, lt } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "../db";
import { itensPedido, pedidos } from "../db/schema";
import { devolverEstoque } from "../db/queries/cardapio";
import { apagarPagamentoAsaas, buscarPagamentoAsaas, pagamentoQuitado } from "./asaas";
import { fmtBRL } from "./data";
import { notificarNovoPedido } from "./webPush";

/** Tempo que o cliente tem pra pagar antes do pedido ser cancelado. */
export const MINUTOS_PARA_PAGAR = 15;

// Updates condicionados ao status "aguardando_pagamento" deixam os handlers
// idempotentes — o Asaas pode reenviar o mesmo evento, e a tela do cartão e o
// webhook podem confirmar o mesmo pagamento.

export async function confirmarPagamentoOnline(pagamentoId: string) {
  const [pedido] = await getDb()
    .update(pedidos)
    .set({ status: "novo" })
    .where(and(eq(pedidos.asaasPagamentoId, pagamentoId), eq(pedidos.status, "aguardando_pagamento")))
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

export async function cancelarPagamentoOnline(pagamentoId: string) {
  const db = getDb();
  const [pedido] = await db
    .update(pedidos)
    .set({ status: "cancelado" })
    .where(and(eq(pedidos.asaasPagamentoId, pagamentoId), eq(pedidos.status, "aguardando_pagamento")))
    .returning();
  if (!pedido) return;

  const itens = await db.select().from(itensPedido).where(eq(itensPedido.pedidoId, pedido.id));
  await devolverEstoque(
    itens.filter((i) => i.itemCardapioId).map((i) => ({ itemCardapioId: i.itemCardapioId!, quantidade: i.quantidade })),
  );
  revalidatePath("/dono/estoque");
}

/** Pergunta ao Asaas como está a cobrança de um pedido que espera pagamento:
 * se foi paga, confirma (não depende só do webhook chegar); se passou do
 * prazo sem pagar, apaga a cobrança, pra o Pix não poder mais ser pago, e
 * cancela o pedido. */
export async function sincronizarPagamento(pedido: {
  status: string;
  criadoEm: Date;
  asaasPagamentoId: string | null;
}): Promise<void> {
  if (pedido.status !== "aguardando_pagamento" || !pedido.asaasPagamentoId) return;

  const id = pedido.asaasPagamentoId;
  const pagamento = await buscarPagamentoAsaas(id);
  if (pagamentoQuitado(pagamento.status)) {
    await confirmarPagamentoOnline(id);
    return;
  }
  if (Date.now() - pedido.criadoEm.getTime() < MINUTOS_PARA_PAGAR * 60_000) return;
  await apagarPagamentoAsaas(id);
  await cancelarPagamentoOnline(id);
}

/** Varredura dos pedidos esquecidos (cliente fechou a página sem pagar),
 * pra o estoque reservado voltar. */
export async function expirarPagamentosVencidos(): Promise<number> {
  const limite = new Date(Date.now() - MINUTOS_PARA_PAGAR * 60_000);
  const vencidos = await getDb()
    .select({ status: pedidos.status, criadoEm: pedidos.criadoEm, asaasPagamentoId: pedidos.asaasPagamentoId })
    .from(pedidos)
    .where(and(eq(pedidos.status, "aguardando_pagamento"), lt(pedidos.criadoEm, limite)));
  for (const pedido of vencidos) {
    await sincronizarPagamento(pedido).catch((e) => console.error("[asaas] falha ao sincronizar pagamento:", e));
  }
  return vencidos.length;
}
