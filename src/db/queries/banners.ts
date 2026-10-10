import { asc, eq, inArray } from "drizzle-orm";
import { getDb } from "../index";
import { bannerItens, banners } from "../schema";

export async function getBannersAtivos(restauranteId: string) {
  const rows = await getDb()
    .select()
    .from(banners)
    .where(eq(banners.restauranteId, restauranteId))
    .orderBy(asc(banners.ordem), asc(banners.criadoEm));

  if (rows.length === 0) return [];

  const itens = await getDb()
    .select()
    .from(bannerItens)
    .where(inArray(bannerItens.bannerId, rows.map((b) => b.id)));

  return rows.map((b) => ({
    ...b,
    itens: itens.filter((i) => i.bannerId === b.id),
  }));
}
