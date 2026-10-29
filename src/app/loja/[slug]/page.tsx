import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CardapioClient, { type ItemDoCardapio } from "@/components/CardapioClient";
import { getBannersAtivos } from "@/db/queries/banners";
import { buscarTaxaCartaoAsaas, pagamentoOnlineAtivo } from "@/lib/asaas";
import { pixInterAtivo } from "@/lib/inter";
import { getItensCardapioAtivos, getMaisVendidos, getOpcoesComboPorItens } from "@/db/queries/cardapio";
import { getConfiguracoes } from "@/db/queries/configuracoes";
import { getZonasEntrega } from "@/db/queries/entrega";
import { getFuncionarioByClerkId } from "@/db/queries/funcionarios";
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

  const { userId } = await auth();
  const [itens, zonas, config, funcionario, banners, maisVendidosDB] = await Promise.all([
    getItensCardapioAtivos(restaurante.id),
    getZonasEntrega(restaurante.id),
    getConfiguracoes(restaurante.id),
    userId ? getFuncionarioByClerkId(userId) : null,
    getBannersAtivos(restaurante.id),
    getMaisVendidos(restaurante.id, 10),
  ]);
  const opcoesMapa = await getOpcoesComboPorItens(itens.map((i) => i.id));
  const maisPedidos = maisVendidosDB.map((item) => ({
    id: item.id,
    nome: item.nome,
    descricao: item.descricao,
    preco: item.preco,
    imagemUrl: item.imagemUrl,
    qtdPecasEscolha: item.qtdPecasEscolha,
    escolhaLivre: item.escolhaLivre,
    opcoes: opcoesMapa.get(item.id) ?? [],
  }));
  const online = pagamentoOnlineAtivo();
  // Cartão sempre na maquininha (entrega); só Pix vai online pelo Asaas.
  const soPixOnline = online || pixInterAtivo();
  const taxaCartaoOnline = null;
  const itensPorCategoria: Record<string, ItemDoCardapio[]> = {};
  for (const item of itens) {
    (itensPorCategoria[item.categoria] ??= []).push({
      id: item.id,
      nome: item.nome,
      descricao: item.descricao,
      preco: item.preco,
      imagemUrl: item.imagemUrl,
      qtdPecasEscolha: item.qtdPecasEscolha,
      escolhaLivre: item.escolhaLivre,
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
      taxasMaquininha={{
        taxaPix: config?.taxaPix ?? 0,
        taxaDebito: config?.taxaDebito ?? 1.39,
        taxaCreditoVista: config?.taxaCreditoVista ?? 3.34,
        taxaCredito2x: config?.taxaCredito2x ?? 7.29,
        taxaCredito3x: config?.taxaCredito3x ?? 8.35,
        taxaCredito4x: config?.taxaCredito4x ?? 9.23,
      }}
      bannersDona={banners.map((b) => ({ id: b.id, imagemUrl: b.imagemUrl, linkUrl: b.linkUrl, titulo: b.titulo, itens: b.itens }))}
      souDona={funcionario?.papel === "dono" && funcionario.restauranteId === restaurante.id}
      horarios={config?.horarios ?? null}
      pagamentoOnline={online}
      soPixOnline={soPixOnline}
      taxaCartaoOnline={taxaCartaoOnline}
      maisPedidos={maisPedidos}
    />
  );
}
