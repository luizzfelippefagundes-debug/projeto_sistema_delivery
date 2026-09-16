"use server";

import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { configuracoes, funcionarios, restaurantes } from "../db/schema";
import { getFuncionarioByClerkId } from "../db/queries/funcionarios";
import { slugify } from "../lib/slug";

async function gerarSlugUnico(nome: string): Promise<string> {
  const base = slugify(nome) || "restaurante";
  const db = getDb();
  let slug = base;
  let tentativa = 1;
  while (true) {
    const existente = await db.select().from(restaurantes).where(eq(restaurantes.slug, slug)).limit(1);
    if (existente.length === 0) return slug;
    tentativa += 1;
    slug = `${base}-${tentativa}`;
  }
}

/** Onboarding self-service: qualquer pessoa autenticada que ainda não é
 * funcionária de nenhum restaurante pode criar o próprio restaurante e já
 * nasce dona dele. Convites de atendente/cozinha/motoboy continuam
 * exigindo cadastro manual da dona — só a criação de um restaurante novo é
 * self-service. */
export async function criarRestauranteEDono(dados: { nomeRestaurante: string; nomeDono: string }) {
  const { userId } = await auth();
  if (!userId) throw new Error("Não autenticado");

  const jaExiste = await getFuncionarioByClerkId(userId);
  if (jaExiste) throw new Error("Essa conta já está vinculada a um restaurante.");

  if (!dados.nomeRestaurante.trim() || !dados.nomeDono.trim()) {
    throw new Error("Preencha o nome do restaurante e o seu nome.");
  }

  const slug = await gerarSlugUnico(dados.nomeRestaurante);
  const db = getDb();

  const [restaurante] = await db
    .insert(restaurantes)
    .values({ nome: dados.nomeRestaurante.trim(), slug })
    .returning();

  await db.insert(funcionarios).values({
    restauranteId: restaurante.id,
    clerkUserId: userId,
    nome: dados.nomeDono.trim(),
    papel: "dono",
  });

  await db.insert(configuracoes).values({ restauranteId: restaurante.id });

  return { slug: restaurante.slug };
}
