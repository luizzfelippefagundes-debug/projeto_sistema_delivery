/** Regra única do que é um número de mesa válido — usada tanto na página
 * pública (`/loja/[slug]/mesa/[numero]`, decide 404) quanto na action que
 * cria o pedido (`criarPedidoMesa`, nunca confia só no que a URL mandou). */
export function mesaValida(mesa: number, numeroMesas: number): boolean {
  return Number.isInteger(mesa) && mesa >= 1 && mesa <= numeroMesas;
}
