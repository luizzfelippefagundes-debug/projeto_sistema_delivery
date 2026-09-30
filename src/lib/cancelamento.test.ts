import { describe, expect, it } from "vitest";
import { podeCancelarPedido } from "./cancelamento";

describe("podeCancelarPedido", () => {
  it("permite cancelar enquanto está novo", () => {
    expect(podeCancelarPedido("novo")).toBe(true);
  });

  it("não permite depois que entrou em preparo ou além", () => {
    expect(podeCancelarPedido("preparo")).toBe(false);
    expect(podeCancelarPedido("pronto")).toBe(false);
    expect(podeCancelarPedido("rota")).toBe(false);
    expect(podeCancelarPedido("entregue")).toBe(false);
    expect(podeCancelarPedido("finalizado")).toBe(false);
    expect(podeCancelarPedido("cancelado")).toBe(false);
  });
});
