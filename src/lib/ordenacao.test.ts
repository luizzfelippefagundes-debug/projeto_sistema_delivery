import { describe, expect, it } from "vitest";
import { ordenarPorNome } from "./ordenacao";

describe("ordenarPorNome", () => {
  it("ordena números como número, não como texto (o bug do Combo 5/40)", () => {
    const itens = [
      { categoria: "Combos", nome: "Combo 40 peças" },
      { categoria: "Combos", nome: "Combo 5 peças" },
      { categoria: "Combos", nome: "Combo 20 peças" },
    ];
    expect(ordenarPorNome(itens).map((i) => i.nome)).toEqual([
      "Combo 5 peças",
      "Combo 20 peças",
      "Combo 40 peças",
    ]);
  });

  it("agrupa por categoria antes de olhar o nome", () => {
    const itens = [
      { categoria: "Peças Hot", nome: "Hot A" },
      { categoria: "Bebidas", nome: "Água" },
      { categoria: "Bebidas", nome: "Coca-Cola" },
    ];
    expect(ordenarPorNome(itens).map((i) => i.categoria)).toEqual(["Bebidas", "Bebidas", "Peças Hot"]);
  });

  it("não muta o array original", () => {
    const itens = [
      { categoria: "Combos", nome: "Combo 40 peças" },
      { categoria: "Combos", nome: "Combo 5 peças" },
    ];
    const original = [...itens];
    ordenarPorNome(itens);
    expect(itens).toEqual(original);
  });
});
