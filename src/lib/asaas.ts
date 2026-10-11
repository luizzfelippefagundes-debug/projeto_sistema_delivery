import { timingSafeEqual } from "node:crypto";

const API_URL = process.env.ASAAS_API_URL || "https://api.asaas.com/v3";

export type CobrancaOnline = "PIX" | "CREDIT_CARD";

async function imagemBase64(origem: string): Promise<string> {
  // O Asaas exige imagem em todo item do checkout; usamos o logo da loja.
  const res = await fetch(`${origem}/logo-icon.png`);
  if (!res.ok) throw new Error("Não deu pra carregar o logo pro checkout.");
  return Buffer.from(await res.arrayBuffer()).toString("base64");
}

export async function criarCheckoutAsaas(dados: {
  pedidoId: string;
  origem: string;
  cobranca: CobrancaOnline;
  valor: number;
  descricao: string;
  cliente: { nome: string; telefone: string | null; cpf: string | null };
}): Promise<{ id: string; link: string }> {
  const apiKey = process.env.ASAAS_API_KEY;
  if (!apiKey) throw new Error("Pagamento online indisponível no momento.");

  const urlPedido = `${dados.origem}/pedido/${dados.pedidoId}`;
  const telefone = dados.cliente.telefone?.replace(/\D/g, "") || undefined;
  const cpf = dados.cliente.cpf?.replace(/\D/g, "") || undefined;

  const res = await fetch(`${API_URL}/checkouts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "dashi-sushi",
      access_token: apiKey,
    },
    body: JSON.stringify({
      billingTypes: [dados.cobranca],
      chargeTypes: ["DETACHED"],
      minutesToExpire: 15,
      externalReference: dados.pedidoId,
      callback: { successUrl: urlPedido, cancelUrl: urlPedido, expiredUrl: urlPedido },
      items: [
        {
          externalReference: dados.pedidoId,
          name: `Pedido #${dados.pedidoId.slice(0, 8)}`,
          description: dados.descricao.slice(0, 150),
          quantity: 1,
          value: Math.round(dados.valor * 100) / 100,
          imageBase64: await imagemBase64(dados.origem),
        },
      ],
      customerData: { name: dados.cliente.nome, phone: telefone, cpfCnpj: cpf },
    }),
  });

  if (!res.ok) {
    console.error("[asaas] falha ao criar checkout:", res.status, await res.text());
    throw new Error("Não deu pra gerar o pagamento. Tente de novo em instantes.");
  }
  const checkout = (await res.json()) as { id: string; link: string };
  return { id: checkout.id, link: checkout.link };
}

export function tokenWebhookValido(recebido: string | null): boolean {
  const esperado = process.env.ASAAS_WEBHOOK_TOKEN;
  if (!esperado || !recebido) return false;
  const a = Buffer.from(recebido);
  const b = Buffer.from(esperado);
  return a.length === b.length && timingSafeEqual(a, b);
}
