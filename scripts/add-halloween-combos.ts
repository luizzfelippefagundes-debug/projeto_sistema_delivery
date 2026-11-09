import { and, eq } from "drizzle-orm";
import { getDb } from "../src/db";
import { itensCardapio, restaurantes } from "../src/db/schema";

const combos = [
  {
    nome: "Combo Halloween - Surpresa Hot 20 peças",
    descricao: "20 peças. Promoção de Halloween: de R$ 80,00 por R$ 57,00.",
  },
  {
    nome: "Combo Halloween - Surpresa Cru 20 peças",
    descricao: "20 peças. Promoção de Halloween: de R$ 80,00 por R$ 57,00.",
  },
  {
    nome: "Combo Halloween - Surpresa Mista 20 peças",
    descricao: "20 peças de sushi cru e hot. Promoção de Halloween: de R$ 80,00 por R$ 57,00.",
  },
] as const;

async function main() {
  const db = getDb();
  const [restaurante] = await db
    .select({ id: restaurantes.id })
    .from(restaurantes)
    .where(eq(restaurantes.slug, "dashi-sushi"))
    .limit(1);

  if (!restaurante) throw new Error("Restaurante Dashi Sushi não encontrado.");

  for (const combo of combos) {
    const [existing] = await db
      .select({ id: itensCardapio.id })
      .from(itensCardapio)
      .where(and(eq(itensCardapio.restauranteId, restaurante.id), eq(itensCardapio.nome, combo.nome)))
      .limit(1);

    if (existing) {
      await db
        .update(itensCardapio)
        .set({ categoria: "Combos", descricao: combo.descricao, preco: 57, ativo: true })
        .where(eq(itensCardapio.id, existing.id));
      console.log(`Atualizado: ${combo.nome}`);
      continue;
    }

    await db.insert(itensCardapio).values({
      restauranteId: restaurante.id,
      categoria: "Combos",
      nome: combo.nome,
      descricao: combo.descricao,
      preco: 57,
      ativo: true,
    });
    console.log(`Adicionado: ${combo.nome}`);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
