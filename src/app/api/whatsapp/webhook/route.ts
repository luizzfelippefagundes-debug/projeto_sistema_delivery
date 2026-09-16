import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { restaurantes } from "@/db/schema";
import { enviarMensagemWhatsapp } from "@/lib/evolutionApi";
import { processarMensagemWhatsapp } from "@/lib/whatsappBot";

interface ChavesMensagem {
  remoteJid?: string;
  fromMe?: boolean;
}

/** O Evolution API não tem um formato 100% estável entre versões — às
 * vezes `key`/`message` vêm direto em `data`, às vezes um nível mais
 * embaixo, dentro de `data.message`. Tenta as duas formas, igual o bot da
 * barbearia já faz. */
function extrairMensagem(payload: Record<string, unknown>) {
  const dados = (payload.data as Record<string, unknown>) ?? {};
  let chave = dados.key as ChavesMensagem | undefined;
  let mensagemObj = dados.message as Record<string, unknown> | undefined;

  if (!chave && mensagemObj) {
    chave = mensagemObj.key as ChavesMensagem | undefined;
    mensagemObj = mensagemObj.message as Record<string, unknown> | undefined;
  }

  const remoteJid = chave?.remoteJid ?? "";
  const texto =
    (mensagemObj?.conversation as string | undefined) ??
    (mensagemObj?.extendedTextMessage as Record<string, unknown> | undefined)?.text;

  return { remoteJid, fromMe: chave?.fromMe ?? false, texto: typeof texto === "string" ? texto : null };
}

export async function POST(request: Request) {
  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  const evento = String(payload.event ?? "").toLowerCase();
  if (evento !== "messages.upsert") return NextResponse.json({ ok: true });

  const instancia = payload.instance as string | undefined;
  if (!instancia) return NextResponse.json({ ok: true });

  const { remoteJid, fromMe, texto } = extrairMensagem(payload);
  if (fromMe || !texto || !remoteJid) return NextResponse.json({ ok: true });
  if (remoteJid.endsWith("@g.us") || remoteJid === "status@broadcast") return NextResponse.json({ ok: true });

  const [restaurante] = await getDb().select().from(restaurantes).where(eq(restaurantes.instanciaWhatsapp, instancia));
  if (!restaurante) return NextResponse.json({ ok: true });

  const telefone = remoteJid.split("@")[0];

  try {
    const resposta = await processarMensagemWhatsapp(restaurante.id, telefone, texto);
    await enviarMensagemWhatsapp(instancia, telefone, resposta);
  } catch (e) {
    console.error("[whatsapp webhook] erro processando mensagem:", e);
  }

  return NextResponse.json({ ok: true });
}
