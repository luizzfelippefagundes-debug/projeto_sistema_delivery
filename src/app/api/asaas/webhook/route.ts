import { NextResponse } from "next/server";
import { tokenWebhookValido } from "@/lib/asaas";
import { cancelarPagamentoOnline, confirmarPagamentoOnline } from "@/lib/pagamentoOnline";

export async function POST(req: Request) {
  if (!tokenWebhookValido(req.headers.get("asaas-access-token"))) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }

  const payload = (await req.json().catch(() => null)) as { event?: string; payment?: { id?: string } } | null;
  const pagamentoId = payload?.payment?.id;
  console.log("[asaas] webhook", payload?.event, pagamentoId);

  // Evento sem cobrança (ou de outro tipo) responde 200 mesmo assim: o Asaas
  // pausa a fila inteira depois de 15 falhas seguidas.
  if (!pagamentoId) return NextResponse.json({ ok: true });

  // Pix chega como RECEIVED; cartão como CONFIRMED.
  if (payload.event === "PAYMENT_RECEIVED" || payload.event === "PAYMENT_CONFIRMED") {
    await confirmarPagamentoOnline(pagamentoId);
  } else if (payload.event === "PAYMENT_DELETED" || payload.event === "PAYMENT_OVERDUE") {
    await cancelarPagamentoOnline(pagamentoId);
  }

  return NextResponse.json({ ok: true });
}
