import { generateText, stepCountIs, tool } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { criarPedidoWhatsapp } from "../actions/pedidos.actions";
import { getItensCardapioAtivos, getOpcoesComboPorItens } from "../db/queries/cardapio";
import { getPedidosPorTelefone } from "../db/queries/pedidos";
import {
  atualizarConversa,
  getOuCriarConversa,
  parseCarrinho,
  resetarConversa,
  travarConfirmacao,
  liberarConfirmacao,
} from "../db/queries/conversasWhatsapp";
import { fmtBRL } from "./data";
import { statusFuncionamento, textoStatus, resumoHorarios } from "./horario";
import { getConfiguracoes } from "../db/queries/configuracoes";
import type { ItemCarrinhoWhatsapp, Pagamento } from "./types";

const EXPIRACAO_SESSAO_MS = 3 * 60 * 60 * 1000; // 3 horas
const MAX_HISTORICO_CHARS = 3000;

const STATUS_PT: Record<string, string> = {
  aguardando_pagamento: "aguardando pagamento",
  novo: "recebido pela cozinha",
  preparo: "em preparo",
  pronto: "pronto",
  rota: "saiu pra entrega",
  entregue: "entregue",
  cancelado: "cancelado",
};

function resumoCarrinho(carrinho: ItemCarrinhoWhatsapp[]): string {
  if (carrinho.length === 0) return "Sacola vazia.";
  const linhas = carrinho.map((i) => {
    const obs = i.observacao ? ` (${i.observacao})` : "";
    return `• ${i.qtd}x ${i.nome}${obs} — ${fmtBRL(i.preco * i.qtd)}`;
  });
  const total = carrinho.reduce((s, i) => s + i.preco * i.qtd, 0);
  return `${linhas.join("\n")}\nTotal: ${fmtBRL(total)}`;
}

function buildCategoriasLista(itens: Awaited<ReturnType<typeof getItensCardapioAtivos>>): string {
  const categorias = [...new Set(itens.map((i) => i.categoria))];
  return categorias.map((c, idx) => `${idx + 1}. ${c}`).join("  ");
}

function buildMenuTexto(
  itens: Awaited<ReturnType<typeof getItensCardapioAtivos>>,
  opcoesMapa: Map<string, { nome: string; disponivel: boolean; limiteQuantidade: number | null }[]>,
): string {
  const porCategoria = new Map<string, typeof itens>();
  for (const item of itens) {
    const lista = porCategoria.get(item.categoria) ?? [];
    lista.push(item);
    porCategoria.set(item.categoria, lista);
  }

  const blocos: string[] = [];
  for (const [cat, lista] of porCategoria) {
    const linhas: string[] = [`## ${cat}`];
    for (const item of lista) {
      let linha = `- ${item.nome} (id: ${item.id}) — ${fmtBRL(item.preco)}`;
      if (item.qtdPecasEscolha) {
        const opcoes = (opcoesMapa.get(item.id) ?? []).filter((o) => o.disponivel);
        const esc = item.escolhaLivre ? "livre" : `exatamente ${item.qtdPecasEscolha} peças`;
        linha += `\n  Combo: o cliente escolhe ${esc}. Sabores disponíveis: ${opcoes.map((o) => o.nome).join(", ") || "a definir"}`;
      }
      linhas.push(linha);
    }
    blocos.push(linhas.join("\n"));
  }
  return blocos.join("\n\n");
}

function buildSystemPrompt(
  nomeRestaurante: string,
  menuTexto: string,
  categoriasLista: string,
  carrinho: ItemCarrinhoWhatsapp[],
  nomeTemp: string | null,
  enderecoTemp: string | null,
  pagamentoTemp: string | null,
  historico: string,
): string {
  const estado = [
    nomeTemp ? `Nome do cliente: ${nomeTemp}` : "Nome do cliente: não coletado ainda",
    enderecoTemp ? `Endereço: ${enderecoTemp}` : "Endereço: não coletado ainda",
    pagamentoTemp ? `Pagamento: ${pagamentoTemp}` : "Pagamento: não coletado ainda",
    `Carrinho atual:\n${resumoCarrinho(carrinho)}`,
  ].join("\n");

  return `Você é o atendente virtual do ${nomeRestaurante}, restaurante de sushi. Atende pedidos pelo WhatsApp.

REGRAS OBRIGATÓRIAS:
1. Uma pergunta por vez — nunca junte duas perguntas na mesma mensagem.
2. Para itens combo (com escolha de sabores): primeiro confirme o tamanho/item, depois em outra mensagem pergunte os sabores.
3. Para entrega: pergunte ponto de referência se o endereço não tiver um.
4. Coleta de dados em ordem: nome → endereço → pagamento. Uma por vez.
5. Tom natural, mensagens curtas como WhatsApp de gente real. Varie as respostas, não repita "Perfeito!" ou "Ótima escolha!".
6. Nunca diga "temos várias opções" — sempre liste as opções reais do cardápio.
7. Perguntas sobre horário de funcionamento, status de pedido, endereço da loja e dúvidas gerais sobre o cardápio são bem-vindas — responda com naturalidade. Só recuse piadas, assuntos totalmente fora do contexto do restaurante.
8. Só confirme o pedido quando tiver: nome + endereço (ou retirada) + pagamento + pelo menos 1 item no carrinho — E o cliente já tiver confirmado de verdade que quer fechar (ex: "sim", "pode confirmar", "fechar pedido"). Nunca chame confirmar_pedido só por ter os dados completos, sem o cliente ter pedido pra fechar.
9. Pagamentos aceitos: pix, cartao (na entrega), dinheiro (na entrega).
10. Chame no máximo UMA ferramenta por resposta. Depois que confirmar_pedido retornar sucesso (PEDIDO_CONFIRMADO), pare — nunca repita nome/endereço/pagamento/item de novo no mesmo turno, o pedido já foi criado.
11. MENU EM DUAS ETAPAS — OBRIGATÓRIO:
    - Quando o cliente pedir o cardápio, ver opções ou perguntar o que tem: mostre APENAS as categorias numeradas (ex: "1. Combos  2. Bebidas  3. Big Hot ..."). NÃO liste nenhum item ainda.
    - Espere o cliente escolher a categoria (pelo número ou pelo nome) e só então liste os itens daquela categoria com nome, preço e (se for combo) opções de sabor.
    - Nunca despeje o cardápio inteiro de uma vez — sempre uma categoria por vez, quando solicitado.

ESTADO ATUAL DA CONVERSA:
${estado}

CATEGORIAS DO CARDÁPIO (use esta lista quando o cliente pedir o cardápio):
${categoriasLista}

CARDÁPIO COMPLETO (use apenas para responder quando o cliente escolher uma categoria específica):
${menuTexto}

${historico ? `HISTÓRICO DA CONVERSA:\n${historico}` : ""}`.trim();
}

function adicionarAoHistorico(historico: string, usuario: string, assistente: string): string {
  const novo = `Cliente: ${usuario}\nAtendente: ${assistente}`;
  const completo = historico ? `${historico}\n\n${novo}` : novo;
  // Mantém os últimos MAX_HISTORICO_CHARS caracteres
  return completo.length > MAX_HISTORICO_CHARS ? completo.slice(-MAX_HISTORICO_CHARS) : completo;
}

function carrinhVazio(carrinho: unknown): boolean {
  try {
    const parsed = typeof carrinho === "string" ? JSON.parse(carrinho) : carrinho;
    return !Array.isArray(parsed) || parsed.length === 0;
  } catch {
    return true;
  }
}

const SAUDACOES = /^(oi|olá|ola|oii+|oiiii*|e aí|eai|hello|hey|bom dia|boa tarde|boa noite|boas|tudo bem|tudo bom|boa|salve|opa)\b/i;
const PEDIR_CARDAPIO = /^(1|cardap|cardáp|menu|o que tem|quero ver|ver opç|opções|o que vocês|o que voces|o que vende)/i;
const PEDIR_HORARIO = /(^2$|aberto|fechado|horario|horário|funcionando|funciona|abre|fecha|abriu|fechou|ta open)/i;
const PEDIR_STATUS = /^(3|status|meu pedido|onde (está|ta|tá) meu|acompanhar)/i;
const PEDIR_AJUDA = /^(4|duvida|dúvida|ajuda|help|pergunta|não entendi|nao entendi)/i;

const MENU_SAUDACAO = `📋 *O que você precisa?*

1️⃣ Ver cardápio
2️⃣ Horário de funcionamento
3️⃣ Status do meu pedido
4️⃣ Falar com atendente / dúvidas

Digite o número ou escreva o que precisa 😊`;

function buildBoasVindas(nomeRestaurante: string, statusTexto = ""): string {
  return `Olá! Bem-vindo ao *${nomeRestaurante}* 🍣${statusTexto}\n\n${MENU_SAUDACAO}`;
}

function buildMenuCardapio(categoriasLista: string): string {
  return `Aqui estão nossas categorias:\n\n${categoriasLista}\n\nDigite o número ou o nome da categoria pra ver os itens 😊`;
}

export async function processarMensagemWhatsapp(
  restauranteId: string,
  telefone: string,
  textoRecebido: string,
  nomeRestaurante = "Restaurante",
): Promise<string> {
  const conversa = await getOuCriarConversa(restauranteId, telefone);

  // Expira sessão se última mensagem foi há mais de 3h
  const idadeMs = Date.now() - conversa.atualizadoEm.getTime();
  if (idadeMs > EXPIRACAO_SESSAO_MS && conversa.historicoResumido) {
    await resetarConversa(conversa.id);
    const conversaFresca = await getOuCriarConversa(restauranteId, telefone);
    return processarComAgente(conversaFresca, restauranteId, telefone, textoRecebido, nomeRestaurante);
  }

  // Fast-path: saudação, cardápio ou horário — resposta instantânea sem chamar IA
  const texto = textoRecebido.trim();
  const eNovo = !conversa.historicoResumido && carrinhVazio(conversa.carrinho);

  // Saudação → menu inicial (sempre, independente de histórico)
  if (SAUDACOES.test(texto)) {
    const config = await getConfiguracoes(restauranteId);
    const statusTexto = config?.horarios ? `\n${textoStatus(statusFuncionamento(config.horarios))} 🕐` : "";
    const resposta = buildBoasVindas(nomeRestaurante, statusTexto);
    // Reseta o histórico para começar uma nova sessão limpa
    await resetarConversa(conversa.id);
    const conversaReset = await getOuCriarConversa(restauranteId, telefone);
    const novoHistorico = adicionarAoHistorico("", texto, resposta);
    await atualizarConversa(conversaReset.id, { historicoResumido: novoHistorico });
    return resposta;
  }

  // Opção 1 / "cardapio" → lista de categorias
  if (PEDIR_CARDAPIO.test(texto)) {
    const itensAtivos = await getItensCardapioAtivos(restauranteId);
    const categoriasLista = buildCategoriasLista(itensAtivos);
    const resposta = buildMenuCardapio(categoriasLista);
    const novoHistorico = adicionarAoHistorico(conversa.historicoResumido, texto, resposta);
    await atualizarConversa(conversa.id, { historicoResumido: novoHistorico });
    return resposta;
  }

  // Opção 2 / "horario" → status instantâneo
  if (PEDIR_HORARIO.test(texto)) {
    const config = await getConfiguracoes(restauranteId);
    let resposta: string;
    if (config?.horarios) {
      const status = statusFuncionamento(config.horarios);
      const resumo = resumoHorarios(config.horarios);
      resposta = `${textoStatus(status)}\n\nHorários: ${resumo}`;
    } else {
      resposta = "Estamos abertos! Pode fazer seu pedido 😊";
    }
    const novoHistorico = adicionarAoHistorico(conversa.historicoResumido, texto, resposta);
    await atualizarConversa(conversa.id, { historicoResumido: novoHistorico });
    return resposta;
  }

  // Opção 4 / "duvida" → avisa que a IA vai atender
  if (eNovo && PEDIR_AJUDA.test(texto)) {
    const resposta = "Claro! Me conta o que você precisa saber 😊";
    const novoHistorico = adicionarAoHistorico(conversa.historicoResumido, texto, resposta);
    await atualizarConversa(conversa.id, { historicoResumido: novoHistorico });
    return resposta;
  }

  // Opção 3 / "status" → passa pra IA com tool consultarStatus
  if (eNovo && PEDIR_STATUS.test(texto)) {
    return processarComAgente(conversa, restauranteId, telefone, "quero saber o status do meu pedido", nomeRestaurante);
  }

  return processarComAgente(conversa, restauranteId, telefone, textoRecebido, nomeRestaurante);
}

async function processarComAgente(
  conversa: Awaited<ReturnType<typeof getOuCriarConversa>>,
  restauranteId: string,
  telefone: string,
  textoRecebido: string,
  nomeRestaurante: string,
): Promise<string> {
  // Carrega cardápio e opções
  const itensAtivos = await getItensCardapioAtivos(restauranteId);
  const opcoesMapa = await getOpcoesComboPorItens(itensAtivos.map((i) => i.id));
  const itensPorId = new Map(itensAtivos.map((i) => [i.id, i]));

  let carrinho = parseCarrinho(conversa.carrinho);
  // Trava em memória contra o próprio turno: sem isso, se o modelo chamar
  // confirmar_pedido com sucesso e, nos passos seguintes do mesmo turno
  // (stepCountIs permite até 6), não reconhecer que já confirmou e refizer
  // nome/endereço/pagamento/item de novo, a trava do banco (que já foi
  // liberada pelo resetarConversa de sucesso) deixa passar e cria um
  // SEGUNDO pedido de verdade, com dados igualmente válidos.
  let pedidoConfirmadoNesteTurno: { pedidoId: string; total: number } | null = null;

  // --- Tools ---

  const adicionarItem = tool({
    description: "Adiciona um item ao carrinho do cliente. Use o id exato do cardápio.",
    inputSchema: z.object({
      itemCardapioId: z.string().describe("ID do item no cardápio"),
      quantidade: z.number().int().min(1).describe("Quantidade de unidades"),
      observacao: z.string().optional().describe("Sabores/complementos escolhidos, ex: '5x Filadélfia, 5x Hot Filadélfia'"),
    }),
    execute: async ({ itemCardapioId, quantidade, observacao }) => {
      const item = itensPorId.get(itemCardapioId);
      if (!item) return "Item não encontrado no cardápio.";
      // Dedupe só pelo item (não pela observação): se o cliente está
      // detalhando/corrigindo o mesmo item numa mensagem seguinte (ex: disse
      // o sabor do combo depois de já ter pedido o item), isso é 1 chamada
      // extra sobre a MESMA unidade, não uma segunda — só soma quantidade
      // de verdade quando vier >1, senão só atualiza a observação por cima.
      const existente = carrinho.find((i) => i.itemCardapioId === itemCardapioId);
      carrinho = existente
        ? carrinho.map((i) =>
            i === existente ? { ...i, qtd: quantidade > 1 ? quantidade : i.qtd, observacao: observacao ?? i.observacao } : i,
          )
        : [...carrinho, { itemCardapioId, nome: item.nome, preco: item.preco, qtd: quantidade, observacao: observacao ?? null }];
      await atualizarConversa(conversa.id, { carrinho });
      return `Adicionado: ${quantidade}x ${item.nome}${observacao ? ` (${observacao})` : ""}. Carrinho: ${resumoCarrinho(carrinho)}`;
    },
  });

  const removerItem = tool({
    description: "Remove um item do carrinho pelo id ou nome",
    inputSchema: z.object({
      itemCardapioId: z.string().describe("ID do item a remover"),
    }),
    execute: async ({ itemCardapioId }) => {
      const antes = carrinho.length;
      carrinho = carrinho.filter((i) => i.itemCardapioId !== itemCardapioId);
      await atualizarConversa(conversa.id, { carrinho });
      return antes === carrinho.length ? "Item não encontrado no carrinho." : `Removido. Carrinho: ${resumoCarrinho(carrinho)}`;
    },
  });

  const verCarrinho = tool({
    description: "Mostra o carrinho atual com itens e total",
    inputSchema: z.object({}),
    execute: async () => resumoCarrinho(carrinho),
  });

  const definirNome = tool({
    description: "Salva o nome do cliente para usar no pedido",
    inputSchema: z.object({ nome: z.string().min(2) }),
    execute: async ({ nome }) => {
      await atualizarConversa(conversa.id, { nomeTemp: nome });
      return `Nome registrado: ${nome}`;
    },
  });

  const definirEndereco = tool({
    description: "Salva o endereço de entrega. Use 'Retirada no balcão' se o cliente quiser retirar.",
    inputSchema: z.object({ endereco: z.string().min(3) }),
    execute: async ({ endereco }) => {
      await atualizarConversa(conversa.id, { enderecoTemp: endereco });
      return `Endereço registrado: ${endereco}`;
    },
  });

  const definirPagamento = tool({
    description: "Salva a forma de pagamento escolhida",
    inputSchema: z.object({
      forma: z.enum(["pix", "cartao", "dinheiro"]).describe("pix = online, cartao/dinheiro = na entrega"),
    }),
    execute: async ({ forma }) => {
      await atualizarConversa(conversa.id, { pagamentoTemp: forma });
      return `Pagamento registrado: ${forma}`;
    },
  });

  const confirmarPedido = tool({
    description: "Cria o pedido no sistema. Só chamar quando tiver nome, endereço, pagamento e pelo menos 1 item.",
    inputSchema: z.object({}),
    execute: async () => {
      // Já confirmou nesse mesmo turno — não deixa o modelo repetir o fluxo
      // e abrir um segundo pedido (ver comentário na declaração da trava).
      if (pedidoConfirmadoNesteTurno) {
        return `PEDIDO_CONFIRMADO:${pedidoConfirmadoNesteTurno.pedidoId}:${pedidoConfirmadoNesteTurno.total}`;
      }

      // Relê estado atual do banco (pode ter sido atualizado pelas tools anteriores)
      const conversaAtual = await getOuCriarConversa(restauranteId, telefone);
      const carrinhoAtual = parseCarrinho(conversaAtual.carrinho);

      if (carrinhoAtual.length === 0) return "ERRO: carrinho vazio.";
      if (!conversaAtual.nomeTemp) return "ERRO: nome do cliente não coletado.";
      if (!conversaAtual.enderecoTemp) return "ERRO: endereço não coletado.";
      if (!conversaAtual.pagamentoTemp) return "ERRO: forma de pagamento não coletada.";

      // Trava atômica — evita pedido duplicado se a tool for chamada 2x
      const travou = await travarConfirmacao(conversa.id);
      if (!travou) return "Pedido já está sendo confirmado.";

      try {
        const { pedidoId, total } = await criarPedidoWhatsapp({
          restauranteId,
          telefoneCliente: telefone,
          nomeCliente: conversaAtual.nomeTemp,
          itens: carrinhoAtual.map((i) => ({
            itemCardapioId: i.itemCardapioId,
            quantidade: i.qtd,
            observacao: i.observacao ?? undefined,
          })),
          endereco: conversaAtual.enderecoTemp,
          pagamento: conversaAtual.pagamentoTemp as Pagamento,
        });
        pedidoConfirmadoNesteTurno = { pedidoId, total };
        await resetarConversa(conversa.id);
        return `PEDIDO_CONFIRMADO:${pedidoId}:${total}`;
      } catch (e) {
        await liberarConfirmacao(conversa.id);
        const msg = e instanceof Error ? e.message : "Erro desconhecido";
        return `ERRO: ${msg}`;
      }
    },
  });

  const verificarHorario = tool({
    description: "Verifica se a loja está aberta agora e informa o horário de funcionamento",
    inputSchema: z.object({}),
    execute: async () => {
      const config = await getConfiguracoes(restauranteId);
      if (!config?.horarios) return "Estamos abertos! Pode fazer seu pedido.";
      const status = statusFuncionamento(config.horarios);
      return `${textoStatus(status)}\nHorários: ${resumoHorarios(config.horarios)}`;
    },
  });

  const consultarStatus = tool({
    description: "Consulta o status dos pedidos recentes do cliente pelo telefone",
    inputSchema: z.object({}),
    execute: async () => {
      const ultimos = await getPedidosPorTelefone(restauranteId, telefone, 3);
      if (ultimos.length === 0) return "Nenhum pedido encontrado pra esse número.";
      return ultimos
        .map((p) => {
          const id = p.id.slice(0, 8);
          const status = STATUS_PT[p.status as string] ?? p.status;
          const total = fmtBRL(p.total);
          const quando = new Intl.DateTimeFormat("pt-BR", {
            timeZone: "America/Sao_Paulo",
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          }).format(p.criadoEm);
          return `#${id} — ${status} — ${total} — ${quando}`;
        })
        .join("\n");
    },
  });

  const menuTexto = buildMenuTexto(itensAtivos, opcoesMapa);
  const categoriasLista = buildCategoriasLista(itensAtivos);
  const systemPrompt = buildSystemPrompt(
    nomeRestaurante,
    menuTexto,
    categoriasLista,
    carrinho,
    conversa.nomeTemp,
    conversa.enderecoTemp,
    conversa.pagamentoTemp,
    conversa.historicoResumido,
  );

  let respostaFinal: string;
  try {
    const resultado = await generateText({
      model: openai("gpt-4o-mini"),
      system: systemPrompt,
      messages: [{ role: "user", content: textoRecebido }],
      tools: { adicionarItem, removerItem, verCarrinho, definirNome, definirEndereco, definirPagamento, confirmarPedido, consultarStatus, verificarHorario },
      stopWhen: stepCountIs(6),
      onStepFinish: (step) => {
        for (const c of step.content) {
          if (c.type === "tool-error") console.error("[whatsapp bot DEBUG] tool-error:", c.toolName, JSON.stringify(c.error));
        }
      },
    });

    respostaFinal = resultado.text?.trim() || "Desculpa, não consegui processar. Pode repetir?";

    // Substitui o token interno de confirmação por uma mensagem amigável
    if (respostaFinal.includes("PEDIDO_CONFIRMADO:")) {
      const match = respostaFinal.match(/PEDIDO_CONFIRMADO:([^:]+):(\d+\.?\d*)/);
      const id = match?.[1]?.slice(0, 8) ?? "?";
      const total = match ? fmtBRL(Number(match[2])) : "";
      respostaFinal = `Pedido confirmado! ✅\n\nNúmero: #${id}\nTotal: ${total}\n\nJá mandei pra cozinha. Te aviso quando sair pra entrega! 🛵`;
    }
  } catch (e) {
    console.error("[whatsapp bot] erro no generateText:", e);
    respostaFinal = "Tive um problema aqui. Pode mandar de novo em instantes?";
  }

  // Persiste o histórico resumido
  const novoHistorico = adicionarAoHistorico(conversa.historicoResumido, textoRecebido, respostaFinal);
  await atualizarConversa(conversa.id, { historicoResumido: novoHistorico });

  return respostaFinal;
}
