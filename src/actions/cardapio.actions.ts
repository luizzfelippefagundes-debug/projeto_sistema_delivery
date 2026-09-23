"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "../db";
import { itensCardapio } from "../db/schema";
import { ajustarEstoque, definirOpcoesCombo } from "../db/queries/cardapio";
import { assertFuncionario } from "../lib/funcionarioAuth";
import { registrarAtividade } from "../db/queries/atividades";

const TAMANHO_MAX_IMAGEM = 1_500_000;

function validarImagem(imagemUrl?: string | null) {
  if (!imagemUrl) return null;
  if (!imagemUrl.startsWith("data:image/") || imagemUrl.length > TAMANHO_MAX_IMAGEM) {
    throw new Error("Imagem inválida ou grande demais.");
  }
  return imagemUrl;
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
  opcoes?: string[];
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
    opcoes?: string[];
  },
) {
  const dono = await assertFuncionario("dono");
  if (!dados.nome.trim() || !dados.categoria.trim() || dados.preco <= 0) {
    throw new Error("Preencha nome, categoria e um preço válido.");
  }
  if (dados.qtdPecasEscolha != null && dados.qtdPecasEscolha <= 0) {
    throw new Error("A quantidade de peças do combo precisa ser maior que zero.");
  }
  await getDb()
    .update(itensCardapio)
    .set({
      nome: dados.nome.trim(),
      categoria: dados.categoria.trim(),
      descricao: dados.descricao?.trim() || null,
      preco: dados.preco,
      imagemUrl: validarImagem(dados.imagemUrl),
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
