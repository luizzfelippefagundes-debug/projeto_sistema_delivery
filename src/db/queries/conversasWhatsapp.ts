import { and, eq } from "drizzle-orm";
import { getDb } from "../index";
import { conversasWhatsapp } from "../schema";
import type { ItemCarrinhoWhatsapp } from "../../lib/types";

export async function getOuCriarConversa(restauranteId: string, telefone: string) {
  const db = getDb();
  const existente = await db
    .select()
    .from(conversasWhatsapp)
    .where(and(eq(conversasWhatsapp.restauranteId, restauranteId), eq(conversasWhatsapp.telefone, telefone)))
    .limit(1);
  if (existente[0]) return existente[0];

  const [nova] = await db
    .insert(conversasWhatsapp)
    .values({ restauranteId, telefone })
    .onConflictDoUpdate({
      target: [conversasWhatsapp.restauranteId, conversasWhatsapp.telefone],
      set: { atualizadoEm: new Date() },
    })
    .returning();
  return nova;
}

export async function atualizarConversa(
  id: string,
  dados: Partial<{
    etapa: "inicio" | "escolhendo_categoria" | "escolhendo_item" | "escolhendo_quantidade" | "sacola" | "aguardando_endereco" | "aguardando_pagamento";
    categoriaAtual: string | null;
    itemCardapioIdAtual: string | null;
    carrinho: ItemCarrinhoWhatsapp[];
    enderecoTemp: string | null;
  }>,
) {
  const { carrinho, ...resto } = dados;
  await getDb()
    .update(conversasWhatsapp)
    .set({
      ...resto,
      ...(carrinho ? { carrinho: JSON.stringify(carrinho) } : {}),
      atualizadoEm: new Date(),
    })
    .where(eq(conversasWhatsapp.id, id));
}

export async function resetarConversa(id: string) {
  await getDb()
    .update(conversasWhatsapp)
    .set({
      etapa: "inicio",
      categoriaAtual: null,
      itemCardapioIdAtual: null,
      carrinho: "[]",
      enderecoTemp: null,
      atualizadoEm: new Date(),
    })
    .where(eq(conversasWhatsapp.id, id));
}

export function parseCarrinho(carrinhoJson: string): ItemCarrinhoWhatsapp[] {
  try {
    const parsed = JSON.parse(carrinhoJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
