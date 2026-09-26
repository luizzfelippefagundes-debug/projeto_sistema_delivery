export interface OpcaoComboLimite {
  nome: string;
  limiteQuantidade: number | null;
}

/** Soma quantas peças o cliente já escolheu no total, somando todas as
 * opções do combo. */
export function totalEscolhido(escolhas: Record<string, number>): number {
  return Object.values(escolhas).reduce((s, n) => s + n, 0);
}

/** Regra de quando dá pra aumentar a quantidade de UMA peça específica —
 * trava em dois lugares: o total do combo (`qtdPecasEscolha`) e, se essa
 * peça tiver um máximo próprio (`limiteQuantidade`), nele também. Usada
 * tanto pelo picker de combo do site quanto pelos testes unitários. */
export function podeAumentar(
  escolhas: Record<string, number>,
  opcoes: OpcaoComboLimite[],
  qtdPecasEscolha: number,
  nome: string,
): boolean {
  const restante = qtdPecasEscolha - totalEscolhido(escolhas);
  if (restante <= 0) return false;
  const limite = opcoes.find((o) => o.nome === nome)?.limiteQuantidade;
  const atual = escolhas[nome] ?? 0;
  if (limite != null && atual >= limite) return false;
  return true;
}

/** Aplica um +1/-1 numa peça, respeitando as travas de `podeAumentar` pra
 * incrementos (decrementos sempre passam, até o piso de zero). Retorna um
 * novo objeto de escolhas — nunca muta o que recebeu. */
export function aplicarEscolha(
  escolhas: Record<string, number>,
  opcoes: OpcaoComboLimite[],
  qtdPecasEscolha: number,
  nome: string,
  delta: number,
): Record<string, number> {
  if (delta > 0 && !podeAumentar(escolhas, opcoes, qtdPecasEscolha, nome)) return escolhas;
  const atual = escolhas[nome] ?? 0;
  return { ...escolhas, [nome]: Math.max(0, atual + delta) };
}
