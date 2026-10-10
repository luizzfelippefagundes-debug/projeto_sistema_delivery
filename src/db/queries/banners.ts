import { asc, eq } from "drizzle-orm";
import { getDb } from "../index";
import { banners } from "../schema";

export async function getBannersAtivos(restauranteId: string) {
  return getDb()
    .select()
    .from(banners)
    .where(eq(banners.restauranteId, restauranteId))
    .orderBy(asc(banners.ordem), asc(banners.criadoEm));
}
