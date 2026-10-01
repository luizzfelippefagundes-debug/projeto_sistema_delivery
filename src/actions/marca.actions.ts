"use server";

import { randomUUID } from "node:crypto";
import { put } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "../db";
import { restaurantes } from "../db/schema";
import { assertFuncionario } from "../lib/funcionarioAuth";
import { registrarAtividade } from "../db/queries/atividades";

const TAMANHO_MAX_LOGO_DATA_URL = 1_500_000;
const HEX_COR_REGEX = /^#[0-9a-fA-F]{6}$/;

/** Sobe a logo (já redimensionada/comprimida no navegador) pro Vercel Blob
 * e devolve a URL pública — mesmo padrão de `uploadFotoItem` em
 * cardapio.actions.ts. */
export async function uploadLogoRestaurante(dataUrl: string): Promise<string> {
  const dono = await assertFuncionario("dono");
  if (!dataUrl.startsWith("data:image/") || dataUrl.length > TAMANHO_MAX_LOGO_DATA_URL) {
    throw new Error("Imagem inválida ou grande demais.");
  }
  const match = /^data:(image\/\w+);base64,(.+)$/.exec(dataUrl);
  if (!match) throw new Error("Imagem inválida.");
  const [, tipo, base64] = match;
  const extensao = tipo.split("/")[1] ?? "png";
  const blob = await put(`marca/${dono.restauranteId}/${randomUUID()}.${extensao}`, Buffer.from(base64, "base64"), {
    access: "public",
    contentType: tipo,
  });
  return blob.url;
}

export async function atualizarMarcaRestaurante(dados: { logoUrl: string | null; corPrimaria: string | null }) {
  const dono = await assertFuncionario("dono");
  if (dados.corPrimaria != null && !HEX_COR_REGEX.test(dados.corPrimaria)) {
    throw new Error("Cor inválida — use o seletor de cor.");
  }

  const [atual] = await getDb().select({ logoUrl: restaurantes.logoUrl }).from(restaurantes).where(eq(restaurantes.id, dono.restauranteId));
  if (atual?.logoUrl && atual.logoUrl !== dados.logoUrl && atual.logoUrl.includes(".public.blob.vercel-storage.com/")) {
    const { del } = await import("@vercel/blob");
    await del(atual.logoUrl).catch(() => {});
  }

  await getDb()
    .update(restaurantes)
    .set({ logoUrl: dados.logoUrl, corPrimaria: dados.corPrimaria })
    .where(eq(restaurantes.id, dono.restauranteId));

  await registrarAtividade({
    restauranteId: dono.restauranteId,
    funcionarioId: dono.id,
    nomeFuncionario: dono.nome,
    acao: "Atualizou marca do restaurante",
  });

  revalidatePath("/", "layout");
}
