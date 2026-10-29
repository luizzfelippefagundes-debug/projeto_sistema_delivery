CREATE TYPE "public"."etapa_conversa" AS ENUM('inicio', 'escolhendo_categoria', 'escolhendo_item', 'escolhendo_quantidade', 'sacola', 'aguardando_endereco', 'aguardando_pagamento');--> statement-breakpoint
CREATE TYPE "public"."forma_pagamento" AS ENUM('dinheiro', 'cartao', 'pix');--> statement-breakpoint
CREATE TYPE "public"."origem_pedido" AS ENUM('salao', 'delivery');--> statement-breakpoint
CREATE TYPE "public"."papel_funcionario" AS ENUM('dono', 'atendente', 'cozinha', 'motoboy');--> statement-breakpoint
CREATE TYPE "public"."status_pedido" AS ENUM('novo', 'preparo', 'pronto', 'rota', 'entregue', 'finalizado', 'cancelado');--> statement-breakpoint
CREATE TABLE "clientes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurante_id" uuid NOT NULL,
	"clerk_user_id" text,
	"nome" text NOT NULL,
	"telefone" text,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "clientes_clerk_user_id_unique" UNIQUE("clerk_user_id")
);
--> statement-breakpoint
CREATE TABLE "configuracoes" (
	"restaurante_id" uuid PRIMARY KEY NOT NULL,
	"meta_faturamento_mensal" numeric(10, 2),
	"endereco_loja" text,
	"numero_mesas" integer DEFAULT 8 NOT NULL,
	"taxa_pix" numeric(5, 2) DEFAULT 0 NOT NULL,
	"taxa_debito" numeric(5, 2) DEFAULT 1.39 NOT NULL,
	"taxa_credito_vista" numeric(5, 2) DEFAULT 3.34 NOT NULL,
	"taxa_credito_2x" numeric(5, 2) DEFAULT 7.29 NOT NULL,
	"taxa_credito_3x" numeric(5, 2) DEFAULT 8.35 NOT NULL,
	"taxa_credito_4x" numeric(5, 2) DEFAULT 9.23 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversas_whatsapp" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurante_id" uuid NOT NULL,
	"telefone" text NOT NULL,
	"etapa" "etapa_conversa" DEFAULT 'inicio' NOT NULL,
	"categoria_atual" text,
	"item_cardapio_id_atual" uuid,
	"carrinho" text DEFAULT '[]' NOT NULL,
	"endereco_temp" text,
	"atualizado_em" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "conversa_telefone_restaurante_unico" UNIQUE("restaurante_id","telefone")
);
--> statement-breakpoint
CREATE TABLE "fechamentos_caixa" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurante_id" uuid NOT NULL,
	"data" date NOT NULL,
	"dinheiro" numeric(10, 2) NOT NULL,
	"cartao" numeric(10, 2) NOT NULL,
	"pix" numeric(10, 2) NOT NULL,
	"total" numeric(10, 2) NOT NULL,
	"fechado_em" timestamp DEFAULT now() NOT NULL,
	"fechado_por_funcionario_id" uuid,
	CONSTRAINT "fechamento_dia_restaurante_unico" UNIQUE("data","restaurante_id")
);
--> statement-breakpoint
CREATE TABLE "funcionarios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurante_id" uuid NOT NULL,
	"clerk_user_id" text,
	"email_convite" text,
	"nome" text NOT NULL,
	"telefone" text,
	"avatar_url" text,
	"papel" "papel_funcionario" DEFAULT 'atendente' NOT NULL,
	"acessos_extras" "papel_funcionario"[] DEFAULT '{}' NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "funcionarios_clerk_user_id_unique" UNIQUE("clerk_user_id"),
	CONSTRAINT "funcionarios_email_convite_unique" UNIQUE("email_convite")
);
--> statement-breakpoint
CREATE TABLE "itens_cardapio" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurante_id" uuid NOT NULL,
	"categoria" text NOT NULL,
	"nome" text NOT NULL,
	"descricao" text,
	"preco" numeric(10, 2) NOT NULL,
	"imagem_url" text,
	"estoque_atual" integer,
	"estoque_minimo" integer,
	"qtd_pecas_escolha" integer,
	"ativo" boolean DEFAULT true NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "itens_pedido" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pedido_id" uuid NOT NULL,
	"item_cardapio_id" uuid,
	"nome" text NOT NULL,
	"preco" numeric(10, 2) NOT NULL,
	"quantidade" integer NOT NULL,
	"observacao" text
);
--> statement-breakpoint
CREATE TABLE "log_atividades" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurante_id" uuid NOT NULL,
	"funcionario_id" uuid,
	"nome_funcionario" text NOT NULL,
	"acao" text NOT NULL,
	"detalhe" text,
	"criado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "opcoes_combo" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_cardapio_id" uuid NOT NULL,
	"nome" text NOT NULL,
	"limite_quantidade" integer,
	"ordem" integer DEFAULT 0 NOT NULL,
	"disponivel" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pedidos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurante_id" uuid NOT NULL,
	"origem" "origem_pedido" NOT NULL,
	"mesa" integer,
	"cliente_id" uuid,
	"cliente_nome" text,
	"telefone_cliente" text,
	"endereco" text,
	"entregador_id" uuid,
	"status" "status_pedido" DEFAULT 'novo' NOT NULL,
	"forma_pagamento" "forma_pagamento",
	"taxa_entrega" numeric(10, 2),
	"cpf_nota" text,
	"total" numeric(10, 2) NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"funcionario_id" uuid NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "push_subscriptions_endpoint_unique" UNIQUE("endpoint")
);
--> statement-breakpoint
CREATE TABLE "restaurantes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"slug" text NOT NULL,
	"instancia_whatsapp" text,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "restaurantes_slug_unique" UNIQUE("slug"),
	CONSTRAINT "restaurantes_instancia_whatsapp_unique" UNIQUE("instancia_whatsapp")
);
--> statement-breakpoint
CREATE TABLE "solicitacoes_fechamento" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurante_id" uuid NOT NULL,
	"mesa" integer NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "solicitacao_fechamento_mesa_unica" UNIQUE("restaurante_id","mesa")
);
--> statement-breakpoint
CREATE TABLE "turnos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurante_id" uuid NOT NULL,
	"funcionario_id" uuid NOT NULL,
	"dia_semana" integer NOT NULL,
	"hora_inicio" text NOT NULL,
	"hora_fim" text NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "zonas_entrega" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurante_id" uuid NOT NULL,
	"bairro" text NOT NULL,
	"taxa_entrega" numeric(10, 2) NOT NULL,
	"tempo_estimado_min" integer NOT NULL,
	"ordem" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_restaurante_id_restaurantes_id_fk" FOREIGN KEY ("restaurante_id") REFERENCES "public"."restaurantes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "configuracoes" ADD CONSTRAINT "configuracoes_restaurante_id_restaurantes_id_fk" FOREIGN KEY ("restaurante_id") REFERENCES "public"."restaurantes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversas_whatsapp" ADD CONSTRAINT "conversas_whatsapp_restaurante_id_restaurantes_id_fk" FOREIGN KEY ("restaurante_id") REFERENCES "public"."restaurantes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fechamentos_caixa" ADD CONSTRAINT "fechamentos_caixa_restaurante_id_restaurantes_id_fk" FOREIGN KEY ("restaurante_id") REFERENCES "public"."restaurantes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fechamentos_caixa" ADD CONSTRAINT "fechamentos_caixa_fechado_por_funcionario_id_funcionarios_id_fk" FOREIGN KEY ("fechado_por_funcionario_id") REFERENCES "public"."funcionarios"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "funcionarios" ADD CONSTRAINT "funcionarios_restaurante_id_restaurantes_id_fk" FOREIGN KEY ("restaurante_id") REFERENCES "public"."restaurantes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "itens_cardapio" ADD CONSTRAINT "itens_cardapio_restaurante_id_restaurantes_id_fk" FOREIGN KEY ("restaurante_id") REFERENCES "public"."restaurantes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "itens_pedido" ADD CONSTRAINT "itens_pedido_pedido_id_pedidos_id_fk" FOREIGN KEY ("pedido_id") REFERENCES "public"."pedidos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "itens_pedido" ADD CONSTRAINT "itens_pedido_item_cardapio_id_itens_cardapio_id_fk" FOREIGN KEY ("item_cardapio_id") REFERENCES "public"."itens_cardapio"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "log_atividades" ADD CONSTRAINT "log_atividades_restaurante_id_restaurantes_id_fk" FOREIGN KEY ("restaurante_id") REFERENCES "public"."restaurantes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "log_atividades" ADD CONSTRAINT "log_atividades_funcionario_id_funcionarios_id_fk" FOREIGN KEY ("funcionario_id") REFERENCES "public"."funcionarios"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opcoes_combo" ADD CONSTRAINT "opcoes_combo_item_cardapio_id_itens_cardapio_id_fk" FOREIGN KEY ("item_cardapio_id") REFERENCES "public"."itens_cardapio"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_restaurante_id_restaurantes_id_fk" FOREIGN KEY ("restaurante_id") REFERENCES "public"."restaurantes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_entregador_id_funcionarios_id_fk" FOREIGN KEY ("entregador_id") REFERENCES "public"."funcionarios"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_funcionario_id_funcionarios_id_fk" FOREIGN KEY ("funcionario_id") REFERENCES "public"."funcionarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solicitacoes_fechamento" ADD CONSTRAINT "solicitacoes_fechamento_restaurante_id_restaurantes_id_fk" FOREIGN KEY ("restaurante_id") REFERENCES "public"."restaurantes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "turnos" ADD CONSTRAINT "turnos_restaurante_id_restaurantes_id_fk" FOREIGN KEY ("restaurante_id") REFERENCES "public"."restaurantes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "turnos" ADD CONSTRAINT "turnos_funcionario_id_funcionarios_id_fk" FOREIGN KEY ("funcionario_id") REFERENCES "public"."funcionarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zonas_entrega" ADD CONSTRAINT "zonas_entrega_restaurante_id_restaurantes_id_fk" FOREIGN KEY ("restaurante_id") REFERENCES "public"."restaurantes"("id") ON DELETE cascade ON UPDATE no action;