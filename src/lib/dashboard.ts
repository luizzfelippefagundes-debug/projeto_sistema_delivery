import { TIMEZONE_BR, getHojeISO } from "./data";
import { contaComoFaturamento, pedidoConcluido } from "./faturamento";
import type { Origem, OrderStatus } from "./types";

interface PedidoResumo {
  origem: Origem;
  status: OrderStatus;
  total: number;
  criadoEm: Date;
}

/** Série dos últimos `dias` dias (do mais antigo ao de hoje): faturado,
 * quantidade de pedidos e ticket médio de cada dia — alimenta os
 * indicadores do dashboard e as variações contra ontem. */
export function serieDiaria(pedidos: PedidoResumo[], dias = 7, hoje: Date = new Date()) {
  const chaves: string[] = [];
  for (let i = dias - 1; i >= 0; i--) chaves.push(getHojeISO(new Date(hoje.getTime() - i * 86_400_000)));

  const porDia = new Map(chaves.map((c) => [c, { faturado: 0, pedidos: 0, concluidos: 0 }]));
  for (const p of pedidos) {
    const dia = porDia.get(getHojeISO(p.criadoEm));
    if (!dia) continue;
    dia.pedidos += 1;
    if (contaComoFaturamento(p)) {
      dia.faturado += p.total;
      dia.concluidos += 1;
    }
  }

  return chaves.map((c) => {
    const d = porDia.get(c)!;
    return { dia: c, faturado: d.faturado, pedidos: d.pedidos, ticket: d.concluidos ? d.faturado / d.concluidos : 0 };
  });
}

/** Variação percentual entre dois valores; null quando não há base de comparação. */
export function variacaoPct(atual: number, anterior: number): number | null {
  if (!anterior) return null;
  return ((atual - anterior) / anterior) * 100;
}

/** Faturamento (pedidos concluídos) somado por hora do dia, no fuso de Brasília. */
export function faturamentoPorHora(pedidos: PedidoResumo[]): number[] {
  const horas = Array.from({ length: 24 }, () => 0);
  const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: TIMEZONE_BR, hour: "2-digit", hour12: false });
  for (const p of pedidos) {
    if (!contaComoFaturamento(p)) continue;
    const h = parseInt(fmt.format(p.criadoEm), 10) % 24;
    horas[h] += p.total;
  }
  return horas;
}

/** Itens mais vendidos, somando a quantidade de cada nome (pedido cancelado não conta). */
export function maisVendidos(
  pedidos: { id: string; status: OrderStatus }[],
  itensPorPedido: Map<string, { nome: string; quantidade: number }[]>,
  limite = 4,
) {
  const soma = new Map<string, number>();
  for (const p of pedidos) {
    if (p.status === "cancelado") continue;
    for (const i of itensPorPedido.get(p.id) ?? []) soma.set(i.nome, (soma.get(i.nome) ?? 0) + i.quantidade);
  }
  return [...soma.entries()]
    .map(([nome, quantidade]) => ({ nome, quantidade }))
    .sort((a, b) => b.quantidade - a.quantidade)
    .slice(0, limite);
}

/** Resumo do que está em andamento, por etapa — ex: "2 novos · 3 em preparo". */
export function resumoAndamento(pedidos: PedidoResumo[]): string {
  const abertos = pedidos.filter((p) => !pedidoConcluido(p));
  const conta = (s: OrderStatus) => abertos.filter((p) => p.status === s).length;
  const partes: string[] = [];
  const novos = conta("novo");
  const preparo = conta("preparo");
  const pronto = conta("pronto");
  const rota = conta("rota");
  if (novos) partes.push(`${novos} ${novos === 1 ? "novo" : "novos"}`);
  if (preparo) partes.push(`${preparo} em preparo`);
  if (pronto) partes.push(`${pronto} ${pronto === 1 ? "pronto" : "prontos"}`);
  if (rota) partes.push(`${rota} em rota`);
  return partes.length ? partes.join(" · ") : "Nada em andamento";
}
