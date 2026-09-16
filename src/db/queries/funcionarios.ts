import { eq } from "drizzle-orm";
import { getDb } from "../index";
import { funcionarios } from "../schema";

/** Sem filtro por restaurante de propósito — é o ponto de entrada que
 * descobre A QUAL restaurante o usuário logado pertence (via restauranteId
 * do próprio registro retornado), não algo que já sabemos de antemão. */
export async function getFuncionarioByClerkId(clerkUserId: string) {
  const rows = await getDb().select().from(funcionarios).where(eq(funcionarios.clerkUserId, clerkUserId)).limit(1);
  return rows[0] ?? null;
}

/** Convite pendente: cadastro feito pelo dono, mas ainda sem clerk_user_id
 * ligado — usado pra "reivindicar" a conta no primeiro login por e-mail. */
export async function getConviteFuncionarioPorEmail(email: string) {
  const rows = await getDb().select().from(funcionarios).where(eq(funcionarios.emailConvite, email)).limit(1);
  const row = rows[0];
  if (!row || row.clerkUserId) return null;
  return row;
}

export async function vincularClerkIdAoFuncionario(funcionarioId: string, clerkUserId: string) {
  const rows = await getDb()
    .update(funcionarios)
    .set({ clerkUserId })
    .where(eq(funcionarios.id, funcionarioId))
    .returning();
  return rows[0];
}

export async function getFuncionarios(restauranteId: string) {
  return getDb().select().from(funcionarios).where(eq(funcionarios.restauranteId, restauranteId)).orderBy(funcionarios.nome);
}
