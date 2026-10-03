import { describe, expect, it } from "vitest";
import { contaComoFaturamento, pedidoConcluido } from "./faturamento";

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

describe("pedidoConcluido", () => {
  it("mesa só conclui ao finalizar (fechar a mesa)", () => {
    expect(pedidoConcluido({ origem: "salao", status: "novo" })).toBe(false);
    expect(pedidoConcluido({ origem: "salao", status: "pronto" })).toBe(false);
    expect(pedidoConcluido({ origem: "salao", status: "finalizado" })).toBe(true);
  });

  it("delivery só conclui ao entregar — continua em andamento até lá", () => {
    expect(pedidoConcluido({ origem: "delivery", status: "novo" })).toBe(false);
    expect(pedidoConcluido({ origem: "delivery", status: "preparo" })).toBe(false);
    expect(pedidoConcluido({ origem: "delivery", status: "rota" })).toBe(false);
    expect(pedidoConcluido({ origem: "delivery", status: "entregue" })).toBe(true);
  });

  it("nunca fica preso em andamento por causa de 'finalizado' não existir pra delivery", () => {
    expect(pedidoConcluido({ origem: "delivery", status: "finalizado" })).toBe(false);
  });

  it("cancelado conta como concluído (parou de estar em andamento)", () => {
    expect(pedidoConcluido({ origem: "delivery", status: "cancelado" })).toBe(true);
    expect(pedidoConcluido({ origem: "salao", status: "cancelado" })).toBe(true);
  });
});
