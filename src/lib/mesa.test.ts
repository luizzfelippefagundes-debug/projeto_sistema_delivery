import { describe, expect, it } from "vitest";
import { mesaValida } from "./mesa";

describe("mesaValida", () => {
  it("aceita mesas dentro do intervalo 1..numeroMesas", () => {
    expect(mesaValida(1, 10)).toBe(true);
    expect(mesaValida(5, 10)).toBe(true);
    expect(mesaValida(10, 10)).toBe(true);
  });

  it("rejeita mesa 0 ou negativa", () => {
    expect(mesaValida(0, 10)).toBe(false);
    expect(mesaValida(-1, 10)).toBe(false);
  });

  it("rejeita mesa maior que o número de mesas cadastrado", () => {
    expect(mesaValida(11, 10)).toBe(false);
  });

  it("rejeita número não inteiro (ex: veio de um /mesa/abc virando NaN, ou /mesa/2.5)", () => {
    expect(mesaValida(2.5, 10)).toBe(false);
    expect(mesaValida(Number.NaN, 10)).toBe(false);
  });
});
