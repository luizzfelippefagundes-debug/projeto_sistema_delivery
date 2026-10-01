"use server";

import { randomUUID } from "node:crypto";
import { del, put } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "../db";
import { itensCardapio } from "../db/schema";
import { ajustarEstoque, definirOpcoesCombo } from "../db/queries/cardapio";
import { assertFuncionario } from "../lib/funcionarioAuth";
import { registrarAtividade } from "../db/queries/atividades";

const TAMANHO_MAX_IMAGEM_DATA_URL = 1_500_000;

function ehUrlDeFotoValida(url: string) {
  return url.startsWith("https://") && url.includes(".public.blob.vercel-storage.com/");
}

function validarImagem(imagemUrl?: string | null) {
  if (!imagemUrl) return null;
  if (!ehUrlDeFotoValida(imagemUrl)) {
    throw new Error("Imagem inválida — envie a foto pelo campo de upload.");
  }
  return imagemUrl;
}

/** Recebe a foto já redimensionada/comprimida pelo navegador (como data URL)
 * e sobe pro Vercel Blob, devolvendo a URL pública. As fotos ficavam salvas
 * como base64 direto no banco antes — cada carregamento do cardápio reenviava
 * todas elas inteiras dentro do HTML (chegava a 16MB a página), sem
 * aproveitar cache do navegador. Como arquivo com URL própria, o navegador
 * baixa cada foto uma vez só. */
export async function uploadFotoItem(dataUrl: string): Promise<string> {
  const dono = await assertFuncionario("dono");
  if (!dataUrl.startsWith("data:image/") || dataUrl.length > TAMANHO_MAX_IMAGEM_DATA_URL) {
    throw new Error("Imagem inválida ou grande demais.");
  }
  const match = /^data:(image\/\w+);base64,(.+)$/.exec(dataUrl);
  if (!match) throw new Error("Imagem inválida.");
  const [, tipo, base64] = match;
  const extensao = tipo.split("/")[1] ?? "jpg";
  const blob = await put(`cardapio/${dono.restauranteId}/${randomUUID()}.${extensao}`, Buffer.from(base64, "base64"), {
    access: "public",
    contentType: tipo,
  });
  return blob.url;
}

async function removerFotoAntiga(itemId: string, novaUrl: string | null) {
  const [atual] = await getDb()
    .select({ imagemUrl: itensCardapio.imagemUrl })
    .from(itensCardapio)
    .where(eq(itensCardapio.id, itemId));
  if (atual?.imagemUrl && atual.imagemUrl !== novaUrl && ehUrlDeFotoValida(atual.imagemUrl)) {
    await del(atual.imagemUrl).catch(() => {});
  }
}

export async function criarItemCardapio(dados: {
  nome: string;
  categoria: string;
  descricao?: string | null;
  preco: number;
  imagemUrl?: string | null;
  estoqueAtual?: number | null;
  estoqueMinimo?: number | null;
  qtdPecasEscolha?: number | null;
  opcoes?: { nome: string; limiteQuantidade: number | null }[];
}) {
  const dono = await assertFuncionario("dono");
  if (!dados.nome.trim() || !dados.categoria.trim() || dados.preco <= 0) {
    throw new Error("Preencha nome, categoria e um preço válido.");
  }
  if (dados.qtdPecasEscolha != null && dados.qtdPecasEscolha <= 0) {
    throw new Error("A quantidade de peças do combo precisa ser maior que zero.");
  }
  const [item] = await getDb()
    .insert(itensCardapio)
    .values({
      restauranteId: dono.restauranteId,
      nome: dados.nome.trim(),
      categoria: dados.categoria.trim(),
      descricao: dados.descricao?.trim() || null,
      preco: dados.preco,
      imagemUrl: validarImagem(dados.imagemUrl),
      estoqueAtual: dados.estoqueAtual ?? null,
      estoqueMinimo: dados.estoqueAtual != null ? (dados.estoqueMinimo ?? 5) : null,
      qtdPecasEscolha: dados.qtdPecasEscolha ?? null,
    })
    .returning();
  if (dados.qtdPecasEscolha != null) {
    await definirOpcoesCombo(item.id, dados.opcoes ?? []);
  }
  await registrarAtividade({
    restauranteId: dono.restauranteId,
    funcionarioId: dono.id,
    nomeFuncionario: dono.nome,
    acao: "Criou item no cardápio",
    detalhe: dados.nome.trim(),
  });
  revalidatePath("/dono/cardapio");
  revalidatePath("/");
}

export async function atualizarItemCardapio(
  id: string,
  dados: {
    nome: string;
    categoria: string;
    descricao?: string | null;
    preco: number;
    imagemUrl?: string | null;
    estoqueAtual?: number | null;
    estoqueMinimo?: number | null;
    qtdPecasEscolha?: number | null;
    opcoes?: { nome: string; limiteQuantidade: number | null }[];
  },
) {
  const dono = await assertFuncionario("dono");
  if (!dados.nome.trim() || !dados.categoria.trim() || dados.preco <= 0) {
    throw new Error("Preencha nome, categoria e um preço válido.");
  }
  if (dados.qtdPecasEscolha != null && dados.qtdPecasEscolha <= 0) {
    throw new Error("A quantidade de peças do combo precisa ser maior que zero.");
  }
  const novaImagemUrl = validarImagem(dados.imagemUrl);
  await removerFotoAntiga(id, novaImagemUrl);
  await getDb()
    .update(itensCardapio)
    .set({
      nome: dados.nome.trim(),
      categoria: dados.categoria.trim(),
      descricao: dados.descricao?.trim() || null,
      preco: dados.preco,
      imagemUrl: novaImagemUrl,
      estoqueAtual: dados.estoqueAtual ?? null,
      estoqueMinimo: dados.estoqueAtual != null ? (dados.estoqueMinimo ?? 5) : null,
      qtdPecasEscolha: dados.qtdPecasEscolha ?? null,
    })
    .where(eq(itensCardapio.id, id));
  await definirOpcoesCombo(id, dados.qtdPecasEscolha != null ? (dados.opcoes ?? []) : []);
  await registrarAtividade({
    restauranteId: dono.restauranteId,
    funcionarioId: dono.id,
    nomeFuncionario: dono.nome,
    acao: "Editou item do cardápio",
    detalhe: dados.nome.trim(),
  });
  revalidatePath("/dono/cardapio");
  revalidatePath("/");
}

export async function ajustarEstoqueAction(id: string, delta: number) {
  const dono = await assertFuncionario("dono");
  const atualizado = await ajustarEstoque(id, delta);
  if (atualizado) {
    await registrarAtividade({
      restauranteId: dono.restauranteId,
      funcionarioId: dono.id,
      nomeFuncionario: dono.nome,
      acao: delta > 0 ? "Repôs estoque" : "Ajustou estoque",
      detalhe: `${atualizado.nome} — ${delta > 0 ? "+" : ""}${delta} (agora: ${atualizado.estoqueAtual})`,
    });
  }
  revalidatePath("/dono/cardapio");
  revalidatePath("/dono/estoque");
}

/** Liga o controle de estoque de um item que já existe no cardápio — não
 * cria item novo, só passa a descontar/travar esse aqui a partir de
 * agora. */
export async function ativarControleEstoque(itemId: string, estoqueInicial: number, estoqueMinimo: number) {
  const dono = await assertFuncionario("dono");
  if (estoqueInicial < 0 || estoqueMinimo < 0) throw new Error("Os valores não podem ser negativos.");
  const [item] = await getDb()
    .update(itensCardapio)
    .set({ estoqueAtual: Math.round(estoqueInicial), estoqueMinimo: Math.round(estoqueMinimo) })
    .where(eq(itensCardapio.id, itemId))
    .returning();
  if (item) {
    await registrarAtividade({
      restauranteId: dono.restauranteId,
      funcionarioId: dono.id,
      nomeFuncionario: dono.nome,
      acao: "Ligou controle de estoque",
      detalhe: `${item.nome} — ${estoqueInicial} un.`,
    });
  }
  revalidatePath("/dono/estoque");
  revalidatePath("/dono/cardapio");
}

/** Desliga o controle de estoque — o item continua no cardápio normalmente
 * (visível, vendável), só para de aparecer/descontar aqui. */
export async function removerControleEstoque(itemId: string) {
  const dono = await assertFuncionario("dono");
  const [item] = await getDb()
    .update(itensCardapio)
    .set({ estoqueAtual: null, estoqueMinimo: null })
    .where(eq(itensCardapio.id, itemId))
    .returning();
  if (item) {
    await registrarAtividade({
      restauranteId: dono.restauranteId,
      funcionarioId: dono.id,
      nomeFuncionario: dono.nome,
      acao: "Desligou controle de estoque",
      detalhe: item.nome,
    });
  }
  revalidatePath("/dono/estoque");
  revalidatePath("/dono/cardapio");
}

export async function alternarAtivoItemCardapio(id: string, ativo: boolean) {
  const dono = await assertFuncionario("dono");
  const [alvo] = await getDb().update(itensCardapio).set({ ativo }).where(eq(itensCardapio.id, id)).returning();
  if (alvo) {
    await registrarAtividade({
      restauranteId: dono.restauranteId,
      funcionarioId: dono.id,
      nomeFuncionario: dono.nome,
      acao: ativo ? "Reativou item do cardápio" : "Pausou item do cardápio",
      detalhe: alvo.nome,
    });
  }
  revalidatePath("/dono/cardapio");
  revalidatePath("/");
}
