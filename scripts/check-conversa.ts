import { eq } from "drizzle-orm";
import { getDb } from "../src/db/index";
import { conversasWhatsapp } from "../src/db/schema";

async function main() {
  const db = getDb();

  const [conversa] = await db
    .select()
    .from(conversasWhatsapp)
    .where(eq(conversasWhatsapp.telefone, "5527997501517"))
    .limit(1);

  if (!conversa) {
    console.log("Conversa não encontrada");
    process.exit(0);
  }

  console.log("=== Estado da conversa ===");
  console.log("nomeTemp:", conversa.nomeTemp);
  console.log("enderecoTemp:", conversa.enderecoTemp);
  console.log("pagamentoTemp:", conversa.pagamentoTemp);
  console.log("carrinho:", JSON.stringify(conversa.carrinho, null, 2));
  console.log("processando:", conversa.processando);
  console.log("confirmandoPedido:", (conversa as Record<string, unknown>).confirmandoPedido);
  console.log("atualizado:", conversa.atualizadoEm);

  const hist = (conversa as Record<string, unknown>).historico as unknown[];
  if (Array.isArray(hist) && hist.length > 0) {
    console.log(`\n=== Histórico (${hist.length} msgs, últimas 15) ===`);
    for (const msg of hist.slice(-15)) {
      const m = msg as { role: string; content: unknown };
      const content = typeof m.content === "string" ? m.content : JSON.stringify(m.content);
      console.log(`\n[${m.role}] ${content?.slice(0, 500)}`);
    }
  } else {
    console.log("\nHistórico vazio ou null:", (conversa as Record<string, unknown>).historico);
  }

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
