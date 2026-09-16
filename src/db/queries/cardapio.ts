import { and, asc, eq } from "drizzle-orm";
import { getDb } from "../index";
import { itensCardapio } from "../schema";

export async function getItensCardapio(restauranteId: string) {
  return getDb()
    .select()
    .from(itensCardapio)
    .where(eq(itensCardapio.restauranteId, restauranteId))
    .orderBy(asc(itensCardapio.categoria), asc(itensCardapio.nome));
}

export async function getItensCardapioAtivos(restauranteId: string) {
  return getDb()
    .select()
    .from(itensCardapio)
    .where(and(eq(itensCardapio.restauranteId, restauranteId), eq(itensCardapio.ativo, true)))
    .orderBy(asc(itensCardapio.categoria), asc(itensCardapio.nome));
}

export async function getCategorias(restauranteId: string) {
  const itens = await getItensCardapio(restauranteId);
  return [...new Set(itens.map((i) => i.categoria))];
}
