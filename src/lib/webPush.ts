import { eq, inArray } from "drizzle-orm";
import webpush from "web-push";
import { getDb } from "../db";
import { funcionarios, pushSubscriptions } from "../db/schema";
import type { PapelFuncionario } from "./types";

let configurado = false;

function configurar() {
  if (configurado) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return;
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:contato@dashisushi.com.br", publicKey, privateKey);
  configurado = true;
}

/** Avisa por push quem, naquele restaurante, cobre um dos papéis
 * informados (a dona sempre recebe, já que enxerga tudo) — disparado
 * quando um pedido novo chega, no lugar do alerta sonoro. Nunca derruba
 * quem chamou: qualquer falha de envio só é logada, e inscrições mortas
 * (410/404) são limpas na hora. */
export async function notificarNovoPedido(
  restauranteId: string,
  papeisAlvo: PapelFuncionario[],
  mensagem: { title: string; body: string; url: string },
) {
  try {
    configurar();
    if (!configurado) return;

    const db = getDb();
    const staff = await db.select().from(funcionarios).where(eq(funcionarios.restauranteId, restauranteId));
    const alvo = staff.filter(
      (f) =>
        f.ativo &&
        (f.papel === "dono" || papeisAlvo.includes(f.papel) || f.acessosExtras.some((a) => papeisAlvo.includes(a))),
    );
    if (alvo.length === 0) return;

    const subs = await db
      .select()
      .from(pushSubscriptions)
      .where(inArray(pushSubscriptions.funcionarioId, alvo.map((f) => f.id)));

    await Promise.all(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            JSON.stringify(mensagem),
          );
        } catch (e) {
          const status = (e as { statusCode?: number }).statusCode;
          if (status === 404 || status === 410) {
            await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id));
          } else {
            console.error("[push] falha ao enviar notificação:", e);
          }
        }
      }),
    );
  } catch (e) {
    console.error("[push] notificarNovoPedido falhou:", e);
  }
}
