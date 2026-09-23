"use server";

import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { pushSubscriptions } from "../db/schema";
import { assertQualquerFuncionario } from "../lib/funcionarioAuth";

export async function salvarPushSubscription(dados: { endpoint: string; p256dh: string; auth: string }) {
  const funcionario = await assertQualquerFuncionario();
  await getDb()
    .insert(pushSubscriptions)
    .values({ funcionarioId: funcionario.id, endpoint: dados.endpoint, p256dh: dados.p256dh, auth: dados.auth })
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: { funcionarioId: funcionario.id, p256dh: dados.p256dh, auth: dados.auth },
    });
}

export async function removerPushSubscription(endpoint: string) {
  await assertQualquerFuncionario();
  await getDb().delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
}
