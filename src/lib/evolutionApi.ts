/** Cliente do Evolution API (self-hosted) — mesmo servidor usado nos
 * outros projetos, cada restaurante com sua própria "instância" (um
 * número de WhatsApp conectado). Sem as env vars configuradas, o envio
 * vira um no-op registrado no log, pra não derrubar o fluxo do bot em
 * ambiente de teste. */
export async function enviarMensagemWhatsapp(instancia: string, numero: string, texto: string): Promise<void> {
  const baseUrl = process.env.EVOLUTION_API_URL;
  const apiKey = process.env.EVOLUTION_API_KEY;

  if (!baseUrl || !apiKey) {
    console.warn("[whatsapp] EVOLUTION_API_URL/EVOLUTION_API_KEY não configurados — mensagem não enviada:", {
      instancia,
      numero,
      texto,
    });
    return;
  }

  const url = `${baseUrl.replace(/\/$/, "")}/message/sendText/${instancia}`;
  const resposta = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: apiKey },
    body: JSON.stringify({ number: numero, text: texto }),
  });

  if (!resposta.ok) {
    const corpo = await resposta.text().catch(() => "");
    console.error("[whatsapp] Falha ao enviar mensagem:", resposta.status, corpo.slice(0, 500));
  }
}
