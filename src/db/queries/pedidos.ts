import { and, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { getDb } from "../index";
import { itensPedido, pedidos } from "../schema";
import type { Origem } from "../../lib/types";
import type { OrderStatus } from "../../lib/types";

function inicioDoDia(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function fimDoDia(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

export async function getPedidosDoDia(restauranteId: string, dia: Date = new Date()) {
  return getDb()
    .select()
    .from(pedidos)
    .where(and(eq(pedidos.restauranteId, restauranteId), gte(pedidos.criadoEm, inicioDoDia(dia))))
    .orderBy(pedidos.criadoEm);
}

export async function getPedidosAbertos(restauranteId: string) {
  return getDb()
    .select()
    .from(pedidos)
    .where(and(eq(pedidos.restauranteId, restauranteId), sql`${pedidos.status} != 'finalizado'`))
    .orderBy(pedidos.criadoEm);
}

export async function getPedidosDesde(restauranteId: string, desde: Date) {
  return getDb()
    .select()
    .from(pedidos)
    .where(and(eq(pedidos.restauranteId, restauranteId), gte(pedidos.criadoEm, desde)))
    .orderBy(pedidos.criadoEm);
}

export interface FiltroPedidos {
  status?: OrderStatus;
  origem?: Origem;
  de?: Date;
  ate?: Date;
}

export async function getPedidosFiltrados(restauranteId: string, filtro: FiltroPedidos) {
  const condicoes = [eq(pedidos.restauranteId, restauranteId)];
  if (filtro.status) condicoes.push(eq(pedidos.status, filtro.status));
  if (filtro.origem) condicoes.push(eq(pedidos.origem, filtro.origem));
  if (filtro.de) condicoes.push(gte(pedidos.criadoEm, inicioDoDia(filtro.de)));
  if (filtro.ate) condicoes.push(lte(pedidos.criadoEm, fimDoDia(filtro.ate)));

  return getDb()
    .select()
    .from(pedidos)
    .where(and(...condicoes))
    .orderBy(pedidos.criadoEm);
}

/** Entregas concluídas por um motoboy específico desde uma data — alimenta
 * a visão "Minhas entregas" do painel dele (histórico + estatísticas). */
export async function getEntregasDoMotoboyDesde(restauranteId: string, funcionarioId: string, desde: Date) {
  return getDb()
    .select()
    .from(pedidos)
    .where(
      and(
        eq(pedidos.restauranteId, restauranteId),
        eq(pedidos.entregadorId, funcionarioId),
        eq(pedidos.status, "entregue"),
        gte(pedidos.criadoEm, desde),
      ),
    )
    .orderBy(desc(pedidos.criadoEm));
}

export async function getItensDoPedido(pedidoId: string) {
  return getDb().select().from(itensPedido).where(eq(itensPedido.pedidoId, pedidoId));
}

/** Busca itens de vários pedidos de uma vez e agrupa por pedidoId — evita
 * uma query por pedido ao montar listas (dashboard, financeiro). */
export async function getItensAgrupadosPorPedido(pedidoIds: string[]) {
  if (pedidoIds.length === 0) return new Map<string, (typeof itensPedido.$inferSelect)[]>();
  const rows = await getDb().select().from(itensPedido).where(inArray(itensPedido.pedidoId, pedidoIds));
  const mapa = new Map<string, (typeof itensPedido.$inferSelect)[]>();
  for (const row of rows) {
    const lista = mapa.get(row.pedidoId) ?? [];
    lista.push(row);
    mapa.set(row.pedidoId, lista);
  }
  return mapa;
}
