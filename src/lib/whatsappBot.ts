import { criarPedidoWhatsapp } from "../actions/pedidos.actions";
import { getItensCardapioAtivos } from "../db/queries/cardapio";
import {
  atualizarConversa,
  getOuCriarConversa,
  parseCarrinho,
  resetarConversa,
} from "../db/queries/conversasWhatsapp";
import { fmtBRL } from "./data";
import type { ItemCarrinhoWhatsapp, Pagamento } from "./types";

const SAUDACAO =
  "Oi! Bem-vindo(a) à Dashi Sushi 🍣\n\nDigite *menu* a qualquer momento pra ver o cardápio, ou *cancelar* pra recomeçar.";

function normalizar(texto: string): string {
  return texto.trim().toLowerCase();
}

function listarCategorias(categorias: string[]): string {
  const linhas = categorias.map((c, i) => `${i + 1}. ${c}`);
  return `Escolha uma categoria digitando o número:\n\n${linhas.join("\n")}`;
}

function listarItens(itens: { nome: string; preco: number }[]): string {
  const linhas = itens.map((it, i) => `${i + 1}. ${it.nome} — ${fmtBRL(it.preco)}`);
  return `${linhas.join("\n")}\n\n0. Voltar pras categorias`;
}

function resumoCarrinho(carrinho: ItemCarrinhoWhatsapp[]): string {
  const linhas = carrinho.map((i) => `${i.qtd}x ${i.nome} — ${fmtBRL(i.preco * i.qtd)}`);
  const total = carrinho.reduce((s, i) => s + i.preco * i.qtd, 0);
  return `${linhas.join("\n")}\n\nTotal: ${fmtBRL(total)}`;
}

const PAGAMENTO_POR_OPCAO: Record<string, Pagamento> = { "1": "pix", "2": "cartao", "3": "dinheiro" };

export async function processarMensagemWhatsapp(
  restauranteId: string,
  telefone: string,
  textoRecebido: string,
): Promise<string> {
  const texto = normalizar(textoRecebido);
  const conversa = await getOuCriarConversa(restauranteId, telefone);

  if (texto === "cancelar") {
    await resetarConversa(conversa.id);
    return "Pedido cancelado. Digite *menu* quando quiser começar de novo.";
  }

  const itensAtivos = await getItensCardapioAtivos(restauranteId);
  const categorias = [...new Set(itensAtivos.map((i) => i.categoria))];

  if (texto === "menu" || texto === "cardapio" || texto === "cardápio" || conversa.etapa === "inicio") {
    await atualizarConversa(conversa.id, { etapa: "escolhendo_categoria" });
    return `${conversa.etapa === "inicio" ? SAUDACAO + "\n\n" : ""}${listarCategorias(categorias)}`;
  }

  if (conversa.etapa === "escolhendo_categoria") {
    const indice = Number(texto) - 1;
    const categoria = categorias[indice];
    if (!categoria) return `Não entendi. ${listarCategorias(categorias)}`;

    const itensDaCategoria = itensAtivos.filter((i) => i.categoria === categoria);
    await atualizarConversa(conversa.id, { etapa: "escolhendo_item", categoriaAtual: categoria });
    return `*${categoria}*\n\n${listarItens(itensDaCategoria)}`;
  }

  if (conversa.etapa === "escolhendo_item") {
    if (texto === "0") {
      await atualizarConversa(conversa.id, { etapa: "escolhendo_categoria", categoriaAtual: null });
      return listarCategorias(categorias);
    }
    const itensDaCategoria = itensAtivos.filter((i) => i.categoria === conversa.categoriaAtual);
    const indice = Number(texto) - 1;
    const item = itensDaCategoria[indice];
    if (!item) return `Não entendi. ${listarItens(itensDaCategoria)}`;

    await atualizarConversa(conversa.id, { etapa: "escolhendo_quantidade", itemCardapioIdAtual: item.id });
    return `Quantas unidades de *${item.nome}* você quer?`;
  }

  if (conversa.etapa === "escolhendo_quantidade") {
    const qtd = Number(texto);
    if (!Number.isInteger(qtd) || qtd <= 0) return "Digite só o número de unidades (ex: 2).";

    const item = itensAtivos.find((i) => i.id === conversa.itemCardapioIdAtual);
    if (!item) return "Esse item não está mais disponível. Digite *menu* pra ver o cardápio de novo.";

    const carrinho = parseCarrinho(conversa.carrinho);
    const existente = carrinho.find((i) => i.itemCardapioId === item.id);
    const novoCarrinho = existente
      ? carrinho.map((i) => (i.itemCardapioId === item.id ? { ...i, qtd: i.qtd + qtd } : i))
      : [...carrinho, { itemCardapioId: item.id, nome: item.nome, preco: item.preco, qtd }];

    await atualizarConversa(conversa.id, {
      etapa: "sacola",
      itemCardapioIdAtual: null,
      categoriaAtual: null,
      carrinho: novoCarrinho,
    });
    return `Adicionado! ✅\n\n${resumoCarrinho(novoCarrinho)}\n\nDigite *1* pra continuar comprando ou *2* pra fechar o pedido.`;
  }

  if (conversa.etapa === "sacola") {
    const carrinho = parseCarrinho(conversa.carrinho);
    if (texto === "1") {
      await atualizarConversa(conversa.id, { etapa: "escolhendo_categoria" });
      return listarCategorias(categorias);
    }
    if (texto === "2") {
      await atualizarConversa(conversa.id, { etapa: "aguardando_endereco" });
      return `${resumoCarrinho(carrinho)}\n\nQual o endereço de entrega? (ou digite *retirada* pra retirar no balcão)`;
    }
    return "Digite *1* pra continuar comprando ou *2* pra fechar o pedido.";
  }

  if (conversa.etapa === "aguardando_endereco") {
    const endereco = ["retirada", "retirar"].includes(texto) ? "Retirada no balcão" : textoRecebido.trim();
    if (!endereco) return "Me manda o endereço de entrega, ou digite *retirada*.";

    await atualizarConversa(conversa.id, { etapa: "aguardando_pagamento", enderecoTemp: endereco });
    return "Como você vai pagar?\n\n1. Pix\n2. Cartão (na entrega)\n3. Dinheiro (na entrega)";
  }

  if (conversa.etapa === "aguardando_pagamento") {
    const pagamento = PAGAMENTO_POR_OPCAO[texto];
    if (!pagamento) return "Digite *1* pra Pix, *2* pra Cartão ou *3* pra Dinheiro.";

    const carrinho = parseCarrinho(conversa.carrinho);
    try {
      const { pedidoId, total } = await criarPedidoWhatsapp({
        restauranteId,
        telefoneCliente: telefone,
        itens: carrinho.map((i) => ({ itemCardapioId: i.itemCardapioId, quantidade: i.qtd })),
        endereco: conversa.enderecoTemp ?? "Endereço não informado",
        pagamento,
      });
      await resetarConversa(conversa.id);
      return (
        `Pedido confirmado! ✅\n\nNúmero: #${pedidoId.slice(0, 8)}\nTotal: ${fmtBRL(total)}\n\n` +
        "Já mandamos pra cozinha. Te aviso assim que sair pra entrega! 🛵"
      );
    } catch {
      await resetarConversa(conversa.id);
      return "Algum item da sua sacola não está mais disponível. Digite *menu* pra montar o pedido de novo.";
    }
  }

  await resetarConversa(conversa.id);
  return SAUDACAO;
}
