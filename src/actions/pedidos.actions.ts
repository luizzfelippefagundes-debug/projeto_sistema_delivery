"use server";

import { auth } from "@clerk/nextjs/server";
import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "../db";
import { clientes, itensCardapio, itensPedido, pedidos, restaurantes, solicitacoesFechamento } from "../db/schema";
import { baixarEstoque } from "../db/queries/cardapio";
import { getConfiguracoes } from "../db/queries/configuracoes";
import { getZonasEntrega } from "../db/queries/entrega";
import { assertFuncionario } from "../lib/funcionarioAuth";
import { enviarMensagemWhatsapp } from "../lib/evolutionApi";
import { encontrarZona } from "../lib/entrega";
import { fmtBRL } from "../lib/data";
import { formatarCPF, validarCPF } from "../lib/cpf";
import { notificarNovoPedido } from "../lib/webPush";
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
  await baixarEstoque(itens.map((i) => ({ itemCardapioId: i.itemCardapioId, quantidade: i.quantidade })));
  await notificarNovoPedido(funcionario.restauranteId, ["cozinha"], {
    title: `Mesa ${mesa}`,
    body: `${itens.length} item(ns) · ${fmtBRL(total)}`,
    url: "/cozinha",
  });

  revalidatePath("/atendente");
  revalidatePath("/cozinha");
  revalidatePath("/dono/cardapio");
  revalidatePath("/dono/estoque");
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
  await getDb()
    .delete(solicitacoesFechamento)
    .where(and(eq(solicitacoesFechamento.restauranteId, funcionario.restauranteId), eq(solicitacoesFechamento.mesa, mesa)));
  revalidatePath("/atendente");
  revalidatePath("/cozinha");
  revalidatePath("/dono");
  revalidatePath("/dono/financeiro");
}

/** O próprio cliente, pelo QR code, avisando que quer fechar a conta —
 * não fecha nada sozinho (isso continua exigindo o atendente escolher a
 * forma de pagamento em `fecharMesaAction`), só liga o aviso na Comanda e
 * dispara push pra quem atende. */
export async function solicitarFechamentoMesa(restauranteId: string, mesa: number) {
  if (!Number.isInteger(mesa) || mesa < 1) throw new Error("Mesa inválida.");

  await getDb()
    .insert(solicitacoesFechamento)
    .values({ restauranteId, mesa })
    .onConflictDoUpdate({
      target: [solicitacoesFechamento.restauranteId, solicitacoesFechamento.mesa],
      set: { criadoEm: new Date() },
    });

  await notificarNovoPedido(restauranteId, ["atendente"], {
    title: `Mesa ${mesa} quer fechar a conta`,
    body: "Cliente pediu pra fechar — pode ir cobrar.",
    url: "/atendente",
  });

  revalidatePath("/atendente");
  revalidatePath("/cozinha");
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
  observacao?: string | null;
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
  await baixarEstoque(itensParaSalvar.map((i) => ({ itemCardapioId: i.itemCardapioId, quantidade: i.quantidade })));

  revalidatePath("/cozinha");
  revalidatePath("/motoboy");
  revalidatePath("/dono");
  revalidatePath("/dono/cardapio");
  revalidatePath("/dono/estoque");

  return { pedidoId: pedido.id, total };
}

/** Pedido feito pelo próprio cliente sentado à mesa, via QR code — sem
 * login, sem endereço, sem pagamento (isso continua na mão de quem fecha a
 * mesa depois). Mesma validação de preço/restaurante de `criarPedidoCliente`,
 * mas cai direto na cozinha com `origem: "salao"`, exatamente como se um
 * atendente tivesse digitado pela Comanda. */
export async function criarPedidoMesa(dados: {
  restauranteId: string;
  mesa: number;
  itens: ItemDoPedidoCliente[];
}) {
  if (dados.itens.length === 0) throw new Error("Sua sacola está vazia.");
  if (!Number.isInteger(dados.mesa) || dados.mesa < 1) throw new Error("Mesa inválida.");

  const config = await getConfiguracoes(dados.restauranteId);
  const numeroMesas = config?.numeroMesas ?? 8;
  if (dados.mesa > numeroMesas) throw new Error("Mesa inválida.");

  const db = getDb();
  const idsUnicos = dados.itens.map((i) => i.itemCardapioId);
  const itensDoCardapio = await db.select().from(itensCardapio).where(inArray(itensCardapio.id, idsUnicos));
  const porId = new Map(itensDoCardapio.map((i) => [i.id, i]));

  const itensParaSalvar = dados.itens.map((i) => {
    const item = porId.get(i.itemCardapioId);
    if (!item || item.restauranteId !== dados.restauranteId || !item.ativo) {
      throw new Error("Um dos itens da sacola não está mais disponível.");
    }
    return {
      itemCardapioId: item.id,
      nome: item.nome,
      preco: item.preco,
      quantidade: i.quantidade,
      observacao: i.observacao ?? null,
    };
  });

  const total = itensParaSalvar.reduce((s, i) => s + i.preco * i.quantidade, 0);

  const [pedido] = await db
    .insert(pedidos)
    .values({ restauranteId: dados.restauranteId, origem: "salao", mesa: dados.mesa, status: "novo", total })
    .returning();

  await db.insert(itensPedido).values(itensParaSalvar.map((i) => ({ pedidoId: pedido.id, ...i })));
  await baixarEstoque(itensParaSalvar.map((i) => ({ itemCardapioId: i.itemCardapioId, quantidade: i.quantidade })));
  await notificarNovoPedido(dados.restauranteId, ["cozinha", "atendente"], {
    title: `Mesa ${dados.mesa} pediu pelo QR Code`,
    body: `${itensParaSalvar.length} item(ns) · ${fmtBRL(total)}`,
    url: "/cozinha",
  });

  revalidatePath("/atendente");
  revalidatePath("/cozinha");
  revalidatePath("/dono/cardapio");
  revalidatePath("/dono/estoque");

  return { pedidoId: pedido.id };
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
  bairro?: string | null;
  telefone?: string;
  pagamento: Pagamento;
  clienteNome: string;
  cpfNota?: string | null;
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
    return {
      itemCardapioId: item.id,
      nome: item.nome,
      preco: item.preco,
      quantidade: i.quantidade,
      observacao: i.observacao ?? null,
    };
  });

  // A taxa nunca vem do navegador — recalculada aqui a partir do bairro
  // informado e das zonas cadastradas pela dona, igual à revalidação de
  // preço dos itens logo acima.
  let taxaEntrega: number | null = null;
  if (dados.bairro?.trim()) {
    const zonas = await getZonasEntrega(dados.restauranteId);
    taxaEntrega = encontrarZona(zonas, dados.bairro)?.taxaEntrega ?? null;
  }

  const total = itensParaSalvar.reduce((s, i) => s + i.preco * i.quantidade, 0) + (taxaEntrega ?? 0);
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
      taxaEntrega,
      cpfNota: dados.cpfNota && validarCPF(dados.cpfNota) ? formatarCPF(dados.cpfNota) : null,
      total,
    })
    .returning();

  await db.insert(itensPedido).values(itensParaSalvar.map((i) => ({ pedidoId: pedido.id, ...i })));
  await baixarEstoque(itensParaSalvar.map((i) => ({ itemCardapioId: i.itemCardapioId, quantidade: i.quantidade })));
  await notificarNovoPedido(dados.restauranteId, ["cozinha", "atendente"], {
    title: "Novo pedido pelo site!",
    body: `${nomeLimpo} · ${fmtBRL(total)}`,
    url: "/cozinha",
  });

  revalidatePath("/cozinha");
  revalidatePath("/motoboy");
  revalidatePath("/dono");
  revalidatePath("/dono/cardapio");
  revalidatePath("/dono/estoque");

  return { pedidoId: pedido.id };
}
