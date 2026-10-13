import { describe, expect, it } from "vitest";
import { encontrarZona, enderecoParaMapa } from "./entrega";

describe("encontrarZona", () => {
  const zonas = [
    { bairro: "Centro", taxa: 5 },
    { bairro: "São José", taxa: 8 },
    { bairro: "Águia Branca", taxa: 10 },
  ];

  it("acha o bairro com o mesmo texto exato", () => {
    expect(encontrarZona(zonas, "Centro")?.bairro).toBe("Centro");
  });

  it("ignora acento e maiúscula/minúscula", () => {
    expect(encontrarZona(zonas, "sao jose")?.bairro).toBe("São José");
    expect(encontrarZona(zonas, "AGUIA BRANCA")?.bairro).toBe("Águia Branca");
  });

  it("ignora espaço nas pontas", () => {
    expect(encontrarZona(zonas, "  Centro  ")?.bairro).toBe("Centro");
  });

  it("retorna null pra bairro não cadastrado", () => {
    expect(encontrarZona(zonas, "Outro Bairro")).toBeNull();
  });

  it("retorna null pra string vazia", () => {
    expect(encontrarZona(zonas, "")).toBeNull();
    expect(encontrarZona(zonas, "   ")).toBeNull();
  });

  it("retorna null quando não há zonas cadastradas", () => {
    expect(encontrarZona([], "Centro")).toBeNull();
  });
});

describe("enderecoParaMapa", () => {
  it("tira a referência do final", () => {
    expect(enderecoParaMapa("Rua das Flores, 120 - Centro (Ref: casa azul perto da padaria)")).toBe(
      "Rua das Flores, 120 - Centro",
    );
  });

  it("tira o complemento entre o número e o bairro", () => {
    expect(enderecoParaMapa("Rua das Flores, 120 - Apto 32 bloco B - Centro (Ref: portão preto)")).toBe(
      "Rua das Flores, 120 - Centro",
    );
  });

  it("mantém endereço sem complemento nem referência", () => {
    expect(enderecoParaMapa("Av. Brasil, 45 - São José")).toBe("Av. Brasil, 45 - São José");
  });

  it("não mexe em endereço digitado livre (WhatsApp)", () => {
    expect(enderecoParaMapa("rua tal 50 bairro centro")).toBe("rua tal 50 bairro centro");
  });
});
