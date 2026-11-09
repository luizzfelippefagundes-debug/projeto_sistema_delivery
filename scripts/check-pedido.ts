import { desc, eq } from "drizzle-orm";
import { getDb } from "../src/db/index";
import { pedidos, itensPedido, conversasWhatsapp } from "../src/db/schema";

async function main() {
  const db = getDb();

  // 1. Check recent orders
  console.log("=== Últimos pedidos ===");
  const ultimosPedidos = await db
    .select()
    .from(pedidos)
    .orderBy(desc(pedidos.criadoEm))
    .limit(5);

  for (const p of ultimosPedidos) {
    console.log(`\nPedido ${p.id}:`);
    console.log(`  Telefone: ${p.telefoneCliente}`);
    console.log(`  Status: ${p.status}`);
    console.log(`  Total: R$ ${p.total}`);
    console.log(`  Pagamento: ${p.formaPagamento}`);
    console.log(`  Endereço: ${p.endereco}`);
    console.log(`  Criado: ${p.criadoEm}`);

    const itens = await db
      .select()
      .from(itensPedido)
      .where(eq(itensPedido.pedidoId, p.id));
    for (const item of itens) {
      console.log(`  -> ${item.quantidade}x ${item.nome} - R$ ${item.preco}`);
    }
  }

  // 2. Check conversation history for the user's phone
  console.log("\n\n=== Conversa 5527997501517 ===");
  const [conversa] = await db
    .select()
    .from(conversasWhatsapp)
    .where(eq(conversasWhatsapp.telefone, "5527997501517"))
    .limit(1);

  if (conversa) {
    console.log("ID:", conversa.id);
    console.log("Processando:", conversa.processando);
    console.log("Atualizado:", conversa.atualizadoEm);
    const hist = (conversa as Record<string, unknown>).historico as unknown[];
    if (Array.isArray(hist)) {
      console.log("Histórico (últimas 10 msgs):");
      for (const msg of hist.slice(-10)) {
        const m = msg as { role: string; content: string };
        console.log(`  [${m.role}] ${typeof m.content === "string" ? m.content.slice(0, 200) : JSON.stringify(m.content)?.slice(0, 200)}`);
      }
    }
  } else {
    console.log("Conversa não encontrada");
  }

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
