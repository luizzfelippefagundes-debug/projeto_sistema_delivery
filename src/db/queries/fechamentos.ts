import { and, eq } from "drizzle-orm";
import { getDb } from "../index";
import { fechamentosCaixa } from "../schema";

export async function getUltimoFechamento(restauranteId: string) {
  const rows = await getDb()
    .select()
    .from(fechamentosCaixa)
    .where(eq(fechamentosCaixa.restauranteId, restauranteId))
    .orderBy(fechamentosCaixa.fechadoEm)
    .limit(1000);
  return rows[rows.length - 1] ?? null;
}

export async function getFechamentoDoDia(restauranteId: string, dataISO: string) {
  const rows = await getDb()
    .select()
    .from(fechamentosCaixa)
    .where(and(eq(fechamentosCaixa.restauranteId, restauranteId), eq(fechamentosCaixa.data, dataISO)))
    .limit(1);
  return rows[0] ?? null;
}
