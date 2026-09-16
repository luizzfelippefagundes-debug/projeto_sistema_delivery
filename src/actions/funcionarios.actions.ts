"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "../db";
import { funcionarios, turnos } from "../db/schema";
import { assertFuncionario } from "../lib/funcionarioAuth";
import { registrarAtividade } from "../db/queries/atividades";
import type { PapelFuncionario } from "../lib/types";

const PAPEIS_CONVITE = ["atendente", "cozinha", "motoboy"] as const;
type PapelConvite = (typeof PAPEIS_CONVITE)[number];

const PAPEL_LABEL: Record<PapelFuncionario, string> = {
  dono: "Dona",
  atendente: "Atendente",
  cozinha: "Cozinha",
  motoboy: "Motoboy",
};

export async function convidarFuncionario(dados: { nome: string; emailConvite: string; papel: PapelConvite }) {
  const dono = await assertFuncionario("dono");
  const email = dados.emailConvite.trim().toLowerCase();
  if (!dados.nome.trim() || !email || !PAPEIS_CONVITE.includes(dados.papel)) {
    throw new Error("Preencha nome, e-mail e o papel.");
  }

  try {
    await getDb().insert(funcionarios).values({
      restauranteId: dono.restauranteId,
      nome: dados.nome.trim(),
      emailConvite: email,
      papel: dados.papel,
    });
  } catch (e) {
    if (e instanceof Error && e.message.includes("unique")) {
      throw new Error("Esse e-mail já tem um convite cadastrado.");
    }
    throw e;
  }

  await registrarAtividade({
    restauranteId: dono.restauranteId,
    funcionarioId: dono.id,
    nomeFuncionario: dono.nome,
    acao: "Convidou funcionário",
    detalhe: `${dados.nome.trim()} (${PAPEL_LABEL[dados.papel]}) — ${email}`,
  });
  revalidatePath("/dono/funcionarios");
}

export async function alternarAtivoFuncionario(id: string, ativo: boolean) {
  const dono = await assertFuncionario("dono");
  const [alvo] = await getDb().update(funcionarios).set({ ativo }).where(eq(funcionarios.id, id)).returning();
  if (alvo) {
    await registrarAtividade({
      restauranteId: dono.restauranteId,
      funcionarioId: dono.id,
      nomeFuncionario: dono.nome,
      acao: ativo ? "Ativou funcionário" : "Desativou funcionário",
      detalhe: alvo.nome,
    });
  }
  revalidatePath("/dono/funcionarios");
}

/** Só cancela convites ainda não aceitos (sem clerkUserId) — uma vez que a
 * pessoa já entrou e a conta está ligada, "remover" deveria ser desativar
 * (alternarAtivoFuncionario), não apagar, pra manter o histórico de
 * pedidos vinculado a ela. */
export async function cancelarConvite(id: string) {
  const dono = await assertFuncionario("dono");
  const [removido] = await getDb()
    .delete(funcionarios)
    .where(and(eq(funcionarios.id, id), eq(funcionarios.restauranteId, dono.restauranteId), isNull(funcionarios.clerkUserId)))
    .returning();
  if (removido) {
    await registrarAtividade({
      restauranteId: dono.restauranteId,
      funcionarioId: dono.id,
      nomeFuncionario: dono.nome,
      acao: "Cancelou convite",
      detalhe: `${removido.nome} — ${removido.emailConvite}`,
    });
  }
  revalidatePath("/dono/funcionarios");
}

const HORA_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export async function criarTurno(dados: {
  funcionarioId: string;
  diaSemana: number;
  horaInicio: string;
  horaFim: string;
}) {
  const dono = await assertFuncionario("dono");
  if (dados.diaSemana < 0 || dados.diaSemana > 6) throw new Error("Dia da semana inválido.");
  if (!HORA_REGEX.test(dados.horaInicio) || !HORA_REGEX.test(dados.horaFim)) {
    throw new Error("Informe os horários no formato HH:MM.");
  }
  if (dados.horaFim <= dados.horaInicio) throw new Error("O fim do turno precisa ser depois do início.");

  await getDb().insert(turnos).values({
    restauranteId: dono.restauranteId,
    funcionarioId: dados.funcionarioId,
    diaSemana: dados.diaSemana,
    horaInicio: dados.horaInicio,
    horaFim: dados.horaFim,
  });
  revalidatePath("/dono/funcionarios");
}

export async function removerTurno(id: string) {
  const dono = await assertFuncionario("dono");
  await getDb().delete(turnos).where(and(eq(turnos.id, id), eq(turnos.restauranteId, dono.restauranteId)));
  revalidatePath("/dono/funcionarios");
}

const PAPEIS_EXTRAS_PERMITIDOS = ["atendente", "cozinha", "motoboy"] as const;

export async function atualizarAcessosExtras(id: string, acessosExtras: PapelFuncionario[]) {
  const dono = await assertFuncionario("dono");
  const validos = acessosExtras.filter((p): p is (typeof PAPEIS_EXTRAS_PERMITIDOS)[number] =>
    (PAPEIS_EXTRAS_PERMITIDOS as readonly string[]).includes(p),
  );
  const [alvo] = await getDb()
    .update(funcionarios)
    .set({ acessosExtras: validos })
    .where(and(eq(funcionarios.id, id), eq(funcionarios.restauranteId, dono.restauranteId)))
    .returning();
  if (alvo) {
    await registrarAtividade({
      restauranteId: dono.restauranteId,
      funcionarioId: dono.id,
      nomeFuncionario: dono.nome,
      acao: "Ajustou permissões extras",
      detalhe: `${alvo.nome} — ${validos.length ? validos.map((p) => PAPEL_LABEL[p]).join(", ") : "nenhuma"}`,
    });
  }
  revalidatePath("/dono/funcionarios");
}
