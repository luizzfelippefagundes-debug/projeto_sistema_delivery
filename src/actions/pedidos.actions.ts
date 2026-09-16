"use server";

import { auth } from "@clerk/nextjs/server";
import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "../db";
import { clientes, itensCardapio, itensPedido, pedidos, restaurantes } from "../db/schema";
import { assertFuncionario } from "../lib/funcionarioAuth";
import { enviarMensagemWhatsapp } from "../lib/evolutionApi";
import type { OrderStatus, Pagamento } from "../lib/types";

export interface ItemParaEnviar {
  itemCardapioId: string;
  nome: string;
  preco: number;
  quantidade: number;
}

const STATUS_MESA_ABERTA: OrderStatus[] = ["novo", "preparo", "pronto"];

export async function enviarComandaParaCozinha(mesa: number, itens: ItemParaEnviar[]) {
  const funcionario = await assertFuncionario("atendente");
  if (itens.length === 0) throw new Error("Adicione pelo menos um item antes de enviar.");

  const db = getDb();
  const total = itens.reduce((s, i) => s + i.preco * i.quantidade, 0);
  const [pedido] = await db
    .insert(pedidos)
    .values({ restauranteId: funcionario.restauranteId, origem: "salao", mesa, status: "novo", total })
    .returning();

  await db.insert(itensPedido).values(
    itens.map((i) => ({
      pedidoId: pedido.id,
      itemCardapioId: i.itemCardapioId,
      nome: i.nome,
      preco: i.preco,
      quantidade: i.quantidade,
    })),
  );

  revalidatePath("/atendente");
  revalidatePath("/cozinha");
}

export async function fecharMesaAction(mesa: number, pagamento: Pagamento) {
  const funcionario = await assertFuncionario("atendente");
  await getDb()
    .update(pedidos)
    .set({ status: "finalizado", formaPagamento: pagamento })
    .where(
      and(
        eq(pedidos.restauranteId, funcionario.restauranteId),
        eq(pedidos.origem, "salao"),
        eq(pedidos.mesa, mesa),
        inArray(pedidos.status, STATUS_MESA_ABERTA),
      ),
    );
  revalidatePath("/atendente");
  revalidatePath("/dono");
  revalidatePath("/dono/financeiro");
}

export async function avancarStatusCozinha(pedidoId: string, novoStatus: OrderStatus) {
  const funcionario = await assertFuncionario("cozinha");
  await getDb()
    .update(pedidos)
    .set({ status: novoStatus })
    .where(and(eq(pedidos.id, pedidoId), eq(pedidos.restauranteId, funcionario.restauranteId)));
  revalidatePath("/cozinha");
  revalidatePath("/atendente");
  revalidatePath("/motoboy");
  revalidatePath("/dono");
}

export async function avancarStatusEntrega(pedidoId: string, novoStatus: OrderStatus) {
  const funcionario = await assertFuncionario("motoboy");
  const [pedido] = await getDb()
    .update(pedidos)
    .set({
      status: novoStatus,
      ...(novoStatus === "rota" ? { entregadorId: funcionario.id } : {}),
    })
    .where(and(eq(pedidos.id, pedidoId), eq(pedidos.restauranteId, funcionario.restauranteId)))
    .returning();
  revalidatePath("/motoboy");
  revalidatePath("/dono");

  if (pedido?.telefoneCliente && (novoStatus === "rota" || novoStatus === "entregue")) {
    const [restaurante] = await getDb().select().from(restaurantes).where(eq(restaurantes.id, funcionario.restauranteId));
    if (restaurante?.instanciaWhatsapp) {
      const texto =
        novoStatus === "rota"
          ? "🛵 Seu pedido saiu pra entrega! Chegada estimada: 20 a 30 minutos."
          : "✅ Pedido entregue! Bom apetite 🍣 Obrigado pela preferência.";
      await enviarMensagemWhatsapp(restaurante.instanciaWhatsapp, pedido.telefoneCliente, texto).catch((e) =>
        console.error("[whatsapp] falha ao notificar entrega:", e),
      );
    }
  }
}

export interface ItemDoPedidoCliente {
  itemCardapioId: string;
  quantidade: number;
}

/** Mesma lógica de revalidação de preço que criarPedidoCliente, só que pro
 * pedido que veio do bot do WhatsApp — identifica o cliente pelo telefone
 * (telefoneCliente), não por conta logada, porque quem manda mensagem no
 * WhatsApp nunca passou pelo Clerk. */
export async function criarPedidoWhatsapp(dados: {
  restauranteId: string;
  telefoneCliente: string;
  itens: ItemDoPedidoCliente[];
  endereco: string;
  pagamento: Pagamento;
}) {
  if (dados.itens.length === 0) throw new Error("Sacola vazia.");

  const db = getDb();
  const idsUnicos = dados.itens.map((i) => i.itemCardapioId);
  const itensDoCardapio = await db.select().from(itensCardapio).where(inArray(itensCardapio.id, idsUnicos));
  const porId = new Map(itensDoCardapio.map((i) => [i.id, i]));

  const itensParaSalvar = dados.itens.map((i) => {
    const item = porId.get(i.itemCardapioId);
    if (!item || item.restauranteId !== dados.restauranteId || !item.ativo) {
      throw new Error("Um dos itens não está mais disponível.");
    }
    return { itemCardapioId: item.id, nome: item.nome, preco: item.preco, quantidade: i.quantidade };
  });

  const total = itensParaSalvar.reduce((s, i) => s + i.preco * i.quantidade, 0);

  const [pedido] = await db
    .insert(pedidos)
    .values({
      restauranteId: dados.restauranteId,
      origem: "delivery",
      clienteNome: `WhatsApp ${dados.telefoneCliente}`,
      telefoneCliente: dados.telefoneCliente,
      endereco: dados.endereco,
      status: "novo",
      formaPagamento: dados.pagamento,
      total,
    })
    .returning();

  await db.insert(itensPedido).values(itensParaSalvar.map((i) => ({ pedidoId: pedido.id, ...i })));

  revalidatePath("/cozinha");
  revalidatePath("/motoboy");
  revalidatePath("/dono");

  return { pedidoId: pedido.id, total };
}

/** Endpoint público (cliente não é funcionário) — por isso o preço de cada
 * item é buscado de novo no cardápio aqui dentro, nunca confiado no que o
 * navegador mandou. Também confere que cada item realmente pertence ao
 * restaurante informado, pra um pedido não conseguir "vazar" item de
 * outro restaurante. */
export async function criarPedidoCliente(dados: {
  restauranteId: string;
  itens: ItemDoPedidoCliente[];
  endereco: string;
  telefone?: string;
  pagamento: Pagamento;
  clienteNome: string;
}) {
  if (dados.itens.length === 0) throw new Error("Sua sacola está vazia.");

  const db = getDb();
  const idsUnicos = dados.itens.map((i) => i.itemCardapioId);
  const itensDoCardapio = await db.select().from(itensCardapio).where(inArray(itensCardapio.id, idsUnicos));
  const porId = new Map(itensDoCardapio.map((i) => [i.id, i]));

  const itensParaSalvar = dados.itens.map((i) => {
    const item = porId.get(i.itemCardapioId);
    if (!item || item.restauranteId !== dados.restauranteId || !item.ativo) {
      throw new Error("Um dos itens da sacola não está mais disponível.");
    }
    return { itemCardapioId: item.id, nome: item.nome, preco: item.preco, quantidade: i.quantidade };
  });

  const total = itensParaSalvar.reduce((s, i) => s + i.preco * i.quantidade, 0);
  const nomeLimpo = dados.clienteNome.trim();
  const telefoneLimpo = dados.telefone?.trim() || null;

  // Liga o pedido à conta do cliente (se logado) — é o que permite a tela
  // "Meus pedidos" e o acompanhamento depois, sem depender só do nome pra
  // achar o histórico dele.
  const { userId } = await auth();
  let clienteId: string | null = null;
  if (userId) {
    const [existente] = await db.select().from(clientes).where(eq(clientes.clerkUserId, userId));
    if (existente) {
      clienteId = existente.id;
      await db
        .update(clientes)
        .set({ nome: nomeLimpo, telefone: telefoneLimpo ?? existente.telefone })
        .where(eq(clientes.id, existente.id));
    } else {
      const [novo] = await db
        .insert(clientes)
        .values({ restauranteId: dados.restauranteId, clerkUserId: userId, nome: nomeLimpo, telefone: telefoneLimpo })
        .returning();
      clienteId = novo.id;
    }
  }

  const [pedido] = await db
    .insert(pedidos)
    .values({
      restauranteId: dados.restauranteId,
      origem: "delivery",
      clienteId,
      clienteNome: nomeLimpo,
      telefoneCliente: telefoneLimpo,
      endereco: dados.endereco,
      status: "novo",
      formaPagamento: dados.pagamento,
      total,
    })
    .returning();

  await db.insert(itensPedido).values(itensParaSalvar.map((i) => ({ pedidoId: pedido.id, ...i })));

  revalidatePath("/cozinha");
  revalidatePath("/motoboy");
  revalidatePath("/dono");

  return { pedidoId: pedido.id };
}
