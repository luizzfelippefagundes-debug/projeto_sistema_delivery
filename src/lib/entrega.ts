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

/** Endereço só com rua, número e bairro, pro Google Maps/Waze acharem o
 * lugar: o carrinho grava "Rua, 12 - complemento - Bairro (Ref: ...)" e o
 * complemento e a referência fazem a busca do mapa falhar. */
export function enderecoParaMapa(endereco: string): string {
  const semReferencia = endereco.replace(/\s*\(Ref:[\s\S]*\)\s*$/, "").trim();
  const partes = semReferencia.split(" - ");
  if (partes.length < 3) return semReferencia;
  return `${partes[0]} - ${partes[partes.length - 1]}`;
}
