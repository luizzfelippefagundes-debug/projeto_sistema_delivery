import { eq } from "drizzle-orm";
import { getDb } from "../index";
import { solicitacoesFechamento } from "../schema";

/** Mesas do restaurante com pedido de fechamento pendente — a Comanda usa
 * isso pra destacar visualmente qual mesa quer pagar, sem depender só da
 * notificação push (que pode passar despercebida). */
export async function getMesasComFechamentoPendente(restauranteId: string): Promise<Set<number>> {
  const rows = await getDb()
    .select({ mesa: solicitacoesFechamento.mesa })
    .from(solicitacoesFechamento)
    .where(eq(solicitacoesFechamento.restauranteId, restauranteId));
  return new Set(rows.map((r) => r.mesa));
}
