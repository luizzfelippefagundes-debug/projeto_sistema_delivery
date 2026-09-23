import { asc, eq } from "drizzle-orm";
import { getDb } from "../index";
import { zonasEntrega } from "../schema";

export async function getZonasEntrega(restauranteId: string) {
  return getDb()
    .select()
    .from(zonasEntrega)
    .where(eq(zonasEntrega.restauranteId, restauranteId))
    .orderBy(asc(zonasEntrega.ordem));
}
