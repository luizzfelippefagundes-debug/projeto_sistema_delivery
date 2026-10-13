import type { OrderStatus } from "./types";

export interface ItemProducao {
  nome: string;
  quantidade: number;
  /** Observações iguais somadas, ex: { texto: "sem cebolinha", quantidade: 2 }. */
  observacoes: { texto: string; quantidade: number }[];
}

/** Soma os itens de todos os pedidos que ainda precisam ser feitos, pra
 * preparar em lote em vez de pedido por pedido. Mais pedido primeiro. */
export function montarListaProducao(
  pedidos: { status: OrderStatus; itens: { nome: string; quantidade: number; observacao: string | null }[] }[],
): ItemProducao[] {
  const porNome = new Map<string, { quantidade: number; observacoes: Map<string, number> }>();
  for (const pedido of pedidos) {
    if (pedido.status !== "novo" && pedido.status !== "preparo") continue;
    for (const item of pedido.itens) {
      const atual = porNome.get(item.nome) ?? { quantidade: 0, observacoes: new Map<string, number>() };
      atual.quantidade += item.quantidade;
      const obs = item.observacao?.trim();
      if (obs) atual.observacoes.set(obs, (atual.observacoes.get(obs) ?? 0) + item.quantidade);
      porNome.set(item.nome, atual);
    }
  }
  return [...porNome.entries()]
    .map(([nome, { quantidade, observacoes }]) => ({
      nome,
      quantidade,
      observacoes: [...observacoes.entries()].map(([texto, q]) => ({ texto, quantidade: q })),
    }))
    .sort((a, b) => b.quantidade - a.quantidade || a.nome.localeCompare(b.nome, "pt-BR"));
}
