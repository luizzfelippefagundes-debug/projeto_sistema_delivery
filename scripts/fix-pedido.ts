import { desc, eq, sql } from "drizzle-orm";
import { getDb } from "../src/db/index";
import { pedidos, itensPedido, itensCardapio } from "../src/db/schema";

async function main() {
  const db = getDb();

  const ultimosPedidos = await db
    .select()
    .from(pedidos)
    .orderBy(desc(pedidos.criadoEm))
    .limit(10);

  for (const p of ultimosPedidos) {
    const itens = await db
      .select()
      .from(itensPedido)
      .where(eq(itensPedido.pedidoId, p.id));

    console.log(`\nPedido ${p.id}:`);
    console.log(`  Nome: ${p.clienteNome}`);
    console.log(`  Telefone: ${p.telefoneCliente}`);
    console.log(`  Status: ${p.status}`);
    console.log(`  Total: R$ ${p.total}`);
    console.log(`  Endereço: ${p.endereco}`);
    console.log(`  Pagamento: ${p.formaPagamento}`);
    console.log(`  Criado: ${p.criadoEm}`);
    for (const item of itens) {
      console.log(`  -> ${item.quantidade}x ${item.nome} - R$ ${item.preco} (itemId: ${item.id})`);
    }
  }

  console.log("\n\n=== Itens 'Hot' no cardápio ===");
  const hots = await db
    .select()
    .from(itensCardapio)
    .where(sql`lower(${itensCardapio.nome}) like '%hot%' OR lower(${itensCardapio.categoria}) like '%hot%'`);

  for (const h of hots) {
    console.log(`  ${h.nome} - R$ ${h.preco} (cat: ${h.categoria}, id: ${h.id}, pecas: ${h.qtdPecasEscolha})`);
  }

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
