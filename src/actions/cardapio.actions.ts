"use server";

import { put, del } from "@vercel/blob";
import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "../db";
import { banners, itensCardapio, opcoesCombo } from "../db/schema";
import { assertFuncionario } from "../lib/funcionarioAuth";

async function base64ParaBlob(base64: string, pasta: string, restauranteId: string): Promise<string> {
  const match = base64.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
  if (!match) throw new Error("Formato de imagem inválido");
  const tipo = match[1];
  const buffer = Buffer.from(match[2], "base64");
  const ext = tipo.split("/")[1] ?? "jpg";
  const { url } = await put(`${pasta}/${restauranteId}/${Date.now()}.${ext}`, buffer, {
    access: "public",
    contentType: tipo,
  });
  return url;
}

export async function uploadFotoItem(base64: string): Promise<string> {
  const funcionario = await assertFuncionario("dono");
  return base64ParaBlob(base64, "cardapio", funcionario.restauranteId);
}

export async function adicionarBanner(base64: string, linkUrl?: string) {
  const funcionario = await assertFuncionario("dono");
  const imagemUrl = await base64ParaBlob(base64, "banners", funcionario.restauranteId);

  const existentes = await getDb()
    .select({ ordem: banners.ordem })
    .from(banners)
    .where(eq(banners.restauranteId, funcionario.restauranteId));
  const proximaOrdem = existentes.length > 0 ? Math.max(...existentes.map((b) => b.ordem)) + 1 : 0;

  await getDb().insert(banners).values({
    restauranteId: funcionario.restauranteId,
    imagemUrl,
    linkUrl: linkUrl || null,
    ordem: proximaOrdem,
  });

  revalidatePath("/dono/banners");
  revalidatePath(`/loja`);
}

export async function removerBanner(id: string) {
  const funcionario = await assertFuncionario("dono");
  const [banner] = await getDb()
    .select()
    .from(banners)
    .where(and(eq(banners.id, id), eq(banners.restauranteId, funcionario.restauranteId)))
    .limit(1);
  if (!banner) return;

  await del(banner.imagemUrl);
  await getDb()
    .delete(banners)
    .where(and(eq(banners.id, id), eq(banners.restauranteId, funcionario.restauranteId)));

  revalidatePath("/dono/banners");
  revalidatePath(`/loja`);
}

export async function setSaborDisponivel(nome: string, disponivel: boolean) {
  const funcionario = await assertFuncionario("dono");

  // Buscar todos os itens do restaurante que têm combo
  const itens = await getDb()
    .select({ id: itensCardapio.id })
    .from(itensCardapio)
    .where(eq(itensCardapio.restauranteId, funcionario.restauranteId));

  const itemIds = itens.map((i) => i.id);
  if (itemIds.length === 0) return;

  await getDb()
    .update(opcoesCombo)
    .set({ disponivel })
    .where(and(inArray(opcoesCombo.itemCardapioId, itemIds), eq(opcoesCombo.nome, nome)));

  revalidatePath("/dono/sabores");
  revalidatePath(`/loja`);
}
