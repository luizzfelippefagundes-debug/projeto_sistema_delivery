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

/** Quantidade de mesas do salão — define o grid da Comanda (`/atendente`,
 * `/cozinha`) e quantos QR codes a tela de Mesas gera. Travado entre 1 e 50
 * pra evitar valor absurdo digitado por engano. */
export async function atualizarNumeroMesas(numero: number) {
  const dono = await assertFuncionario("dono");
  const valor = Math.max(1, Math.min(50, Math.round(numero) || 1));

  await getDb()
    .insert(configuracoes)
    .values({ restauranteId: dono.restauranteId, numeroMesas: valor })
    .onConflictDoUpdate({
      target: configuracoes.restauranteId,
      set: { numeroMesas: valor },
    });

  await registrarAtividade({
    restauranteId: dono.restauranteId,
    funcionarioId: dono.id,
    nomeFuncionario: dono.nome,
    acao: "Atualizou número de mesas",
    detalhe: String(valor),
  });
  revalidatePath("/dono/mesas");
  revalidatePath("/atendente");
  revalidatePath("/cozinha");
}
