import { desc, eq } from "drizzle-orm";
import { getDb } from "../index";
import { logAtividades } from "../schema";

export async function getAtividades(restauranteId: string, limite = 100) {
  return getDb()
    .select()
    .from(logAtividades)
    .where(eq(logAtividades.restauranteId, restauranteId))
    .orderBy(desc(logAtividades.criadoEm))
    .limit(limite);
}

export async function registrarAtividade(dados: {
  restauranteId: string;
  funcionarioId: string;
  nomeFuncionario: string;
  acao: string;
  detalhe?: string;
}) {
  await getDb().insert(logAtividades).values({
    restauranteId: dados.restauranteId,
    funcionarioId: dados.funcionarioId,
    nomeFuncionario: dados.nomeFuncionario,
    acao: dados.acao,
    detalhe: dados.detalhe,
  });
}
