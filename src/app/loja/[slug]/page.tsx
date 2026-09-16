import { notFound } from "next/navigation";
import CardapioClient, { type ItemDoCardapio } from "@/components/CardapioClient";
import { getItensCardapioAtivos } from "@/db/queries/cardapio";
import { getRestaurantePorSlug } from "@/db/queries/restaurantes";

export const dynamic = "force-dynamic";

export default async function LojaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const restaurante = await getRestaurantePorSlug(slug);
  if (!restaurante) notFound();

  const itens = await getItensCardapioAtivos(restaurante.id);

  const itensPorCategoria: Record<string, ItemDoCardapio[]> = {};
  for (const item of itens) {
    (itensPorCategoria[item.categoria] ??= []).push({
      id: item.id,
      nome: item.nome,
      descricao: item.descricao,
      preco: item.preco,
      imagemUrl: item.imagemUrl,
    });
  }

  return (
    <CardapioClient
      restauranteId={restaurante.id}
      nomeRestaurante={restaurante.nome}
      itensPorCategoria={itensPorCategoria}
    />
  );
}
