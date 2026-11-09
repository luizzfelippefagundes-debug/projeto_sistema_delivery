import { eq } from "drizzle-orm";
import { getDb } from "../src/db/index";
import { conversasWhatsapp } from "../src/db/schema";

async function main() {
  const travadas = await getDb()
    .select({ id: conversasWhatsapp.id, telefone: conversasWhatsapp.telefone, processando: conversasWhatsapp.processando, atualizadoEm: conversasWhatsapp.atualizadoEm })
    .from(conversasWhatsapp)
    .where(eq(conversasWhatsapp.processando, true));

  console.log("Conversas travadas:", JSON.stringify(travadas, null, 2));

  if (travadas.length > 0) {
    const result = await getDb()
      .update(conversasWhatsapp)
      .set({ processando: false })
      .where(eq(conversasWhatsapp.processando, true))
      .returning({ id: conversasWhatsapp.id, telefone: conversasWhatsapp.telefone });
    console.log("Destravadas:", JSON.stringify(result, null, 2));
  } else {
    console.log("Nenhuma conversa travada.");
  }

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
