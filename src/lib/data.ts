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
  cancelado: "Cancelado",
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

export const TIMEZONE_BR = "America/Sao_Paulo";

/** Retorna a data no formato YYYY-MM-DD considerando o fuso horário de Brasília */
export function getHojeISO(d: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE_BR,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(d);
}

/** Retorna a data às 00:00:00.000 considerando o fuso horário de Brasília */
export function inicioDoDia(d: Date = new Date()): Date {
  const isoDate = getHojeISO(d);
  return new Date(`${isoDate}T00:00:00.000-03:00`);
}

/** Retorna a data às 23:59:59.999 considerando o fuso horário de Brasília */
export function fimDoDia(d: Date = new Date()): Date {
  const isoDate = getHojeISO(d);
  return new Date(`${isoDate}T23:59:59.999-03:00`);
}

