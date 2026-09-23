/** Casa o bairro digitado pelo cliente com uma zona cadastrada — comparação
 * simples (sem acento/maiúscula) porque não é geocodificação de verdade,
 * é só uma tabela bairro → taxa/tempo que a dona mantém. Usado tanto no
 * checkout (client) quanto na revalidação do pedido (server), por isso
 * mora aqui e não em db/queries (que puxa a conexão com o banco). */
export function encontrarZona<T extends { bairro: string }>(zonas: T[], bairro: string): T | null {
  const normalizar = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .trim()
      .toLowerCase();
  const alvo = normalizar(bairro);
  if (!alvo) return null;
  return zonas.find((z) => normalizar(z.bairro) === alvo) ?? null;
}
