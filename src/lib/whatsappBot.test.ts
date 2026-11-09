import { describe, expect, it } from "vitest";
import { resolverEnderecoLocalPedido } from "./whatsappBot";

describe("resolverEnderecoLocalPedido", () => {
  it("reconhece pedidos para comer no local", () => {
    expect(resolverEnderecoLocalPedido("quero 2 para comer aí")).toBe("Retirada no balcão");
    expect(resolverEnderecoLocalPedido("vou comer aqui")).toBe("Retirada no balcão");
    expect(resolverEnderecoLocalPedido("quero pegar na loja")).toBe("Retirada no balcão");
    expect(resolverEnderecoLocalPedido("retirar no balcão")).toBe("Retirada no balcão");
    expect(resolverEnderecoLocalPedido("vou buscar na loja")).toBe("Retirada no balcão");
    expect(resolverEnderecoLocalPedido("quero retirar aí")).toBe("Retirada no balcão");
    expect(resolverEnderecoLocalPedido("to com fome, quero no local")).toBe("Retirada no balcão");
    expect(resolverEnderecoLocalPedido("quero buscar no balcão")).toBe("Retirada no balcão");
  });

  it("ignora mensagens de entrega", () => {
    expect(resolverEnderecoLocalPedido("entrega no endereço da rua tal")).toBeNull();
    expect(resolverEnderecoLocalPedido("quero delivery")).toBeNull();
  });
});
