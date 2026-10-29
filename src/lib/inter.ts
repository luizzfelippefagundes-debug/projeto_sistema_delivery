import { timingSafeEqual } from "node:crypto";
import { request } from "node:https";

/** Pix direto pelo Banco Inter PJ (API Pix padrão do Banco Central). Dinheiro
 * cai na hora na conta, sem intermediário. Ligado com INTER_PIX_ATIVO=true;
 * enquanto isso o site continua no Asaas. */

const API_URL = process.env.INTER_API_URL || "https://cdpj.partners.bancointer.com.br";
const ESCOPOS = "cob.write cob.read pix.read webhook.write webhook.read";

export function pixInterAtivo(): boolean {
  return process.env.INTER_PIX_ATIVO === "true";
}

/** Com o Inter ligado só o Pix é online; cartão vira pagamento na entrega, na maquininha. */
export function formaPagaOnline(forma: string): boolean {
  if (forma === "dinheiro") return false;
  return !pixInterAtivo() || forma === "pix";
}

/** Id de cobrança do Asaas sempre começa com "pay_"; o do Inter é o txid do Pix. */
export function ehPagamentoInter(id: string): boolean {
  return !id.startsWith("pay_");
}

/** txid do Pix: de 26 a 35 letras/números — o uuid do pedido sem os traços tem 32. */
export function txidDoPedido(pedidoId: string): string {
  return pedidoId.replace(/-/g, "");
}

export class InterError extends Error {
  constructor(
    public status: number,
    public body: unknown,
  ) {
    super(`Inter respondeu ${status}`);
    this.name = "InterError";
  }
}

/** Certificado e chave chegam por variável de ambiente, em base64 (ou PEM puro). */
function pem(valor: string | undefined): string | undefined {
  if (!valor) return undefined;
  const limpo = valor.trim().replace(/\\n/g, "\n");
  return limpo.includes("-----BEGIN") ? limpo : Buffer.from(limpo, "base64").toString("utf8");
}

function chamar(
  caminho: string,
  opcoes: { method: string; headers?: Record<string, string>; body?: string },
): Promise<{ status: number; json: unknown }> {
  const cert = pem(process.env.INTER_CERT);
  const key = pem(process.env.INTER_KEY);
  if (!cert || !key) throw new Error("Pix indisponível no momento.");

  return new Promise((resolve, reject) => {
    const req = request(
      `${API_URL}${caminho}`,
      { method: opcoes.method, cert, key, headers: opcoes.headers, timeout: 15_000 },
      (res) => {
        const partes: Buffer[] = [];
        res.on("data", (p: Buffer) => partes.push(p));
        res.on("end", () => {
          const texto = Buffer.concat(partes).toString("utf8");
          let json: unknown = null;
          try {
            json = texto ? JSON.parse(texto) : null;
          } catch {
            json = texto;
          }
          resolve({ status: res.statusCode ?? 0, json });
        });
      },
    );
    req.on("timeout", () => req.destroy(new Error("Inter não respondeu a tempo.")));
    req.on("error", reject);
    if (opcoes.body) req.write(opcoes.body);
    req.end();
  });
}

let tokenEmCache: { valor: string; expiraEm: number } | null = null;

async function token(): Promise<string> {
  if (tokenEmCache && Date.now() < tokenEmCache.expiraEm) return tokenEmCache.valor;
  const clientId = process.env.INTER_CLIENT_ID;
  const clientSecret = process.env.INTER_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("Pix indisponível no momento.");

  const corpo = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "client_credentials",
    scope: ESCOPOS,
  }).toString();
  const { status, json } = await chamar("/oauth/v2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "Content-Length": String(Buffer.byteLength(corpo)) },
    body: corpo,
  });
  const dados = json as { access_token?: string; expires_in?: number } | null;
  if (status !== 200 || !dados?.access_token) {
    console.error("[inter] falha ao pegar token", status);
    throw new InterError(status, null);
  }
  tokenEmCache = { valor: dados.access_token, expiraEm: Date.now() + ((dados.expires_in ?? 3600) - 60) * 1000 };
  return dados.access_token;
}

async function interFetch<T>(caminho: string, method: string, corpo?: unknown): Promise<T> {
  const body = corpo === undefined ? undefined : JSON.stringify(corpo);
  const headers: Record<string, string> = { Authorization: `Bearer ${await token()}` };
  if (body) {
    headers["Content-Type"] = "application/json";
    headers["Content-Length"] = String(Buffer.byteLength(body));
  }
  if (process.env.INTER_CONTA_CORRENTE) headers["x-conta-corrente"] = process.env.INTER_CONTA_CORRENTE;

  const { status, json } = await chamar(caminho, { method, headers, body });
  if (status === 401) tokenEmCache = null;
  if (status < 200 || status >= 300) {
    console.error("[inter] erro", method, caminho, status, JSON.stringify(json));
    throw new InterError(status, json);
  }
  return json as T;
}

type StatusCobranca = "ATIVA" | "CONCLUIDA" | "REMOVIDA_PELO_USUARIO_RECEBEDOR" | "REMOVIDA_PELO_PSP" | (string & {});

interface CobrancaInter {
  txid: string;
  status: StatusCobranca;
  pixCopiaECola?: string;
  valor?: { original?: string };
}

export interface PixInter {
  txid: string;
  valor: number;
  copiaECola: string;
  quitado: boolean;
  /** Cancelada ou vencida: o Pix não pode mais ser pago. */
  encerrado: boolean;
}

function paraPix(c: CobrancaInter): PixInter {
  return {
    txid: c.txid,
    valor: Number(c.valor?.original ?? 0),
    copiaECola: c.pixCopiaECola ?? "",
    quitado: c.status === "CONCLUIDA",
    encerrado: c.status.startsWith("REMOVIDA"),
  };
}

export async function criarPixInter(dados: {
  pedidoId: string;
  valor: number;
  expiracaoSegundos: number;
  descricao: string;
  pagador: { nome: string; cpf: string };
}): Promise<PixInter> {
  const chave = process.env.INTER_PIX_CHAVE;
  if (!chave) throw new Error("Pix indisponível no momento.");
  const txid = txidDoPedido(dados.pedidoId);
  const cobranca = await interFetch<CobrancaInter>(`/pix/v2/cob/${txid}`, "PUT", {
    calendario: { expiracao: dados.expiracaoSegundos },
    devedor: { cpf: dados.pagador.cpf.replace(/\D/g, ""), nome: dados.pagador.nome.slice(0, 200) },
    valor: { original: dados.valor.toFixed(2) },
    chave,
    solicitacaoPagador: dados.descricao.slice(0, 140),
  });
  if (!cobranca.pixCopiaECola) throw new Error("O Inter não devolveu o código Pix.");
  return paraPix({ ...cobranca, txid });
}

export async function buscarPixInter(txid: string): Promise<PixInter> {
  return paraPix(await interFetch<CobrancaInter>(`/pix/v2/cob/${encodeURIComponent(txid)}`, "GET"));
}

/** Cancela a cobrança pra o QR Code não poder mais ser pago. */
export async function cancelarPixInter(txid: string): Promise<void> {
  await interFetch(`/pix/v2/cob/${encodeURIComponent(txid)}`, "PATCH", { status: "REMOVIDA_PELO_USUARIO_RECEBEDOR" });
}

/** O Inter chama `${webhookUrl}/pix` a cada Pix recebido na chave. */
export async function registrarWebhookPixInter(webhookUrl: string): Promise<void> {
  const chave = process.env.INTER_PIX_CHAVE;
  if (!chave) throw new Error("INTER_PIX_CHAVE não configurada.");
  await interFetch(`/pix/v2/webhook/${encodeURIComponent(chave)}`, "PUT", { webhookUrl });
}

/** O Inter não assina o webhook, então o segredo vai no caminho da URL. */
export function segredoWebhookValido(recebido: string): boolean {
  const esperado = process.env.INTER_WEBHOOK_SEGREDO;
  if (!esperado) return false;
  const a = Buffer.from(recebido);
  const b = Buffer.from(esperado);
  return a.length === b.length && timingSafeEqual(a, b);
}
