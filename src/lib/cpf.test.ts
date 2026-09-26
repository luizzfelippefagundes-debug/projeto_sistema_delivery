import { describe, expect, it } from "vitest";
import { formatarCPF, validarCPF } from "./cpf";

describe("formatarCPF", () => {
  it("vai formatando conforme os dígitos chegam", () => {
    expect(formatarCPF("1")).toBe("1");
    expect(formatarCPF("111")).toBe("111");
    expect(formatarCPF("1114")).toBe("111.4");
    expect(formatarCPF("111444777")).toBe("111.444.777");
    expect(formatarCPF("11144477735")).toBe("111.444.777-35");
  });

  it("ignora letras e outros caracteres não numéricos", () => {
    expect(formatarCPF("111.444.777-35")).toBe("111.444.777-35");
    expect(formatarCPF("abc111444777xyz35")).toBe("111.444.777-35");
  });

  it("corta em 11 dígitos", () => {
    expect(formatarCPF("111444777351234")).toBe("111.444.777-35");
  });
});

describe("validarCPF", () => {
  it("aceita um CPF válido (dígitos verificadores corretos)", () => {
    expect(validarCPF("111.444.777-35")).toBe(true);
    expect(validarCPF("11144477735")).toBe(true);
  });

  it("rejeita dígito verificador errado", () => {
    expect(validarCPF("111.444.777-36")).toBe(false);
  });

  it("rejeita sequências repetidas óbvias", () => {
    expect(validarCPF("000.000.000-00")).toBe(false);
    expect(validarCPF("111.111.111-11")).toBe(false);
  });

  it("rejeita tamanho errado", () => {
    expect(validarCPF("123")).toBe(false);
    expect(validarCPF("")).toBe(false);
  });
});
