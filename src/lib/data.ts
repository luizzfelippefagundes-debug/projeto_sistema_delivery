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
