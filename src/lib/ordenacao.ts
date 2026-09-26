/** Ordem alfabética pura bagunça nomes com número (ex: "Combo 5 peças"
 * cai entre "Combo 40" e "Combo 50", porque compara caractere a
 * caractere). `numeric: true` faz o "5" vencer o "15", que vence o "40",
 * na ordem que faz sentido pra quem tá lendo o cardápio. */
export function ordenarPorNome<T extends { categoria: string; nome: string }>(itens: T[]): T[] {
  return [...itens].sort(
    (a, b) =>
      a.categoria.localeCompare(b.categoria, "pt-BR") || a.nome.localeCompare(b.nome, "pt-BR", { numeric: true }),
  );
}
