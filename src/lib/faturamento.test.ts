import { describe, expect, it } from "vitest";
import { contaComoFaturamento } from "./faturamento";

describe("contaComoFaturamento", () => {
  it("não conta pedido de mesa ainda aberto (novo/preparo/pronto)", () => {
    expect(contaComoFaturamento({ origem: "salao", status: "novo" })).toBe(false);
    expect(contaComoFaturamento({ origem: "salao", status: "preparo" })).toBe(false);
    expect(contaComoFaturamento({ origem: "salao", status: "pronto" })).toBe(false);
  });

  it("conta pedido de mesa só depois que ela fecha", () => {
    expect(contaComoFaturamento({ origem: "salao", status: "finalizado" })).toBe(true);
  });

  it("sempre conta delivery, em qualquer status (mantém o comportamento atual)", () => {
    expect(contaComoFaturamento({ origem: "delivery", status: "novo" })).toBe(true);
    expect(contaComoFaturamento({ origem: "delivery", status: "pronto" })).toBe(true);
    expect(contaComoFaturamento({ origem: "delivery", status: "rota" })).toBe(true);
    expect(contaComoFaturamento({ origem: "delivery", status: "entregue" })).toBe(true);
  });

  it("nunca conta pedido cancelado, nem delivery nem mesa", () => {
    expect(contaComoFaturamento({ origem: "delivery", status: "cancelado" })).toBe(false);
    expect(contaComoFaturamento({ origem: "salao", status: "cancelado" })).toBe(false);
  });
});
