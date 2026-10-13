import { describe, expect, it } from "vitest";
import { montarListaProducao } from "./listaProducao";

const item = (nome: string, quantidade: number, observacao: string | null = null) => ({ nome, quantidade, observacao });

describe("montarListaProducao", () => {
  it("soma o mesmo item de pedidos diferentes, mais pedido primeiro", () => {
    const lista = montarListaProducao([
      { status: "novo", itens: [item("Hot Roll", 2), item("Temaki Salmão", 1)] },
      { status: "preparo", itens: [item("Hot Roll", 3)] },
    ]);
    expect(lista.map((i) => [i.nome, i.quantidade])).toEqual([
      ["Hot Roll", 5],
      ["Temaki Salmão", 1],
    ]);
  });

  it("ignora pedido já pronto, em rota ou cancelado", () => {
    const lista = montarListaProducao([
      { status: "pronto", itens: [item("Hot Roll", 2)] },
      { status: "rota", itens: [item("Hot Roll", 2)] },
      { status: "cancelado", itens: [item("Hot Roll", 2)] },
    ]);
    expect(lista).toEqual([]);
  });

  it("agrupa observações iguais com a quantidade", () => {
    const [hot] = montarListaProducao([
      { status: "novo", itens: [item("Hot Roll", 1, "sem cebolinha"), item("Hot Roll", 2)] },
      { status: "novo", itens: [item("Hot Roll", 1, "sem cebolinha ")] },
    ]);
    expect(hot.quantidade).toBe(4);
    expect(hot.observacoes).toEqual([{ texto: "sem cebolinha", quantidade: 2 }]);
  });
});
