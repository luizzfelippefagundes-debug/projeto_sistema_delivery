import { NextResponse } from "next/server";
import { tokenWebhookValido } from "@/lib/asaas";
import { cancelarPagamentoOnline, confirmarPagamentoOnline } from "@/lib/pagamentoOnline";

export async function POST(req: Request) {
  if (!tokenWebhookValido(req.headers.get("asaas-access-token"))) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }

  const payload = (await req.json().catch(() => null)) as { event?: string; checkout?: { id?: string } } | null;
  const checkoutId = payload?.checkout?.id;
  console.log("[asaas] webhook", payload?.event, checkoutId);

  // Evento sem checkout (ou de outro tipo) responde 200 mesmo assim: o Asaas
  // pausa a fila inteira depois de 15 falhas seguidas.
  if (!checkoutId) return NextResponse.json({ ok: true });

  if (payload.event === "CHECKOUT_PAID") {
    await confirmarPagamentoOnline(checkoutId);
  } else if (payload.event === "CHECKOUT_EXPIRED" || payload.event === "CHECKOUT_CANCELED") {
    await cancelarPagamentoOnline(checkoutId);
  }

  return NextResponse.json({ ok: true });
}
