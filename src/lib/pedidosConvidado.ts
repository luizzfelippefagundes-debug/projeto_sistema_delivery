const CHAVE = "dashi-sushi-pedidos-convidado";
const MAXIMO = 20;

/** Guarda o id de um pedido feito sem login, só no navegador de quem
 * pediu — é assim que a aba "Pedidos" consegue achar de novo o pedido de
 * um cliente sem conta, sem precisar de senha nem servidor. */
export function salvarPedidoConvidado(pedidoId: string) {
  try {
    const atual = lerPedidosConvidado();
    const atualizado = [pedidoId, ...atual.filter((id) => id !== pedidoId)].slice(0, MAXIMO);
    localStorage.setItem(CHAVE, JSON.stringify(atualizado));
  } catch {
    // localStorage indisponível (ex: aba anônima) — sem drama, só não lembra depois
  }
}

export function lerPedidosConvidado(): string[] {
  try {
    const raw = localStorage.getItem(CHAVE);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
