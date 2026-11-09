import { desc, eq, sql } from "drizzle-orm";
import { getDb } from "../src/db/index";
import { pedidos, itensPedido } from "../src/db/schema";

async function main() {
  const db = getDb();

  const resultado = await db
    .select()
    .from(pedidos)
    .where(eq(pedidos.telefoneCliente, "5527997501517"))
    .orderBy(desc(pedidos.criadoEm))
    .limit(5);

  if (resultado.length === 0) {
    console.log("Nenhum pedido encontrado para 5527997501517");
    process.exit(0);
  }

  for (const p of resultado) {
    if (p.status === "cancelado") continue;
    const itens = await db.select().from(itensPedido).where(eq(itensPedido.pedidoId, p.id));
    console.log(`Pedido ${p.id}: ${p.clienteNome} - R$ ${p.total} - ${p.status}`);
    for (const i of itens) {
      console.log(`  -> ${i.quantidade}x ${i.nome} - R$ ${i.preco}`);
    }
    await db.update(pedidos).set({ status: "cancelado" }).where(eq(pedidos.id, p.id));
    console.log(`  ✓ Cancelado!`);
  }

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
