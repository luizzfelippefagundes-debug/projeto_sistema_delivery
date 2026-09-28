import { describe, expect, it } from "vitest";
import { calcularPorPessoa } from "./divisaoConta";

describe("calcularPorPessoa", () => {
  it("divide o total igualmente entre as pessoas", () => {
    expect(calcularPorPessoa(100, 4)).toBe(25);
  });

  it("com 1 pessoa, é o total inteiro", () => {
    expect(calcularPorPessoa(56, 1)).toBe(56);
  });

  it("nunca divide por zero ou negativo — trata como 1 pessoa", () => {
    expect(calcularPorPessoa(56, 0)).toBe(56);
    expect(calcularPorPessoa(56, -3)).toBe(56);
  });

  it("arredonda gente fracionada (não faz sentido meia pessoa)", () => {
    expect(calcularPorPessoa(100, 3.4)).toBe(calcularPorPessoa(100, 3));
  });
});
