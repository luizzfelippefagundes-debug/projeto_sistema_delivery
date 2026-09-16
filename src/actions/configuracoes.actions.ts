"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "../db";
import { configuracoes } from "../db/schema";
import { assertFuncionario } from "../lib/funcionarioAuth";
import { registrarAtividade } from "../db/queries/atividades";

/** Endereço de onde as entregas saem — usado como origem pra traçar a rota
 * real no mapa do motoboy. Sem `onConflictDoUpdate` teria que verificar se
 * já existe linha de configuração (restaurantes criados antes dessa
 * tabela existir podem não ter uma ainda). */
export async function atualizarEnderecoLoja(endereco: string) {
  const dono = await assertFuncionario("dono");
  const enderecoLimpo = endereco.trim() || null;

  await getDb()
    .insert(configuracoes)
    .values({ restauranteId: dono.restauranteId, enderecoLoja: enderecoLimpo })
    .onConflictDoUpdate({
      target: configuracoes.restauranteId,
      set: { enderecoLoja: enderecoLimpo },
    });

  await registrarAtividade({
    restauranteId: dono.restauranteId,
    funcionarioId: dono.id,
    nomeFuncionario: dono.nome,
    acao: "Atualizou endereço da loja",
    detalhe: enderecoLimpo ?? undefined,
  });
  revalidatePath("/dono/financeiro");
  revalidatePath("/motoboy");
}
