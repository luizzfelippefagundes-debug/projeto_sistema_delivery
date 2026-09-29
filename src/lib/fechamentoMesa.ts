import type { OrderStatus } from "./types";

/** Só libera o cliente pedir pra fechar a conta quando todo pedido em
 * aberto da mesa já estiver "pronto" — sem isso ela pede fechamento com
 * item ainda em preparo, e o atendente descobre isso só na hora de cobrar. */
export function podeFecharConta(pedidosAbertos: { status: OrderStatus }[]): boolean {
  return pedidosAbertos.length > 0 && pedidosAbertos.every((p) => p.status === "pronto");
}
