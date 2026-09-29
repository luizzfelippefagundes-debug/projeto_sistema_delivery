import { describe, expect, it } from "vitest";
import { podeFecharConta } from "./fechamentoMesa";

describe("podeFecharConta", () => {
  it("nada pedido ainda — não libera", () => {
    expect(podeFecharConta([])).toBe(false);
  });

  it("tudo pronto — libera", () => {
    expect(podeFecharConta([{ status: "pronto" }, { status: "pronto" }])).toBe(true);
  });

  it("algum pedido ainda em preparo — não libera", () => {
    expect(podeFecharConta([{ status: "pronto" }, { status: "preparo" }])).toBe(false);
  });

  it("algum pedido ainda novo — não libera", () => {
    expect(podeFecharConta([{ status: "novo" }])).toBe(false);
  });
});
