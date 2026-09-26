import { notFound } from "next/navigation";
import CardapioClient, { type ItemDoCardapio } from "@/components/CardapioClient";
import { getItensCardapioAtivos, getOpcoesComboPorItens } from "@/db/queries/cardapio";
import { getConfiguracoes } from "@/db/queries/configuracoes";
import { getRestaurantePorSlug } from "@/db/queries/restaurantes";

export const dynamic = "force-dynamic";

/** Cardápio aberto direto de um QR code na mesa — mesma tela de sempre, só
 * que sem etapa de entrega/pagamento: o pedido cai direto na cozinha da
 * mesa, igual se um atendente tivesse digitado (ver criarPedidoMesa). */
export default async function LojaMesaPage({
  params,
}: {
  params: Promise<{ slug: string; numero: string }>;
}) {
  const { slug, numero } = await params;
  const mesa = Number(numero);
  if (!Number.isInteger(mesa) || mesa < 1) notFound();

  const restaurante = await getRestaurantePorSlug(slug);
  if (!restaurante) notFound();

  const config = await getConfiguracoes(restaurante.id);
  const numeroMesas = config?.numeroMesas ?? 8;
  if (mesa > numeroMesas) notFound();

  const itens = await getItensCardapioAtivos(restaurante.id);
  const opcoesMapa = await getOpcoesComboPorItens(itens.map((i) => i.id));

  const itensPorCategoria: Record<string, ItemDoCardapio[]> = {};
  for (const item of itens) {
    (itensPorCategoria[item.categoria] ??= []).push({
      id: item.id,
      nome: item.nome,
      descricao: item.descricao,
      preco: item.preco,
      imagemUrl: item.imagemUrl,
      qtdPecasEscolha: item.qtdPecasEscolha,
      opcoes: opcoesMapa.get(item.id) ?? [],
    });
  }

  return (
    <CardapioClient
      restauranteId={restaurante.id}
      slug={restaurante.slug}
      nomeRestaurante={restaurante.nome}
      itensPorCategoria={itensPorCategoria}
      zonasEntrega={[]}
      enderecoLoja={null}
      mesa={mesa}
    />
  );
}
