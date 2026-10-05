import type { Origem, OrderStatus } from "./types";

/** Pedido só vira faturamento quando é efetivamente concluído:
 * mesa fecha em "finalizado", delivery conta quando "entregue".
 * Cancelado nunca conta — não virou venda de verdade. */
export function contaComoFaturamento(pedido: { origem: Origem; status: OrderStatus }): boolean {
  if (pedido.status === "cancelado") return false;
  if (pedido.origem === "salao") return pedido.status === "finalizado";
  return pedido.status === "entregue";
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
