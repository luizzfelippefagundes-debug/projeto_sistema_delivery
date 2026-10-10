"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "../db";
import { itensCardapio, opcoesCombo } from "../db/schema";
import { assertFuncionario } from "../lib/funcionarioAuth";

export async function setSaborDisponivel(nome: string, disponivel: boolean) {
  const funcionario = await assertFuncionario("dono");

  // Buscar todos os itens do restaurante que têm combo
  const itens = await getDb()
    .select({ id: itensCardapio.id })
    .from(itensCardapio)
    .where(eq(itensCardapio.restauranteId, funcionario.restauranteId));

  const itemIds = itens.map((i) => i.id);
  if (itemIds.length === 0) return;

  await getDb()
    .update(opcoesCombo)
    .set({ disponivel })
    .where(and(inArray(opcoesCombo.itemCardapioId, itemIds), eq(opcoesCombo.nome, nome)));

  revalidatePath("/dono/sabores");
  revalidatePath(`/loja`);
}
