import type { Origem, OrderStatus } from "./types";

/** Um pedido de mesa só vira faturamento quando a mesa realmente fecha
 * (status "finalizado", ver fecharMesaAction) — antes disso é só um pedido
 * em aberto, que ainda pode mudar. Delivery conta desde já, igual sempre
 * contou (não existe hoje um passo de "cliente retirou" pra pedidos de
 * balcão, então travar isso também em "finalizado"/"entregue" faria a
 * receita de retirada sumir dos painéis). Cancelado nunca conta, não
 * importa a origem — não virou venda de verdade. */
export function contaComoFaturamento(pedido: { origem: Origem; status: OrderStatus }): boolean {
  if (pedido.status === "cancelado") return false;
  return pedido.origem !== "salao" || pedido.status === "finalizado";
}
