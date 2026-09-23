export type OrderStatus =
  | "novo"
  | "preparo"
  | "pronto"
  | "rota"
  | "entregue"
  | "finalizado";

export type Origem = "salao" | "delivery";

export type Pagamento = "dinheiro" | "cartao" | "pix";

export interface ItemCardapio {
  id: string;
  nome: string;
  categoria: string;
  descricao: string | null;
  preco: number;
  ativo: boolean;
  imagemUrl: string | null;
  estoqueAtual: number | null;
  estoqueMinimo: number | null;
  qtdPecasEscolha: number | null;
}

export type PapelFuncionario = "dono" | "atendente" | "cozinha" | "motoboy";

export interface ItemCarrinhoWhatsapp {
  itemCardapioId: string;
  nome: string;
  preco: number;
  qtd: number;
}

export interface Funcionario {
  id: string;
  nome: string;
  papel: PapelFuncionario;
  emailConvite: string | null;
  clerkUserId: string | null;
  ativo: boolean;
  acessosExtras: PapelFuncionario[];
}

export interface Turno {
  id: string;
  funcionarioId: string;
  diaSemana: number;
  horaInicio: string;
  horaFim: string;
}

export const DIA_SEMANA_LABEL = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const;
