import { timingSafeEqual } from "node:crypto";
import type { TaxaCartaoOnline } from "./taxaMaquininha";

const API_URL = process.env.ASAAS_API_URL || "https://api.asaas.com/v3";

export type CobrancaOnline = "PIX" | "CREDIT_CARD";

/** Menor cobrança que o Asaas aceita. */
export const VALOR_MINIMO_ONLINE = 5;

/** Ligado só depois que a conta do Asaas for aprovada; até lá o cliente paga na entrega. */
export function pagamentoOnlineAtivo(): boolean {
  return true;
}

export class AsaasError extends Error {
  constructor(
    public status: number,
    public body: unknown,
  ) {
    super(`Asaas respondeu ${status}`);
    this.name = "AsaasError";
  }
}

async function asaasFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const apiKey = process.env.ASAAS_API_KEY;
  if (!apiKey) throw new Error("Pagamento online indisponível no momento.");

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "dashi-sushi",
      access_token: apiKey,
      ...init?.headers,
    },
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    // Nunca logar o corpo da requisição: no cartão ele leva número e CVV.
    console.error("[asaas] erro", init?.method ?? "GET", path, res.status, JSON.stringify(body));
    throw new AsaasError(res.status, body);
  }
  return body as T;
}

/** Primeira mensagem de erro que o Asaas devolveu, pra mostrar pro cliente. */
export function mensagemErroAsaas(err: unknown): string | null {
  if (!(err instanceof AsaasError)) return null;
  const errors = (err.body as { errors?: Array<{ description?: string }> } | null)?.errors;
  return errors?.[0]?.description ?? null;
}

export type StatusPagamentoAsaas =
  | "PENDING"
  | "RECEIVED"
  | "CONFIRMED"
  | "OVERDUE"
  | "REFUNDED"
  | "RECEIVED_IN_CASH"
  | (string & {});

export interface PagamentoAsaas {
  id: string;
  status: StatusPagamentoAsaas;
  /** Com a taxa do cartão já somada — pode ser maior que o total do pedido. */
  value: number;
}

export function pagamentoQuitado(status: StatusPagamentoAsaas): boolean {
  return status === "RECEIVED" || status === "CONFIRMED" || status === "RECEIVED_IN_CASH";
}

/** Cria o cliente e a cobrança avulsa do pedido. O pagamento em si acontece
 * na nossa página do pedido: Pix pelo QR Code, cartão por `pagarComCartao`. */
export async function criarCobrancaAsaas(dados: {
  pedidoId: string;
  cobranca: CobrancaOnline;
  valor: number;
  descricao: string;
  cliente: { nome: string; telefone: string | null; cpf: string };
}): Promise<PagamentoAsaas> {
  const telefone = dados.cliente.telefone?.replace(/\D/g, "") || undefined;
  const cliente = await asaasFetch<{ id: string }>("/customers", {
    method: "POST",
    body: JSON.stringify({
      name: dados.cliente.nome,
      cpfCnpj: dados.cliente.cpf.replace(/\D/g, ""),
      mobilePhone: telefone,
      notificationDisabled: true,
    }),
  });

  return asaasFetch<PagamentoAsaas>("/payments", {
    method: "POST",
    body: JSON.stringify({
      customer: cliente.id,
      billingType: dados.cobranca,
      value: Math.round(dados.valor * 100) / 100,
      dueDate: hojeEmSaoPaulo(),
      description: dados.descricao.slice(0, 500),
      externalReference: dados.pedidoId,
    }),
  });
}

function hojeEmSaoPaulo(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

export function buscarPagamentoAsaas(id: string): Promise<PagamentoAsaas> {
  return asaasFetch<PagamentoAsaas>(`/payments/${encodeURIComponent(id)}`);
}

export async function apagarPagamentoAsaas(id: string): Promise<void> {
  await asaasFetch(`/payments/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export interface PixQrCode {
  encodedImage: string;
  payload: string;
}

export function buscarPixQrCode(id: string): Promise<PixQrCode> {
  return asaasFetch<PixQrCode>(`/payments/${encodeURIComponent(id)}/pixQrCode`);
}

export interface DadosCartao {
  holderName: string;
  number: string;
  expiryMonth: string;
  expiryYear: string;
  ccv: string;
}

export interface TitularCartao {
  name: string;
  email: string;
  cpfCnpj: string;
  postalCode: string;
  addressNumber: string;
  phone: string;
}

/** Dados do cartão só passam em memória até o Asaas: nunca gravar nem logar. */
export function pagarComCartao(
  id: string,
  creditCard: DadosCartao,
  creditCardHolderInfo: TitularCartao,
): Promise<PagamentoAsaas> {
  return asaasFetch<PagamentoAsaas>(`/payments/${encodeURIComponent(id)}/payWithCreditCard`, {
    method: "POST",
    body: JSON.stringify({ creditCard, creditCardHolderInfo }),
  });
}

interface TaxasDaConta {
  payment?: {
    creditCard?: {
      operationValue?: number;
      oneInstallmentPercentage?: number;
      discountOneInstallmentPercentage?: number | null;
      discountExpiration?: string | null;
    };
  };
}

/** Usada se a API das taxas falhar: tabela padrão do Asaas pro crédito à vista. */
const TAXA_CARTAO_PADRAO: TaxaCartaoOnline = { percentual: 2.99, fixo: 0.49 };
const UMA_HORA = 60 * 60_000;
let taxaEmCache: { taxa: TaxaCartaoOnline; em: number } | null = null;

/** Tarifa que o Asaas cobra da conta no crédito à vista, já com a promoção
 * quando ainda estiver valendo. Guardada por 1 hora pra não consultar a API
 * a cada abertura do cardápio. */
export async function buscarTaxaCartaoAsaas(): Promise<TaxaCartaoOnline> {
  if (taxaEmCache && Date.now() - taxaEmCache.em < UMA_HORA) return taxaEmCache.taxa;
  try {
    const cartao = (await asaasFetch<TaxasDaConta>("/myAccount/fees/")).payment?.creditCard;
    if (cartao?.oneInstallmentPercentage == null || cartao.operationValue == null) {
      throw new Error("resposta sem taxa do cartão");
    }
    const promocaoValendo =
      cartao.discountOneInstallmentPercentage != null &&
      (!cartao.discountExpiration || new Date(cartao.discountExpiration.replace(" ", "T") + "-03:00") > new Date());
    const taxa = {
      percentual: promocaoValendo ? cartao.discountOneInstallmentPercentage! : cartao.oneInstallmentPercentage,
      fixo: cartao.operationValue,
    };
    taxaEmCache = { taxa, em: Date.now() };
    return taxa;
  } catch (e) {
    console.error("[asaas] falha ao buscar taxas da conta, usando a tabela padrão", e);
    return TAXA_CARTAO_PADRAO;
  }
}

export function tokenWebhookValido(recebido: string | null): boolean {
  const esperado = process.env.ASAAS_WEBHOOK_TOKEN;
  if (!esperado || !recebido) return false;
  const a = Buffer.from(recebido);
  const b = Buffer.from(esperado);
  return a.length === b.length && timingSafeEqual(a, b);
}
