import { and, eq, sql } from "drizzle-orm";
import { getDb } from "../index";
import { conversasWhatsapp } from "../schema";
import type { ItemCarrinhoWhatsapp } from "../../lib/types";

export async function getOuCriarConversa(restauranteId: string, telefone: string) {
  const db = getDb();
  const existente = await db
    .select()
    .from(conversasWhatsapp)
    .where(and(eq(conversasWhatsapp.restauranteId, restauranteId), eq(conversasWhatsapp.telefone, telefone)))
    .limit(1);
  if (existente[0]) return existente[0];

  const [nova] = await db
    .insert(conversasWhatsapp)
    .values({ restauranteId, telefone })
    .onConflictDoUpdate({
      target: [conversasWhatsapp.restauranteId, conversasWhatsapp.telefone],
      set: { atualizadoEm: new Date() },
    })
    .returning();
  return nova;
}

/** Tenta adquirir a trava de processamento da conversa.
 * Retorna a linha se conseguiu (processando era false), null se já estava travada.
 * Usar antes de qualquer leitura de estado — a trava é no banco, não em memória. */
export async function travarProcessamento(id: string) {
  const [row] = await getDb()
    .update(conversasWhatsapp)
    .set({ processando: true, atualizadoEm: new Date() })
    .where(and(eq(conversasWhatsapp.id, id), eq(conversasWhatsapp.processando, false)))
    .returning();
  return row ?? null;
}

export async function liberarProcessamento(id: string) {
  await getDb()
    .update(conversasWhatsapp)
    .set({ processando: false, atualizadoEm: new Date() })
    .where(eq(conversasWhatsapp.id, id));
}

/** Trava específica para a confirmação do pedido — evita pedidos duplicados
 * quando a tool confirmar_pedido é chamada mais de uma vez no mesmo turno. */
export async function travarConfirmacao(id: string): Promise<boolean> {
  const [row] = await getDb()
    .update(conversasWhatsapp)
    .set({ confirmandoPedido: true })
    .where(and(eq(conversasWhatsapp.id, id), eq(conversasWhatsapp.confirmandoPedido, false)))
    .returning({ id: conversasWhatsapp.id });
  return row != null;
}

export async function liberarConfirmacao(id: string) {
  await getDb()
    .update(conversasWhatsapp)
    .set({ confirmandoPedido: false })
    .where(eq(conversasWhatsapp.id, id));
}

export type DadosConversa = Partial<{
  carrinho: ItemCarrinhoWhatsapp[];
  enderecoTemp: string | null;
  nomeTemp: string | null;
  pagamentoTemp: string | null;
  historicoResumido: string;
}>;

export async function atualizarConversa(id: string, dados: DadosConversa) {
  const { carrinho, ...resto } = dados;
  await getDb()
    .update(conversasWhatsapp)
    .set({
      ...resto,
      ...(carrinho !== undefined ? { carrinho: JSON.stringify(carrinho) } : {}),
      atualizadoEm: new Date(),
    })
    .where(eq(conversasWhatsapp.id, id));
}

export async function resetarConversa(id: string) {
  await getDb()
    .update(conversasWhatsapp)
    .set({
      etapa: "inicio",
      categoriaAtual: null,
      itemCardapioIdAtual: null,
      carrinho: "[]",
      enderecoTemp: null,
      nomeTemp: null,
      pagamentoTemp: null,
      historicoResumido: "",
      processando: false,
      confirmandoPedido: false,
      atualizadoEm: new Date(),
    })
    .where(eq(conversasWhatsapp.id, id));
}

export function parseCarrinho(carrinhoJson: string): ItemCarrinhoWhatsapp[] {
  try {
    const parsed = JSON.parse(carrinhoJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
