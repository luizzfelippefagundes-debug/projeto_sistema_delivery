import { NextResponse } from "next/server";
import { registrarWebhookPixInter, segredoWebhookValido } from "@/lib/inter";

/** Uso único, na instalação: avisa o Inter pra onde mandar os Pix recebidos.
 * Abrir /api/inter/registrar-webhook?segredo=<INTER_WEBHOOK_SEGREDO> no navegador. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const segredo = url.searchParams.get("segredo") ?? "";
  if (!segredoWebhookValido(segredo)) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }
  const webhookUrl = `${url.origin}/api/inter/webhook/${encodeURIComponent(segredo)}`;
  try {
    await registrarWebhookPixInter(webhookUrl);
    return NextResponse.json({ ok: true, webhook: `${url.origin}/api/inter/webhook/***` });
  } catch (e) {
    console.error("[inter] falha ao registrar webhook", e);
    return NextResponse.json({ ok: false, erro: e instanceof Error ? e.message : "falha" }, { status: 500 });
  }
}
