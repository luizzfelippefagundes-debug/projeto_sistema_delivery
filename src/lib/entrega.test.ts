import { describe, expect, it } from "vitest";
import { encontrarZona } from "./entrega";

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
