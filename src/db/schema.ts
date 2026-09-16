import {
  boolean,
  date,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

export const papelFuncionarioEnum = pgEnum("papel_funcionario", [
  "dono",
  "atendente",
  "cozinha",
  "motoboy",
]);

export const origemPedidoEnum = pgEnum("origem_pedido", ["salao", "delivery"]);

export const statusPedidoEnum = pgEnum("status_pedido", [
  "novo",
  "preparo",
  "pronto",
  "rota",
  "entregue",
  "finalizado",
]);

export const formaPagamentoEnum = pgEnum("forma_pagamento", ["dinheiro", "cartao", "pix"]);

export const etapaConversaEnum = pgEnum("etapa_conversa", [
  "inicio",
  "escolhendo_categoria",
  "escolhendo_item",
  "escolhendo_quantidade",
  "sacola",
  "aguardando_endereco",
  "aguardando_pagamento",
]);

const money = (col: string) => numeric(col, { precision: 10, scale: 2, mode: "number" });

/** Um restaurante = um cliente do SaaS. Toda tabela abaixo que pertence "à
 * loja" carrega um `restauranteId` — isola os dados de cada restaurante um
 * do outro, todos rodando no mesmo banco e no mesmo deploy (mesmo padrão
 * usado no NexoBarber). Hoje só existe a Dashi Sushi, mas o modelo já
 * comporta outros restaurantes clientes no futuro sem mudar schema. */
export const restaurantes = pgTable("restaurantes", {
  id: uuid("id").primaryKey().defaultRandom(),
  nome: text("nome").notNull(),
  slug: text("slug").notNull().unique(),
  /** Nome da instância no Evolution API (self-hosted) ligada ao WhatsApp
   * desse restaurante — um servidor Evolution atende várias instâncias,
   * uma por restaurante/número. Nulo enquanto o bot não estiver conectado. */
  instanciaWhatsapp: text("instancia_whatsapp").unique(),
  criadoEm: timestamp("criado_em").notNull().defaultNow(),
});

export const itensCardapio = pgTable("itens_cardapio", {
  id: uuid("id").primaryKey().defaultRandom(),
  restauranteId: uuid("restaurante_id")
    .notNull()
    .references(() => restaurantes.id, { onDelete: "cascade" }),
  categoria: text("categoria").notNull(),
  nome: text("nome").notNull(),
  descricao: text("descricao"),
  preco: money("preco").notNull(),
  /** Foto do item — guardada como data URL (base64), já redimensionada e
   * comprimida no navegador antes de enviar. Evita depender de um serviço
   * de storage de arquivos só pra isso. Nula quando o item não tem foto. */
  imagemUrl: text("imagem_url"),
  ativo: boolean("ativo").notNull().default(true),
  criadoEm: timestamp("criado_em").notNull().defaultNow(),
});

export const funcionarios = pgTable("funcionarios", {
  id: uuid("id").primaryKey().defaultRandom(),
  restauranteId: uuid("restaurante_id")
    .notNull()
    .references(() => restaurantes.id, { onDelete: "cascade" }),
  clerkUserId: text("clerk_user_id").unique(),
  /** E-mail informado pelo dono ao cadastrar o funcionário — usado só pra
   * ligar a conta do Clerk automaticamente no primeiro login dele
   * (comparado com o e-mail da conta, não é um campo de contato). */
  emailConvite: text("email_convite").unique(),
  nome: text("nome").notNull(),
  telefone: text("telefone"),
  avatarUrl: text("avatar_url"),
  papel: papelFuncionarioEnum("papel").notNull().default("atendente"),
  /** Papéis extras que a dona liberou pra esse funcionário além do
   * principal — ex: um atendente que também pode entrar na cozinha nos
   * dias de pico. Permissão granular por área, não por ação. */
  acessosExtras: papelFuncionarioEnum("acessos_extras").array().notNull().default([]),
  ativo: boolean("ativo").notNull().default(true),
  criadoEm: timestamp("criado_em").notNull().defaultNow(),
});

export const clientes = pgTable("clientes", {
  id: uuid("id").primaryKey().defaultRandom(),
  restauranteId: uuid("restaurante_id")
    .notNull()
    .references(() => restaurantes.id, { onDelete: "cascade" }),
  clerkUserId: text("clerk_user_id").unique(),
  nome: text("nome").notNull(),
  telefone: text("telefone"),
  criadoEm: timestamp("criado_em").notNull().defaultNow(),
});

export const pedidos = pgTable("pedidos", {
  id: uuid("id").primaryKey().defaultRandom(),
  restauranteId: uuid("restaurante_id")
    .notNull()
    .references(() => restaurantes.id, { onDelete: "cascade" }),
  origem: origemPedidoEnum("origem").notNull(),
  mesa: integer("mesa"),
  clienteId: uuid("cliente_id").references(() => clientes.id, { onDelete: "set null" }),
  clienteNome: text("cliente_nome"),
  /** Só preenchido em pedidos que vieram do bot do WhatsApp — é pra onde
   * mandamos o aviso automático de "saiu pra entrega". Pedidos do site ou
   * da comanda não precisam disso. */
  telefoneCliente: text("telefone_cliente"),
  endereco: text("endereco"),
  /** Motoboy que assumiu a entrega — preenchido quando o pedido avança pra
   * "rota". Não tem relação com comissão, só histórico de quem entregou o
   * quê (usado na visão "Minhas entregas" do painel do motoboy). */
  entregadorId: uuid("entregador_id").references(() => funcionarios.id, { onDelete: "set null" }),
  status: statusPedidoEnum("status").notNull().default("novo"),
  formaPagamento: formaPagamentoEnum("forma_pagamento"),
  total: money("total").notNull(),
  criadoEm: timestamp("criado_em").notNull().defaultNow(),
});

/** Item de um pedido, com nome/preço "congelados" no momento da venda —
 * assim o histórico financeiro não muda se o preço do item no cardápio
 * for alterado depois. */
export const itensPedido = pgTable("itens_pedido", {
  id: uuid("id").primaryKey().defaultRandom(),
  pedidoId: uuid("pedido_id")
    .notNull()
    .references(() => pedidos.id, { onDelete: "cascade" }),
  itemCardapioId: uuid("item_cardapio_id").references(() => itensCardapio.id, {
    onDelete: "set null",
  }),
  nome: text("nome").notNull(),
  preco: money("preco").notNull(),
  quantidade: integer("quantidade").notNull(),
});

/** Uma linha por dia fechado, por restaurante — trava os números do
 * fechamento de caixa daquele dia em vez de deixar só um total calculado
 * ao vivo. */
export const fechamentosCaixa = pgTable(
  "fechamentos_caixa",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    restauranteId: uuid("restaurante_id")
      .notNull()
      .references(() => restaurantes.id, { onDelete: "cascade" }),
    data: date("data").notNull(),
    dinheiro: money("dinheiro").notNull(),
    cartao: money("cartao").notNull(),
    pix: money("pix").notNull(),
    total: money("total").notNull(),
    fechadoEm: timestamp("fechado_em").notNull().defaultNow(),
    fechadoPorFuncionarioId: uuid("fechado_por_funcionario_id").references(() => funcionarios.id, {
      onDelete: "set null",
    }),
  },
  (table) => [unique("fechamento_dia_restaurante_unico").on(table.data, table.restauranteId)],
);

/** Estado da conversa do bot com um número de WhatsApp — o webhook do
 * Evolution API é sem estado (cada mensagem chega isolada), então é essa
 * tabela que lembra em que ponto da compra a pessoa está. Uma linha por
 * (restaurante, telefone); reaproveitada a cada novo pedido do mesmo
 * número — não guarda histórico de conversas antigas. */
export const conversasWhatsapp = pgTable(
  "conversas_whatsapp",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    restauranteId: uuid("restaurante_id")
      .notNull()
      .references(() => restaurantes.id, { onDelete: "cascade" }),
    telefone: text("telefone").notNull(),
    etapa: etapaConversaEnum("etapa").notNull().default("inicio"),
    /** Categoria e item sendo escolhidos no momento (não confirmados ainda). */
    categoriaAtual: text("categoria_atual"),
    itemCardapioIdAtual: uuid("item_cardapio_id_atual"),
    /** Carrinho confirmado: [{ itemCardapioId, nome, preco, qtd }] */
    carrinho: text("carrinho").notNull().default("[]"),
    enderecoTemp: text("endereco_temp"),
    atualizadoEm: timestamp("atualizado_em").notNull().defaultNow(),
  },
  (table) => [unique("conversa_telefone_restaurante_unico").on(table.restauranteId, table.telefone)],
);

/** Trilha de auditoria das ações administrativas — quem fez o quê e
 * quando. `funcionarioId` fica nulo se o funcionário for excluído depois,
 * mas o registro do que aconteceu permanece (por isso `nomeFuncionario`
 * também é congelado aqui, igual o padrão de itensPedido). */
export const logAtividades = pgTable("log_atividades", {
  id: uuid("id").primaryKey().defaultRandom(),
  restauranteId: uuid("restaurante_id")
    .notNull()
    .references(() => restaurantes.id, { onDelete: "cascade" }),
  funcionarioId: uuid("funcionario_id").references(() => funcionarios.id, { onDelete: "set null" }),
  nomeFuncionario: text("nome_funcionario").notNull(),
  acao: text("acao").notNull(),
  detalhe: text("detalhe"),
  criadoEm: timestamp("criado_em").notNull().defaultNow(),
});

/** Turno de trabalho fixo e recorrente por dia da semana (0 = domingo … 6 =
 * sábado). Só define a escala esperada — não tem relação com ponto
 * batido/horas realmente trabalhadas. */
export const turnos = pgTable("turnos", {
  id: uuid("id").primaryKey().defaultRandom(),
  restauranteId: uuid("restaurante_id")
    .notNull()
    .references(() => restaurantes.id, { onDelete: "cascade" }),
  funcionarioId: uuid("funcionario_id")
    .notNull()
    .references(() => funcionarios.id, { onDelete: "cascade" }),
  diaSemana: integer("dia_semana").notNull(),
  horaInicio: text("hora_inicio").notNull(),
  horaFim: text("hora_fim").notNull(),
  criadoEm: timestamp("criado_em").notNull().defaultNow(),
});

/** Uma linha por restaurante — hoje só guarda a meta de faturamento mensal
 * usada em Financeiro. `restauranteId` é a própria chave primária (relação
 * 1:1 com `restaurantes`). */
export const configuracoes = pgTable("configuracoes", {
  restauranteId: uuid("restaurante_id")
    .primaryKey()
    .references(() => restaurantes.id, { onDelete: "cascade" }),
  metaFaturamentoMensal: money("meta_faturamento_mensal"),
  /** Endereço de onde as entregas saem — usado como ponto de partida pra
   * traçar a rota real no mapa do motoboy. Sem isso só dá pra mostrar um
   * pino no destino, sem rota desenhada. */
  enderecoLoja: text("endereco_loja"),
});
