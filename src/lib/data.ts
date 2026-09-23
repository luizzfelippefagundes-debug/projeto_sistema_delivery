import type { OrderStatus, Origem } from "./types";

export function fmtBRL(n: number): string {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function fmtHora(ts: number): string {
  return new Date(ts).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function minAgo(ts: number): string {
  const m = Math.max(0, Math.round((Date.now() - ts) / 60000));
  return m < 1 ? "agora" : `${m} min`;
}

/** Dia e hora formatados (ex: "18/09 09:44") — usado onde faz mais sentido
 * mostrar quando o pedido chegou do que só "quantos minutos atrás", que
 * vira um número gigante e inútil pra pedidos esquecidos por dias. */
export function fmtDiaHora(ts: number): string {
  return new Date(ts).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export const STATUS_LABEL: Record<OrderStatus, string> = {
  novo: "Novo",
  preparo: "Em preparo",
  pronto: "Pronto",
  rota: "Em rota",
  entregue: "Entregue",
  finalizado: "Finalizado",
};

export function origemLabel(pedido: { origem: Origem; mesa?: number | null; clienteNome?: string | null }): string {
  if (pedido.origem === "salao") return `Mesa ${pedido.mesa}`;
  return pedido.clienteNome || "Delivery";
}

/** Minutos a partir dos quais um pedido ainda em "novo"/"preparo" é
 * considerado atrasado — usado tanto no resumo do dia quanto pra destacar
 * o cartão na cozinha. */
export const MIN_PARA_ATRASADO = 20;

export function estaAtrasado(criadoEm: number, status: OrderStatus): boolean {
  if (status !== "novo" && status !== "preparo") return false;
  return Date.now() - criadoEm > MIN_PARA_ATRASADO * 60_000;
}
