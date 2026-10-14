import { describe, expect, it } from "vitest";
import { type Horarios, resumoHorarios, statusFuncionamento, textoStatus } from "./horario";

const todoDia: Horarios = Array.from({ length: 7 }, () => ({ abre: "18:00", fecha: "22:00" }));
// Horário de Brasília (UTC-3). 14/10/2026 é uma quarta-feira.
const em = (iso: string) => new Date(`${iso}-03:00`);

describe("statusFuncionamento", () => {
  it("aberto dentro do horário", () => {
    expect(textoStatus(statusFuncionamento(todoDia, em("2026-10-14T19:30:00")))).toBe("Aberto agora · até 22h");
  });

  it("abre às 18h em ponto e fecha às 22h em ponto", () => {
    expect(statusFuncionamento(todoDia, em("2026-10-14T18:00:00")).aberto).toBe(true);
    expect(statusFuncionamento(todoDia, em("2026-10-14T22:00:00")).aberto).toBe(false);
  });

  it("antes de abrir mostra que abre hoje", () => {
    expect(textoStatus(statusFuncionamento(todoDia, em("2026-10-14T15:00:00")))).toBe("Fechado · abre hoje às 18h");
  });

  it("depois de fechar mostra que abre amanhã", () => {
    expect(textoStatus(statusFuncionamento(todoDia, em("2026-10-14T23:10:00")))).toBe("Fechado · abre amanhã às 18h");
  });

  it("pula dia de folga e mostra o nome do dia", () => {
    const semQuintaNemSexta: Horarios = todoDia.map((h, i) => (i === 4 || i === 5 ? null : h));
    expect(textoStatus(statusFuncionamento(semQuintaNemSexta, em("2026-10-14T23:00:00")))).toBe(
      "Fechado · abre sábado às 18h",
    );
  });

  it("usa o horário de Brasília mesmo com o servidor em UTC", () => {
    // 01:30 UTC de quinta = 22:30 de quarta em Brasília: fechado.
    expect(statusFuncionamento(todoDia, new Date("2026-10-15T01:30:00Z")).aberto).toBe(false);
    // 22:00 UTC de quarta = 19:00 de quarta em Brasília: aberto.
    expect(statusFuncionamento(todoDia, new Date("2026-10-14T22:00:00Z")).aberto).toBe(true);
  });

  it("sem nenhum dia aberto fica só 'Fechado'", () => {
    expect(textoStatus(statusFuncionamento(Array(7).fill(null), em("2026-10-14T19:00:00")))).toBe("Fechado");
  });
});

describe("resumoHorarios", () => {
  it("todos os dias iguais", () => {
    expect(resumoHorarios(todoDia)).toBe("Todos os dias, 18h às 22h");
  });

  it("junta dias seguidos e separa horários diferentes", () => {
    const h: Horarios = [...todoDia];
    h[1] = null; // segunda fechado
    h[6] = { abre: "18:00", fecha: "23:30" }; // sábado até mais tarde
    expect(resumoHorarios(h)).toBe("Ter a Sex, 18h às 22h · Sáb, 18h às 23h30 · Dom, 18h às 22h");
  });
});
