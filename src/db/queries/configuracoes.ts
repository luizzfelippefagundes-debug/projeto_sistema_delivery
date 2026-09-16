import { eq } from "drizzle-orm";
import { getDb } from "../index";
import { configuracoes } from "../schema";

export async function getConfiguracoes(restauranteId: string) {
  const rows = await getDb().select().from(configuracoes).where(eq(configuracoes.restauranteId, restauranteId)).limit(1);
  return rows[0] ?? null;
}
