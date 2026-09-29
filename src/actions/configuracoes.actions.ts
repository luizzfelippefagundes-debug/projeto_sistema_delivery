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

export interface TaxasMaquininhaInput {
  taxaPix: number;
  taxaDebito: number;
  taxaCreditoVista: number;
  taxaCredito2x: number;
  taxaCredito3x: number;
  taxaCredito4x: number;
}

/** Percentuais da maquininha usados pra repassar a taxa pro cliente na hora
 * de fechar a mesa (ver `totalComTaxa`). Trava entre 0 e 100% pra evitar
 * valor absurdo digitado por engano. */
export async function atualizarTaxasMaquininha(taxas: TaxasMaquininhaInput) {
  const dono = await assertFuncionario("dono");
  const limpar = (v: number) => Math.max(0, Math.min(100, Number(v) || 0));
  const valores: TaxasMaquininhaInput = {
    taxaPix: limpar(taxas.taxaPix),
    taxaDebito: limpar(taxas.taxaDebito),
    taxaCreditoVista: limpar(taxas.taxaCreditoVista),
    taxaCredito2x: limpar(taxas.taxaCredito2x),
    taxaCredito3x: limpar(taxas.taxaCredito3x),
    taxaCredito4x: limpar(taxas.taxaCredito4x),
  };

  await getDb()
    .insert(configuracoes)
    .values({ restauranteId: dono.restauranteId, ...valores })
    .onConflictDoUpdate({
      target: configuracoes.restauranteId,
      set: valores,
    });

  await registrarAtividade({
    restauranteId: dono.restauranteId,
    funcionarioId: dono.id,
    nomeFuncionario: dono.nome,
    acao: "Atualizou taxas da maquininha",
  });
  revalidatePath("/dono/financeiro");
  revalidatePath("/atendente");
}
