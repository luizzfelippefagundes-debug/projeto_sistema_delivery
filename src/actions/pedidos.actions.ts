"use server";

import { auth } from "@clerk/nextjs/server";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "../db";
import { clientes, itensCardapio, itensPedido, pedidos, restaurantes, solicitacoesFechamento } from "../db/schema";
import { baixarEstoque, devolverEstoque } from "../db/queries/cardapio";
import { getClientePorClerkId } from "../db/queries/clientes";
import { getConfiguracoes } from "../db/queries/configuracoes";
import { getZonasEntrega } from "../db/queries/entrega";
import { getPedidoComItens, getPedidosAbertosMesa } from "../db/queries/pedidos";
import { assertFuncionario } from "../lib/funcionarioAuth";
import { enviarMensagemWhatsapp } from "../lib/evolutionApi";
import { encontrarZona } from "../lib/entrega";
import { fmtBRL } from "../lib/data";
import { formatarCPF, validarCPF } from "../lib/cpf";
import { podeCancelarPedido } from "../lib/cancelamento";
import { podeFecharConta } from "../lib/fechamentoMesa";
import { mesaValida } from "../lib/mesa";
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

  const pedido = await db.transaction(async (tx) => {
    const [p] = await tx
      .insert(pedidos)
      .values({ restauranteId: funcionario.restauranteId, origem: "salao", mesa, status: "novo", total })
      .returning();
    await tx.insert(itensPedido).values(
      itens.map((i) => ({
        pedidoId: p.id,
        itemCardapioId: i.itemCardapioId,
        nome: i.nome,
        preco: i.preco,
        quantidade: i.quantidade,
      })),
    );
    return p;
  });

  await baixarEstoque(itens.map((i) => ({ itemCardapioId: i.itemCardapioId, quantidade: i.quantidade }))).catch((e) =>
    console.error("[estoque] falha ao baixar estoque:", e),
  );
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
  const config = await getConfiguracoes(restauranteId);
  if (!mesaValida(mesa, config?.numeroMesas ?? 8)) throw new Error("Mesa inválida.");

  const pedidosAbertos = await getPedidosAbertosMesa(restauranteId, mesa);
  if (!podeFecharConta(pedidosAbertos)) {
    throw new Error("Ainda tem pedido em preparo — aguarde ficar tudo pronto pra fechar a conta.");
  }

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

export async function confirmarEntregaForca(pedidoId: string) {
  const funcionario = await assertFuncionario("dono");
  await getDb()
    .update(pedidos)
    .set({ status: "entregue" })
    .where(
      and(
        eq(pedidos.id, pedidoId),
        eq(pedidos.restauranteId, funcionario.restauranteId),
        eq(pedidos.status, "rota"),
      ),
    );
  revalidatePath("/motoboy");
  revalidatePath("/dono");
  revalidatePath("/dono/pedidos");
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

  const pedido = await db.transaction(async (tx) => {
    const [p] = await tx
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
    await tx.insert(itensPedido).values(itensParaSalvar.map((i) => ({ pedidoId: p.id, ...i })));
    return p;
  });

  await baixarEstoque(itensParaSalvar.map((i) => ({ itemCardapioId: i.itemCardapioId, quantidade: i.quantidade }))).catch(
    (e) => console.error("[estoque] falha ao baixar estoque:", e),
  );

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

  const config = await getConfiguracoes(dados.restauranteId);
  if (!mesaValida(dados.mesa, config?.numeroMesas ?? 8)) throw new Error("Mesa inválida.");

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

  const pedido = await db.transaction(async (tx) => {
    const [p] = await tx
      .insert(pedidos)
      .values({ restauranteId: dados.restauranteId, origem: "salao", mesa: dados.mesa, status: "novo", total })
      .returning();
    await tx.insert(itensPedido).values(itensParaSalvar.map((i) => ({ pedidoId: p.id, ...i })));
    return p;
  });

  await baixarEstoque(itensParaSalvar.map((i) => ({ itemCardapioId: i.itemCardapioId, quantidade: i.quantidade }))).catch(
    (e) => console.error("[estoque] falha ao baixar estoque:", e),
  );
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

  const pedido = await db.transaction(async (tx) => {
    let clienteId: string | null = null;
    if (userId) {
      const [existente] = await tx.select().from(clientes).where(eq(clientes.clerkUserId, userId));
      if (existente) {
        clienteId = existente.id;
        await tx
          .update(clientes)
          .set({ nome: nomeLimpo, telefone: telefoneLimpo ?? existente.telefone })
          .where(eq(clientes.id, existente.id));
      } else {
        const [novo] = await tx
          .insert(clientes)
          .values({ restauranteId: dados.restauranteId, clerkUserId: userId, nome: nomeLimpo, telefone: telefoneLimpo })
          .returning();
        clienteId = novo.id;
      }
    }

    const [p] = await tx
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

    await tx.insert(itensPedido).values(itensParaSalvar.map((i) => ({ pedidoId: p.id, ...i })));
    return p;
  });

  await baixarEstoque(itensParaSalvar.map((i) => ({ itemCardapioId: i.itemCardapioId, quantidade: i.quantidade }))).catch(
    (e) => console.error("[estoque] falha ao baixar estoque:", e),
  );
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

/** Liga à conta de quem acabou de logar os pedidos que ela fez como
 * convidada nesse mesmo navegador (ids vindos do localStorage, ver
 * `pedidosConvidado.ts`) — sem isso, "Meus pedidos" esquece tudo que ela
 * pediu antes de criar conta. Ignora silenciosamente qualquer id que não
 * seja mais "de convidado" (já tem clienteId) ou que nem exista mais. */
export async function adotarPedidosConvidado(pedidoIds: string[]) {
  const { userId } = await auth();
  if (!userId || pedidoIds.length === 0) return;

  const db = getDb();
  const pedidosConvidado = await db
    .select()
    .from(pedidos)
    .where(and(inArray(pedidos.id, pedidoIds), isNull(pedidos.clienteId)));
  if (pedidosConvidado.length === 0) return;

  let [cliente] = await db.select().from(clientes).where(eq(clientes.clerkUserId, userId));
  if (!cliente) {
    const base = pedidosConvidado[0];
    [cliente] = await db
      .insert(clientes)
      .values({
        restauranteId: base.restauranteId,
        clerkUserId: userId,
        nome: base.clienteNome?.trim() || "Cliente",
        telefone: base.telefoneCliente,
      })
      .returning();
  }

  const idsParaAdotar = pedidosConvidado.filter((p) => p.restauranteId === cliente.restauranteId).map((p) => p.id);
  if (idsParaAdotar.length === 0) return;

  await db.update(pedidos).set({ clienteId: cliente.id }).where(inArray(pedidos.id, idsParaAdotar));
  revalidatePath("/meus-pedidos");
}

/** Cliente cancelando o próprio pedido de delivery/retirada — endpoint
 * público, então revalida tudo de novo (preço já não importa aqui, mas
 * "de quem é o pedido" sim): pedido sem clienteId é de convidado e vale o
 * id como se fosse senha (mesmo modelo da página `/pedido/[id]`); pedido
 * com clienteId só pode ser cancelado por quem é dono dele. */
export async function cancelarPedidoCliente(pedidoId: string) {
  const resultado = await getPedidoComItens(pedidoId);
  if (!resultado) throw new Error("Pedido não encontrado.");
  const { pedido, itens } = resultado;

  if (pedido.clienteId) {
    const { userId } = await auth();
    const cliente = userId ? await getClientePorClerkId(userId) : null;
    if (!cliente || cliente.id !== pedido.clienteId) throw new Error("Sem acesso a esse pedido.");
  }

  if (!podeCancelarPedido(pedido.status)) {
    throw new Error("Esse pedido já entrou em preparo e não pode mais ser cancelado por aqui — fale com o restaurante.");
  }

  const itensParaDevolver = itens
    .filter((i) => i.itemCardapioId)
    .map((i) => ({ itemCardapioId: i.itemCardapioId!, quantidade: i.quantidade }));
  const db = getDb();
  await db.transaction(async (tx) => {
    await tx.update(pedidos).set({ status: "cancelado" }).where(eq(pedidos.id, pedidoId));
    await devolverEstoque(itensParaDevolver, tx);
  });

  await notificarNovoPedido(pedido.restauranteId, ["cozinha", "atendente"], {
    title: "Pedido cancelado pelo cliente",
    body: `${pedido.clienteNome ?? "Cliente"} · ${fmtBRL(pedido.total)}`,
    url: "/cozinha",
  });

  revalidatePath("/cozinha");
  revalidatePath("/atendente");
  revalidatePath("/dono");
  revalidatePath("/meus-pedidos");
}

/** O próprio cliente sentado à mesa cancelando um pedido que ele mandou
 * pelo QR code — mesma regra: só enquanto estiver "novo". Não precisa de
 * login (ninguém tem, nesse fluxo), só confirma que o pedido é mesmo dessa
 * mesa/restaurante pra não cancelar o de outra mesa por engano. */
export async function cancelarPedidoMesa(restauranteId: string, mesa: number, pedidoId: string) {
  const resultado = await getPedidoComItens(pedidoId);
  if (!resultado) throw new Error("Pedido não encontrado.");
  const { pedido, itens } = resultado;

  if (pedido.restauranteId !== restauranteId || pedido.mesa !== mesa) {
    throw new Error("Esse pedido não é dessa mesa.");
  }
  if (!podeCancelarPedido(pedido.status)) {
    throw new Error("Esse pedido já entrou em preparo e não pode mais ser cancelado — chame o atendente.");
  }

  const itensParaDevolver = itens
    .filter((i) => i.itemCardapioId)
    .map((i) => ({ itemCardapioId: i.itemCardapioId!, quantidade: i.quantidade }));
  const db = getDb();
  await db.transaction(async (tx) => {
    await tx.update(pedidos).set({ status: "cancelado" }).where(eq(pedidos.id, pedidoId));
    await devolverEstoque(itensParaDevolver, tx);
  });

  await notificarNovoPedido(restauranteId, ["cozinha", "atendente"], {
    title: `Mesa ${mesa} cancelou um pedido`,
    body: fmtBRL(pedido.total),
    url: "/cozinha",
  });

  revalidatePath("/cozinha");
  revalidatePath("/atendente");
}
