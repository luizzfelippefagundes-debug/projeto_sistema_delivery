"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "../db";
import { zonasEntrega } from "../db/schema";
import { assertFuncionario } from "../lib/funcionarioAuth";
import { registrarAtividade } from "../db/queries/atividades";

export async function criarZonaEntrega(dados: { bairro: string; taxaEntrega: number; tempoEstimadoMin: number }) {
  const dono = await assertFuncionario("dono");
  if (!dados.bairro.trim() || dados.taxaEntrega < 0 || dados.tempoEstimadoMin <= 0) {
    throw new Error("Preencha bairro, taxa e tempo estimado válidos.");
  }
  await getDb().insert(zonasEntrega).values({
    restauranteId: dono.restauranteId,
    bairro: dados.bairro.trim(),
    taxaEntrega: dados.taxaEntrega,
    tempoEstimadoMin: dados.tempoEstimadoMin,
  });
  await registrarAtividade({
    restauranteId: dono.restauranteId,
    funcionarioId: dono.id,
    nomeFuncionario: dono.nome,
    acao: "Criou zona de entrega",
    detalhe: dados.bairro.trim(),
  });
  revalidatePath("/dono/financeiro");
}

export async function atualizarZonaEntrega(
  id: string,
  dados: { bairro: string; taxaEntrega: number; tempoEstimadoMin: number },
) {
  const dono = await assertFuncionario("dono");
  if (!dados.bairro.trim() || dados.taxaEntrega < 0 || dados.tempoEstimadoMin <= 0) {
    throw new Error("Preencha bairro, taxa e tempo estimado válidos.");
  }
  await getDb()
    .update(zonasEntrega)
    .set({
      bairro: dados.bairro.trim(),
      taxaEntrega: dados.taxaEntrega,
      tempoEstimadoMin: dados.tempoEstimadoMin,
    })
    .where(eq(zonasEntrega.id, id));
  revalidatePath("/dono/financeiro");
}

export async function removerZonaEntrega(id: string) {
  await assertFuncionario("dono");
  await getDb().delete(zonasEntrega).where(eq(zonasEntrega.id, id));
  revalidatePath("/dono/financeiro");
}
