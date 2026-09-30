import type { OrderStatus } from "./types";

/** Só deixa cancelar enquanto o pedido ainda está "novo" — depois que a
 * cozinha começa a preparar (ou já saiu pra entrega, já ficou pronto etc.),
 * cancelar sozinho desperdiçaria ingrediente já usado; a partir daí só o
 * atendente/cozinha pode resolver isso manualmente. */
export function podeCancelarPedido(status: OrderStatus): boolean {
  return status === "novo";
}
