import { eq } from "drizzle-orm";
import { getDb } from "../index";
import { restaurantes } from "../schema";

/** Usado só pelo redirect da raiz ("/") pro cardápio da Dashi Sushi — o
 * link antigo continua funcionando mesmo depois do sistema virar
 * multi-tenant. Novos restaurantes usam o próprio slug em `/loja/<slug>`,
 * nunca dependem desta função. */
export async function getRestaurantePrincipal() {
  const rows = await getDb().select().from(restaurantes).limit(1);
  return rows[0] ?? null;
}

export async function getRestaurantePorSlug(slug: string) {
  const rows = await getDb().select().from(restaurantes).where(eq(restaurantes.slug, slug)).limit(1);
  return rows[0] ?? null;
}

export async function getRestaurantePorId(id: string) {
  const rows = await getDb().select().from(restaurantes).where(eq(restaurantes.id, id)).limit(1);
  return rows[0] ?? null;
}

