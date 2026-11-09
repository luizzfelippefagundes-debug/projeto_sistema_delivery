import { eq, or, sql } from "drizzle-orm";
import { getDb } from "../src/db/index";
import { itensCardapio } from "../src/db/schema";

async function main() {
  const db = getDb();

  const achados = await db
    .select()
    .from(itensCardapio)
    .where(
      or(
        sql`lower(${itensCardapio.nome}) like '%halloween%'`,
        sql`lower(${itensCardapio.nome}) like '%hallowen%'`,
        sql`lower(${itensCardapio.categoria}) like '%halloween%'`,
      ),
    );

  if (achados.length === 0) {
    console.log("Nenhum item de Halloween encontrado.");
    process.exit(0);
  }

  for (const i of achados) {
    console.log(`${i.nome} (cat: ${i.categoria}, R$ ${i.preco}, ativo: ${i.ativo})`);
    await db.update(itensCardapio).set({ ativo: false }).where(eq(itensCardapio.id, i.id));
    console.log("  -> desativado");
  }

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
