import { eq } from "drizzle-orm";
import { getDb } from "../src/db/index";
import { restaurantes } from "../src/db/schema";

async function main() {
  const result = await getDb()
    .update(restaurantes)
    .set({ instanciaWhatsapp: "darlane-sushi" })
    .where(eq(restaurantes.slug, "dashi-sushi"))
    .returning();
  console.log("Atualizado:", JSON.stringify(result, null, 2));
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
