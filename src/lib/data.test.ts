import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { estaAtrasado, fmtBRL, minAgo, origemLabel } from "./data";

describe("fmtBRL", () => {
  it("formata em real com vírgula e duas casas", () => {
    expect(fmtBRL(60)).toBe("R$ 60,00");
    expect(fmtBRL(4.5)).toBe("R$ 4,50");
    expect(fmtBRL(0)).toBe("R$ 0,00");
  });
});

describe("origemLabel", () => {
  it("mostra o número da mesa pra pedido de salão", () => {
    expect(origemLabel({ origem: "salao", mesa: 3 })).toBe("Mesa 3");
  });

  it("mostra o nome do cliente pra pedido de delivery", () => {
    expect(origemLabel({ origem: "delivery", clienteNome: "Maria" })).toBe("Maria");
  });

  it("cai pra 'Delivery' quando não tem nome", () => {
    expect(origemLabel({ origem: "delivery", clienteNome: null })).toBe("Delivery");
  });
});

describe("minAgo e estaAtrasado", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("minAgo mostra 'agora' pra menos de 1 minuto", () => {
    expect(minAgo(Date.now())).toBe("agora");
  });

  it("minAgo mostra minutos redondos", () => {
    expect(minAgo(Date.now() - 5 * 60_000)).toBe("5 min");
  });

  it("não considera atrasado antes dos 20 minutos", () => {
    const criadoEm = Date.now() - 19 * 60_000;
    expect(estaAtrasado(criadoEm, "novo")).toBe(false);
  });

  it("considera atrasado depois dos 20 minutos, só em novo/preparo", () => {
    const criadoEm = Date.now() - 21 * 60_000;
    expect(estaAtrasado(criadoEm, "novo")).toBe(true);
    expect(estaAtrasado(criadoEm, "preparo")).toBe(true);
  });

  it("nunca considera atrasado pedido já pronto/entregue/finalizado", () => {
    const criadoEm = Date.now() - 60 * 60_000;
    expect(estaAtrasado(criadoEm, "pronto")).toBe(false);
    expect(estaAtrasado(criadoEm, "entregue")).toBe(false);
    expect(estaAtrasado(criadoEm, "finalizado")).toBe(false);
  });
});
