import { and, asc, desc, eq, inArray, isNotNull, isNull, sql } from "drizzle-orm";
import { getDb } from "../index";
import { ordenarPorNome } from "../../lib/ordenacao";
import { itensCardapio, itensPedido, opcoesCombo, pedidos } from "../schema";

export async function getItensCardapio(restauranteId: string) {
  const itens = await getDb().select().from(itensCardapio).where(eq(itensCardapio.restauranteId, restauranteId));
  return ordenarPorNome(itens);
}

export async function getItensCardapioAtivos(restauranteId: string) {
  const itens = await getDb()
    .select()
    .from(itensCardapio)
    .where(and(eq(itensCardapio.restauranteId, restauranteId), eq(itensCardapio.ativo, true)));
  return ordenarPorNome(itens);
}

/** Peças escolhíveis de cada combo, agrupadas por item — alimenta tanto o
 * editor do cardápio (dono) quanto o seletor de peças no cardápio online. */
export interface OpcaoComboResumo {
  id: string;
  nome: string;
  limiteQuantidade: number | null;
  disponivel: boolean;
  grupo: string | null;
}

export async function getOpcoesComboPorItens(itemIds: string[]) {
  const mapa = new Map<string, OpcaoComboResumo[]>();
  if (itemIds.length === 0) return mapa;
  const rows = await getDb()
    .select()
    .from(opcoesCombo)
    .where(inArray(opcoesCombo.itemCardapioId, itemIds))
    .orderBy(asc(opcoesCombo.ordem));
  for (const row of rows) {
    const lista = mapa.get(row.itemCardapioId) ?? [];
    lista.push({
      id: row.id,
      nome: row.nome,
      limiteQuantidade: row.limiteQuantidade,
      disponivel: row.disponivel,
      grupo: row.grupo,
    });
    mapa.set(row.itemCardapioId, lista);
  }
  return mapa;
}

/** Substitui as peças escolhíveis de um combo (apaga tudo e recria) — lista
 * pequena e reordenável no editor, mais simples que fazer diff. */
export async function definirOpcoesCombo(
  itemCardapioId: string,
  opcoes: { nome: string; limiteQuantidade: number | null }[],
) {
  const db = getDb();
  // O editor do painel não mexe em grupo: guarda o de cada opção pelo nome pra não perder ao recriar.
  const antigas = await db
    .select({ nome: opcoesCombo.nome, grupo: opcoesCombo.grupo })
    .from(opcoesCombo)
    .where(eq(opcoesCombo.itemCardapioId, itemCardapioId));
  const grupoPorNome = new Map(antigas.map((o) => [o.nome, o.grupo]));
  await db.delete(opcoesCombo).where(eq(opcoesCombo.itemCardapioId, itemCardapioId));
  const limpas = opcoes.filter((o) => o.nome.trim());
  if (limpas.length === 0) return;
  await db.insert(opcoesCombo).values(
    limpas.map((o, ordem) => ({
      itemCardapioId,
      nome: o.nome.trim(),
      limiteQuantidade: o.limiteQuantidade,
      ordem,
      grupo: grupoPorNome.get(o.nome.trim()) ?? null,
    })),
  );
}

/** Itens com controle de estoque ligado (estoqueAtual não nulo) —
 * alimenta a tela de Estoque do painel da dona. */
export async function getItensComEstoque(restauranteId: string) {
  const itens = await getDb()
    .select()
    .from(itensCardapio)
    .where(and(eq(itensCardapio.restauranteId, restauranteId), isNotNull(itensCardapio.estoqueAtual)));
  return ordenarPorNome(itens);
}

/** Desconta do estoque os itens vendidos num pedido — só mexe em itens que
 * têm controle ligado (estoqueAtual não nulo); os demais (pratos feitos na
 * hora, sem unidade contável) passam direto. Pausa o item sozinho
 * (`ativo = false`) quando o estoque zera, pra não vender o que não tem
 * mais. Roda depois que o pedido já foi criado, então uma falha aqui não
 * derruba a venda — só loga. */
export async function baixarEstoque(itens: { itemCardapioId: string; quantidade: number }[]) {
  if (itens.length === 0) return;
  const db = getDb();
  const ids = itens.map((i) => i.itemCardapioId);
  const rows = await db
    .select({ id: itensCardapio.id, estoqueAtual: itensCardapio.estoqueAtual })
    .from(itensCardapio)
    .where(and(inArray(itensCardapio.id, ids), isNotNull(itensCardapio.estoqueAtual)));

  for (const row of rows) {
    const vendido = itens.find((i) => i.itemCardapioId === row.id)?.quantidade ?? 0;
    const novoEstoque = Math.max(0, (row.estoqueAtual ?? 0) - vendido);
    await db
      .update(itensCardapio)
      .set({ estoqueAtual: novoEstoque, ...(novoEstoque === 0 ? { ativo: false } : {}) })
      .where(eq(itensCardapio.id, row.id));
  }
}

/** Contrário de `baixarEstoque` — usado quando um pedido é cancelado, pra
 * devolver ao estoque as unidades que tinham sido descontadas na hora da
 * compra. Reativa o item se ele tinha sido pausado automaticamente por ter
 * zerado (mesmo acoplamento que `baixarEstoque` já faz ao contrário).
 * Aceita um `runner` opcional para rodar dentro de uma transação existente. */
type QueryRunner = Pick<ReturnType<typeof getDb>, "select" | "update">;

export async function devolverEstoque(
  itens: { itemCardapioId: string; quantidade: number }[],
  runner?: QueryRunner,
) {
  if (itens.length === 0) return;
  const db = runner ?? getDb();
  const ids = itens.map((i) => i.itemCardapioId);
  const rows = await db
    .select({ id: itensCardapio.id, estoqueAtual: itensCardapio.estoqueAtual, ativo: itensCardapio.ativo })
    .from(itensCardapio)
    .where(and(inArray(itensCardapio.id, ids), isNotNull(itensCardapio.estoqueAtual)));

  for (const row of rows) {
    const devolvido = itens.find((i) => i.itemCardapioId === row.id)?.quantidade ?? 0;
    const novoEstoque = (row.estoqueAtual ?? 0) + devolvido;
    await db
      .update(itensCardapio)
      .set({ estoqueAtual: novoEstoque, ...(novoEstoque > 0 && !row.ativo ? { ativo: true } : {}) })
      .where(eq(itensCardapio.id, row.id));
  }
}

/** Itens ativos que ainda não têm controle de estoque ligado — alimenta o
 * seletor de "adicionar item ao estoque", pra dona escolher um item já
 * existente no cardápio em vez de cadastrar tudo de novo. */
export async function getItensSemControleEstoque(restauranteId: string) {
  const itens = await getDb()
    .select()
    .from(itensCardapio)
    .where(
      and(
        eq(itensCardapio.restauranteId, restauranteId),
        eq(itensCardapio.ativo, true),
        isNull(itensCardapio.estoqueAtual),
      ),
    );
  return ordenarPorNome(itens);
}

/** Ajuste manual de estoque (reposição ou correção) — se o item tinha sido
 * pausado sozinho por ter zerado, reativa ao voltar a ter estoque. */
export async function ajustarEstoque(itemId: string, delta: number) {
  const db = getDb();
  const [item] = await db.select().from(itensCardapio).where(eq(itensCardapio.id, itemId));
  if (!item || item.estoqueAtual === null) return null;
  const novoEstoque = Math.max(0, item.estoqueAtual + delta);
  const [atualizado] = await db
    .update(itensCardapio)
    .set({ estoqueAtual: novoEstoque, ...(novoEstoque > 0 && !item.ativo ? { ativo: true } : {}) })
    .where(eq(itensCardapio.id, itemId))
    .returning();
  return atualizado;
}

/** Top N itens que apareceram no maior número de pedidos distintos.
 * Conta pedidos, não quantidade de peças — evita que complementos avulsos
 * muito baratos (ex: peça de R$4 pedida 30x num combo) subam sem mérito.
 * Só retorna itens ativos. Usado no carrossel "Mais Pedidos" do cardápio. */
export async function getMaisVendidos(restauranteId: string, limite = 8) {
  const tops = await getDb()
    .select({
      id: itensPedido.itemCardapioId,
      total: sql<number>`count(distinct ${itensPedido.pedidoId})`,
    })
    .from(itensPedido)
    .innerJoin(pedidos, eq(pedidos.id, itensPedido.pedidoId))
    .where(and(eq(pedidos.restauranteId, restauranteId), isNotNull(itensPedido.itemCardapioId)))
    .groupBy(itensPedido.itemCardapioId)
    .orderBy(desc(sql<number>`count(distinct ${itensPedido.pedidoId})`))
    .limit(limite);

  const ids = tops.map((t) => t.id).filter((id): id is string => id != null);
  if (ids.length === 0) return [];

  const itens = await getDb()
    .select()
    .from(itensCardapio)
    .where(and(inArray(itensCardapio.id, ids), eq(itensCardapio.ativo, true)));

  return ids
    .map((id) => itens.find((i) => i.id === id))
    .filter((i): i is typeof itensCardapio.$inferSelect => i != null);
}

/** Todos os sabores (opções de combo) de um restaurante, sem duplicatas por
 * nome — pra gestão de "sabores do dia". Retorna uma entrada por nome único,
 * com a lista de IDs de todas as ocorrências daquele sabor. */
export async function getSaboresDoRestaurante(restauranteId: string) {
  const itens = await getDb()
    .select({ id: itensCardapio.id })
    .from(itensCardapio)
    .where(and(eq(itensCardapio.restauranteId, restauranteId), isNotNull(itensCardapio.qtdPecasEscolha)));

  const itemIds = itens.map((i) => i.id);
  if (itemIds.length === 0) return [];

  const opcoes = await getDb()
    .select()
    .from(opcoesCombo)
    .where(inArray(opcoesCombo.itemCardapioId, itemIds))
    .orderBy(asc(opcoesCombo.nome));

  // Agrupar por nome: um sabor pode aparecer em vários itens
  const porNome = new Map<string, { nome: string; ids: string[]; disponivel: boolean }>();
  for (const op of opcoes) {
    const entrada = porNome.get(op.nome) ?? { nome: op.nome, ids: [], disponivel: op.disponivel };
    entrada.ids.push(op.id);
    // Se qualquer ocorrência estiver indisponível, o sabor aparece como indisponível
    if (!op.disponivel) entrada.disponivel = false;
    porNome.set(op.nome, entrada);
  }

  return [...porNome.values()].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}
