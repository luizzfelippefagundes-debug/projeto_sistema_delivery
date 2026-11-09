import { desc, eq, and, sql } from "drizzle-orm";
import { getDb } from "../src/db/index";
import { pedidos, itensPedido } from "../src/db/schema";

async function main() {
  const db = getDb();

  // Buscar pedido do Dudu com Yakisoba Misto
  const resultado = await db
    .select()
    .from(pedidos)
    .where(
      and(
        sql`lower(${pedidos.clienteNome}) like '%dudu%'`,
        eq(pedidos.status, "novo")
      )
    )
    .orderBy(desc(pedidos.criadoEm))
    .limit(5);

  if (resultado.length === 0) {
    console.log("Nenhum pedido do Dudu encontrado com status 'novo'.");
    // Tenta buscar qualquer pedido recente do Dudu
    const todos = await db
      .select()
      .from(pedidos)
      .where(sql`lower(${pedidos.clienteNome}) like '%dudu%'`)
      .orderBy(desc(pedidos.criadoEm))
      .limit(5);
    if (todos.length > 0) {
      for (const p of todos) {
        console.log(`  Pedido ${p.id} - status: ${p.status}, total: R$ ${p.total}, criado: ${p.criadoEm}`);
      }
      console.log("\nNenhum com status 'novo'. Cancelando o mais recente...");
      const pedido = todos[0];
      await db.update(pedidos).set({ status: "cancelado" }).where(eq(pedidos.id, pedido.id));
      console.log(`Pedido ${pedido.id} cancelado!`);
    }
    process.exit(0);
    return;
  }

  for (const p of resultado) {
    const itens = await db.select().from(itensPedido).where(eq(itensPedido.pedidoId, p.id));
    console.log(`Pedido ${p.id}: ${p.clienteNome} - R$ ${p.total} - ${p.status}`);
    for (const i of itens) {
      console.log(`  -> ${i.quantidade}x ${i.nome} - R$ ${i.preco}`);
    }

    // Cancelar
    await db.update(pedidos).set({ status: "cancelado" }).where(eq(pedidos.id, p.id));
    console.log(`  ✓ Cancelado!`);
  }

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
