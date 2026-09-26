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

/** Histórico de pedidos de um cliente logado (site), pelo clienteId real —
 * alimenta "Meus pedidos" e o acompanhamento. */
export async function getPedidosPorClienteId(clienteId: string) {
  return getDb().select().from(pedidos).where(eq(pedidos.clienteId, clienteId)).orderBy(desc(pedidos.criadoEm));
}

/** Pedido + itens pra montar a comanda impressa — uma consulta só, já que
 * a tela de impressão só precisa desse pedido específico. */
export async function getPedidoComItens(pedidoId: string) {
  const [pedido] = await getDb().select().from(pedidos).where(eq(pedidos.id, pedidoId));
  if (!pedido) return null;
  const itens = await getDb().select().from(itensPedido).where(eq(itensPedido.pedidoId, pedidoId));
  return { pedido, itens };
}

/** Busca itens de vários pedidos de uma vez e agrupa por pedidoId — evita
 * uma query por pedido ao montar listas (dashboard, financeiro). */
/** Tudo que já foi enviado pra cozinha por uma mesa e ainda não foi pago —
 * alimenta a tela "minha conta" que o próprio cliente vê no QR code, sem
 * precisar chamar ninguém pra saber quanto já deve. */
export async function getContaAbertaMesa(restauranteId: string, mesa: number) {
  const pedidosAbertos = await getDb()
    .select()
    .from(pedidos)
    .where(
      and(
        eq(pedidos.restauranteId, restauranteId),
        eq(pedidos.origem, "salao"),
        eq(pedidos.mesa, mesa),
        sql`${pedidos.status} != 'finalizado'`,
      ),
    );
  if (pedidosAbertos.length === 0) return { itens: [], total: 0 };

  const itens = await getDb()
    .select()
    .from(itensPedido)
    .where(
      inArray(
        itensPedido.pedidoId,
        pedidosAbertos.map((p) => p.id),
      ),
    );

  const total = pedidosAbertos.reduce((s, p) => s + p.total, 0);
  return { itens: itens.map((i) => ({ nome: i.nome, preco: i.preco, quantidade: i.quantidade })), total };
}

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
