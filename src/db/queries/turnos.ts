import { asc, eq } from "drizzle-orm";
import { getDb } from "../index";
import { turnos } from "../schema";

export async function getTurnosPorFuncionario(funcionarioId: string) {
  return getDb()
    .select()
    .from(turnos)
    .where(eq(turnos.funcionarioId, funcionarioId))
    .orderBy(asc(turnos.diaSemana), asc(turnos.horaInicio));
}

/** Todos os turnos do restaurante, agrupados por funcionário — usado na
 * tela de Funcionários pra já entregar a escala de cada um sem N+1. */
export async function getTurnosAgrupadosPorFuncionario(restauranteId: string) {
  const rows = await getDb()
    .select()
    .from(turnos)
    .where(eq(turnos.restauranteId, restauranteId))
    .orderBy(asc(turnos.diaSemana), asc(turnos.horaInicio));

  const mapa = new Map<string, (typeof rows)[number][]>();
  for (const t of rows) {
    const lista = mapa.get(t.funcionarioId) ?? [];
    lista.push(t);
    mapa.set(t.funcionarioId, lista);
  }
  return mapa;
}
