import { and, desc, eq, inArray, isNotNull, sql } from "drizzle-orm";
import { getDb } from "../index";
import { itensPedido, pedidos } from "../schema";

/** Resumo por cliente de delivery, montado a partir do nome informado no
 * pedido (`pedidos.clienteNome`) — hoje o checkout do site ainda não liga
 * o pedido a uma conta de cliente de verdade (`clientes.id`), então
 * agrupamos pelo nome. Quando esse fluxo for migrado pro banco, essa
 * mesma consulta passa a agrupar por `clienteId` sem mudar a tela. */
export async function getClientesResumo(restauranteId: string) {
  const rows = await getDb()
    .select({
      nome: pedidos.clienteNome,
      qtdPedidos: sql<string>`count(*)`,
      totalGasto: sql<string>`sum(${pedidos.total})`,
      ultimoPedido: sql<string>`max(${pedidos.criadoEm})`,
    })
    .from(pedidos)
    .where(and(eq(pedidos.restauranteId, restauranteId), isNotNull(pedidos.clienteNome)))
    .groupBy(pedidos.clienteNome)
    .orderBy(desc(sql`sum(${pedidos.total})`));

  return rows.map((r) => ({
    nome: r.nome ?? "Cliente",
    qtdPedidos: Number(r.qtdPedidos),
    totalGasto: Number(r.totalGasto),
    ultimoPedido: new Date(r.ultimoPedido),
  }));
}

/** Histórico completo de pedidos de um cliente de delivery, pelo nome
 * (mesma chave de agrupamento usada em getClientesResumo) — cada pedido já
 * vem com seus itens pra montar a tela de detalhe sem N+1 no componente. */
export async function getHistoricoCliente(restauranteId: string, nome: string) {
  const pedidosDoCliente = await getDb()
    .select()
    .from(pedidos)
    .where(and(eq(pedidos.restauranteId, restauranteId), eq(pedidos.clienteNome, nome)))
    .orderBy(desc(pedidos.criadoEm));

  if (pedidosDoCliente.length === 0) return [];

  const ids = pedidosDoCliente.map((p) => p.id);
  const itens = await getDb().select().from(itensPedido).where(inArray(itensPedido.pedidoId, ids));
  const itensPorPedido = new Map<string, (typeof itens)[number][]>();
  for (const item of itens) {
    const lista = itensPorPedido.get(item.pedidoId) ?? [];
    lista.push(item);
    itensPorPedido.set(item.pedidoId, lista);
  }

  return pedidosDoCliente.map((p) => ({ pedido: p, itens: itensPorPedido.get(p.id) ?? [] }));
}
