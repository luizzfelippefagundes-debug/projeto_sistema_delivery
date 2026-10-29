import { NextResponse } from "next/server";
import { buscarPixInter, segredoWebhookValido } from "@/lib/inter";
import { confirmarPagamentoOnline } from "@/lib/pagamentoOnline";

/** O Inter chama aqui a cada Pix recebido na chave. O corpo não é assinado,
 * então o segredo vai no caminho e, mesmo assim, o pagamento só é confirmado
 * depois de perguntar ao Inter se a cobrança está de fato concluída. */
export async function POST(req: Request, { params }: { params: Promise<{ segredo: string }> }) {
  const { segredo } = await params;
  if (!segredoWebhookValido(segredo)) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }

  const payload = (await req.json().catch(() => null)) as { pix?: { txid?: string }[] } | null;
  for (const pix of payload?.pix ?? []) {
    if (!pix.txid) continue;
    console.log("[inter] webhook pix", pix.txid);
    try {
      const cobranca = await buscarPixInter(pix.txid);
      if (cobranca.quitado) await confirmarPagamentoOnline(pix.txid);
    } catch (e) {
      console.error("[inter] falha ao confirmar pix", pix.txid, e);
    }
  }

  // Sempre 200: Pix que não é de pedido (ou erro nosso) não pode travar a fila do banco.
  return NextResponse.json({ ok: true });
}
