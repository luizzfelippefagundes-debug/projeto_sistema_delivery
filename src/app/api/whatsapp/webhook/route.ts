import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { restaurantes } from "@/db/schema";
import { enviarMensagemWhatsapp, buscarMidiaBase64 } from "@/lib/evolutionApi";
import { getOuCriarConversa, liberarProcessamento, travarProcessamento } from "@/db/queries/conversasWhatsapp";
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

  const eAudio = !!(mensagemObj?.audioMessage ?? mensagemObj?.pttMessage);

  // Objeto completo para buscar mídia no Evolution API
  const mensagemRaw = chave ? { key: chave, message: mensagemObj } : null;

  return {
    remoteJid,
    fromMe: chave?.fromMe ?? false,
    texto: typeof texto === "string" ? texto : null,
    eAudio,
    mensagemRaw,
  };
}

async function transcreverAudio(instancia: string, mensagemRaw: Record<string, unknown>): Promise<string | null> {
  const midia = await buscarMidiaBase64(instancia, mensagemRaw);
  if (!midia) return null;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const buffer = Buffer.from(midia.base64, "base64");
  const ext = midia.mimetype.split("/")[1]?.split(";")[0] ?? "ogg";

  const form = new FormData();
  form.append("file", new Blob([buffer], { type: midia.mimetype }), `audio.${ext}`);
  form.append("model", "whisper-1");
  form.append("language", "pt");

  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });

  if (!res.ok) return null;
  const json = (await res.json()) as { text?: string };
  return json.text?.trim() || null;
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

  const { remoteJid, fromMe, texto, eAudio, mensagemRaw } = extrairMensagem(payload);
  if (fromMe || !remoteJid) return NextResponse.json({ ok: true });
  if (remoteJid.endsWith("@g.us") || remoteJid === "status@broadcast") return NextResponse.json({ ok: true });

  // Áudio: tenta transcrever com Whisper antes de processar
  let textoFinal = texto;
  if (eAudio && !texto && mensagemRaw) {
    try {
      textoFinal = await transcreverAudio(instancia, mensagemRaw);
    } catch (e) {
      console.error("[whatsapp webhook] erro ao transcrever áudio:", e);
    }
    if (!textoFinal) {
      const telefone = remoteJid.split("@")[0];
      const [restaurante] = await getDb().select().from(restaurantes).where(eq(restaurantes.instanciaWhatsapp, instancia));
      if (restaurante) await enviarMensagemWhatsapp(instancia, telefone, "Não consegui entender o áudio. Pode digitar o que precisa? 😊");
      return NextResponse.json({ ok: true });
    }
    // Áudio transcrito como saudação → trata igual a texto "oi" (mostra menu)
    if (/^(oi|olá|ola|oii+|e aí|eai|bom dia|boa tarde|boa noite|tudo bem|tudo bom|salve|opa|hey)\b/i.test(textoFinal.trim())) {
      textoFinal = "oi";
    }
  }

  if (!textoFinal) return NextResponse.json({ ok: true });

  const [restaurante] = await getDb().select().from(restaurantes).where(eq(restaurantes.instanciaWhatsapp, instancia));
  if (!restaurante) return NextResponse.json({ ok: true });

  const telefone = remoteJid.split("@")[0];

  // Trava atômica: se já existe um processamento em curso pra esse número,
  // descarta silenciosamente — o cliente vai receber a resposta do processamento anterior.
  const conversa = await getOuCriarConversa(restaurante.id, telefone);
  const travou = await travarProcessamento(conversa.id);
  if (!travou) {
    console.warn("[whatsapp webhook] mensagem descartada — processamento em curso:", telefone);
    return NextResponse.json({ ok: true });
  }

  try {
    const resposta = await processarMensagemWhatsapp(restaurante.id, telefone, textoFinal, restaurante.nome);
    await enviarMensagemWhatsapp(instancia, telefone, resposta);
  } catch (e) {
    console.error("[whatsapp webhook] erro processando mensagem:", e);
  } finally {
    await liberarProcessamento(conversa.id).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
