/** Quanto cada pessoa paga se a conta for dividida — usado tanto na tela
 * do cliente (pra ele já saber quanto deve) quanto na tela de quem fecha a
 * mesa (pra facilitar na hora de cobrar). Nunca divide por menos de 1
 * pessoa. */
export function calcularPorPessoa(total: number, pessoas: number): number {
  const qtd = Math.max(1, Math.round(pessoas));
  return total / qtd;
}
