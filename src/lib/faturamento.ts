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

/** Pedido parou de estar em andamento operacionalmente — mesa fecha em
 * "finalizado", delivery termina em "entregue" (ou foi cancelado). Não
 * confundir com `contaComoFaturamento`: aquela decide quando a receita é
 * reconhecida (delivery conta desde "novo"), essa decide quando o pedido
 * parou de precisar de atenção da cozinha/atendimento. Sem essa diferença,
 * um pedido de delivery já entregue continuaria contando como "em
 * andamento" pra sempre, já que delivery nunca vira "finalizado". */
export function pedidoConcluido(pedido: { origem: Origem; status: OrderStatus }): boolean {
  if (pedido.status === "cancelado") return true;
  return pedido.status === (pedido.origem === "salao" ? "finalizado" : "entregue");
}
