import { notFound } from "next/navigation";
import CardapioClient, { type ItemDoCardapio } from "@/components/CardapioClient";
import { getItensCardapioAtivos, getOpcoesComboPorItens } from "@/db/queries/cardapio";
import { getZonasEntrega } from "@/db/queries/entrega";
import { getRestaurantePorSlug } from "@/db/queries/restaurantes";

export const dynamic = "force-dynamic";

export default async function LojaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const restaurante = await getRestaurantePorSlug(slug);
  if (!restaurante) notFound();

  const itens = await getItensCardapioAtivos(restaurante.id);
  const opcoesMapa = await getOpcoesComboPorItens(itens.map((i) => i.id));
  const zonas = await getZonasEntrega(restaurante.id);

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
      zonasEntrega={zonas.map((z) => ({ bairro: z.bairro, taxaEntrega: z.taxaEntrega, tempoEstimadoMin: z.tempoEstimadoMin }))}
    />
  );
}
