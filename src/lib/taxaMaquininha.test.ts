import { describe, expect, it } from "vitest";
import { pagamentoDaForma, percentualDaForma, totalComTaxa, type TaxasMaquininha } from "./taxaMaquininha";

const taxas: TaxasMaquininha = {
  taxaPix: 0,
  taxaDebito: 1.39,
  taxaCreditoVista: 3.34,
  taxaCredito2x: 7.29,
  taxaCredito3x: 8.35,
  taxaCredito4x: 9.23,
};

describe("percentualDaForma", () => {
  it("dinheiro nunca tem taxa", () => {
    expect(percentualDaForma("dinheiro", taxas)).toBe(0);
  });

  it("retorna o percentual configurado de cada forma", () => {
    expect(percentualDaForma("debito", taxas)).toBe(1.39);
    expect(percentualDaForma("credito_vista", taxas)).toBe(3.34);
    expect(percentualDaForma("credito_2x", taxas)).toBe(7.29);
    expect(percentualDaForma("credito_3x", taxas)).toBe(8.35);
    expect(percentualDaForma("credito_4x", taxas)).toBe(9.23);
  });

  it("pix usa o percentual configurado pra ele (pode ser 0)", () => {
    expect(percentualDaForma("pix", taxas)).toBe(0);
    expect(percentualDaForma("pix", { ...taxas, taxaPix: 0.49 })).toBe(0.49);
  });
});

describe("totalComTaxa", () => {
  it("dinheiro e pix sem taxa saem no valor cheio", () => {
    expect(totalComTaxa(100, "dinheiro", taxas)).toBe(100);
    expect(totalComTaxa(100, "pix", taxas)).toBe(100);
  });

  it("soma o percentual da forma escolhida ao total", () => {
    expect(totalComTaxa(100, "debito", taxas)).toBeCloseTo(101.39, 5);
    expect(totalComTaxa(100, "credito_vista", taxas)).toBeCloseTo(103.34, 5);
    expect(totalComTaxa(100, "credito_4x", taxas)).toBeCloseTo(109.23, 5);
  });

  it("escala proporcionalmente com o total", () => {
    expect(totalComTaxa(200, "credito_vista", taxas)).toBeCloseTo(206.68, 5);
  });
});

describe("pagamentoDaForma", () => {
  it("mapeia dinheiro e pix direto", () => {
    expect(pagamentoDaForma("dinheiro")).toBe("dinheiro");
    expect(pagamentoDaForma("pix")).toBe("pix");
  });

  it("qualquer variante de débito/crédito vira 'cartao'", () => {
    expect(pagamentoDaForma("debito")).toBe("cartao");
    expect(pagamentoDaForma("credito_vista")).toBe("cartao");
    expect(pagamentoDaForma("credito_2x")).toBe("cartao");
    expect(pagamentoDaForma("credito_3x")).toBe("cartao");
    expect(pagamentoDaForma("credito_4x")).toBe("cartao");
  });
});
