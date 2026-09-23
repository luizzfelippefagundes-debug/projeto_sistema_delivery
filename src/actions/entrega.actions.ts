"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "../db";
import { zonasEntrega } from "../db/schema";
import { assertFuncionario } from "../lib/funcionarioAuth";
import { registrarAtividade } from "../db/queries/atividades";
import { getConfiguracoes } from "../db/queries/configuracoes";
import { calcularDistanciaReal } from "../lib/googleMaps";

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

/** Endpoint público (chamado do checkout, sem login de funcionário) — só
 * devolve distância/tempo reais de carro até o endereço digitado, pra
 * mostrar uma estimativa de verdade em vez da manual. Nunca lança erro:
 * sem endereço da loja cadastrado ou sem chave do Google configurada,
 * devolve null e o checkout cai pro tempo estimado da zona. */
export async function calcularEntregaReal(restauranteId: string, enderecoDestino: string) {
  const config = await getConfiguracoes(restauranteId);
  if (!config?.enderecoLoja) return null;
  return calcularDistanciaReal(config.enderecoLoja, enderecoDestino);
}
