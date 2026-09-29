import type { MetadataRoute } from "next";
import { getDb } from "@/db";
import { restaurantes } from "@/db/schema";

const SITE_URL = "https://daishisushi.com.br";

/** Uma entrada por restaurante cadastrado — hoje só a Dashi Sushi, mas já
 * cobre outros clientes do SaaS sem precisar mexer aqui de novo. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lojas = await getDb().select({ slug: restaurantes.slug }).from(restaurantes);

  return lojas.map((r) => ({
    url: `${SITE_URL}/loja/${r.slug}`,
    changeFrequency: "daily",
    priority: 1,
  }));
}
