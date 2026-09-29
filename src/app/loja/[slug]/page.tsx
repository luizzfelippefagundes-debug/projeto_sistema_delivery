import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CardapioClient, { type ItemDoCardapio } from "@/components/CardapioClient";
import { getItensCardapioAtivos, getOpcoesComboPorItens } from "@/db/queries/cardapio";
import { getConfiguracoes } from "@/db/queries/configuracoes";
import { getZonasEntrega } from "@/db/queries/entrega";
import { getRestaurantePorSlug } from "@/db/queries/restaurantes";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const restaurante = await getRestaurantePorSlug(slug);
  if (!restaurante) return {};

  const titulo = `${restaurante.nome} — Cardápio Online, Delivery e Pedido pela Mesa`;
  const descricao = `Peça no ${restaurante.nome} pelo cardápio digital: delivery, retirada ou direto da mesa pelo QR code. Veja os pratos e preços agora.`;

  return {
    title: titulo,
    description: descricao,
    alternates: { canonical: `/loja/${restaurante.slug}` },
    openGraph: {
      title: titulo,
      description: descricao,
      url: `/loja/${restaurante.slug}`,
      type: "website",
      images: ["/logo-icon.png"],
    },
  };
}

export default async function LojaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const restaurante = await getRestaurantePorSlug(slug);
  if (!restaurante) notFound();

  const [itens, zonas, config] = await Promise.all([
    getItensCardapioAtivos(restaurante.id),
    getZonasEntrega(restaurante.id),
    getConfiguracoes(restaurante.id),
  ]);
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
      zonasEntrega={zonas.map((z) => ({ bairro: z.bairro, taxaEntrega: z.taxaEntrega, tempoEstimadoMin: z.tempoEstimadoMin }))}
      enderecoLoja={config?.enderecoLoja ?? null}
    />
  );
}
