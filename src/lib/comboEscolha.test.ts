import { describe, expect, it } from "vitest";
import { aplicarEscolha, podeAumentar, totalEscolhido } from "./comboEscolha";

const OPCOES = [
  { nome: "Hot Filadélfia", limiteQuantidade: null },
  { nome: "Uramaki Califórnia", limiteQuantidade: 3 },
];

describe("totalEscolhido", () => {
  it("soma todas as peças escolhidas", () => {
    expect(totalEscolhido({ A: 2, B: 3 })).toBe(5);
  });

  it("é zero pra escolha vazia", () => {
    expect(totalEscolhido({})).toBe(0);
  });
});

describe("podeAumentar", () => {
  it("permite aumentar enquanto não bateu o total do combo", () => {
    expect(podeAumentar({}, OPCOES, 15, "Hot Filadélfia")).toBe(true);
  });

  it("bloqueia quando o total do combo já foi atingido", () => {
    expect(podeAumentar({ "Hot Filadélfia": 15 }, OPCOES, 15, "Hot Filadélfia")).toBe(false);
  });

  it("bloqueia numa peça que já bateu o próprio limite, mesmo sobrando espaço no combo", () => {
    // combo de 15 peças, já tem 3 Uramaki Califórnia (limite é 3) — não pode mais desse, mas sobra espaço no combo
    expect(podeAumentar({ "Uramaki Califórnia": 3 }, OPCOES, 15, "Uramaki Califórnia")).toBe(false);
  });

  it("permite aumentar uma peça sem limite próprio mesmo com outras já escolhidas", () => {
    expect(podeAumentar({ "Uramaki Califórnia": 3 }, OPCOES, 15, "Hot Filadélfia")).toBe(true);
  });
});

describe("aplicarEscolha", () => {
  it("incrementa normalmente quando permitido", () => {
    const resultado = aplicarEscolha({}, OPCOES, 15, "Hot Filadélfia", 1);
    expect(resultado).toEqual({ "Hot Filadélfia": 1 });
  });

  it("ignora o incremento quando bloqueado pelo limite da peça", () => {
    const escolhas = { "Uramaki Califórnia": 3 };
    const resultado = aplicarEscolha(escolhas, OPCOES, 15, "Uramaki Califórnia", 1);
    expect(resultado).toBe(escolhas); // mesma referência: nada mudou
  });

  it("ignora o incremento quando bloqueado pelo total do combo", () => {
    const escolhas = { "Hot Filadélfia": 15 };
    const resultado = aplicarEscolha(escolhas, OPCOES, 15, "Hot Filadélfia", 1);
    expect(resultado).toBe(escolhas);
  });

  it("decrementa mesmo que estivesse no limite", () => {
    const resultado = aplicarEscolha({ "Uramaki Califórnia": 3 }, OPCOES, 15, "Uramaki Califórnia", -1);
    expect(resultado).toEqual({ "Uramaki Califórnia": 2 });
  });

  it("nunca deixa a quantidade negativa", () => {
    const resultado = aplicarEscolha({}, OPCOES, 15, "Hot Filadélfia", -1);
    expect(resultado).toEqual({ "Hot Filadélfia": 0 });
  });

  it("não muta o objeto de escolhas recebido", () => {
    const escolhas = { "Hot Filadélfia": 1 };
    const copiaOriginal = { ...escolhas };
    aplicarEscolha(escolhas, OPCOES, 15, "Hot Filadélfia", 1);
    expect(escolhas).toEqual(copiaOriginal);
  });
});
