"use client";

import { Bell, BellOff } from "lucide-react";
import { useEffect, useState } from "react";
import { removerPushSubscription, salvarPushSubscription } from "@/actions/push.actions";
import { Button } from "@/components/ui/button";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

/** Botão de sino pra ligar/desligar notificação push de pedido novo no
 * aparelho — some sozinho em navegadores sem suporte (ex: Safari fora de
 * um PWA instalado). Fica na barra de cozinha/atendente. */
export default function NotificacoesPushButton() {
  const [suportado, setSuportado] = useState(false);
  const [inscrito, setInscrito] = useState(false);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    setSuportado(true);
    navigator.serviceWorker.getRegistration("/sw.js").then(async (reg) => {
      const sub = await reg?.pushManager.getSubscription();
      setInscrito(!!sub);
    });
  }, []);

  async function ativar() {
    setCarregando(true);
    try {
      const permissao = await Notification.requestPermission();
      if (permissao !== "granted") return;

      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) throw new Error("Chave pública de notificação não configurada.");

      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      const json = sub.toJSON();
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) throw new Error("Inscrição inválida.");
      await salvarPushSubscription({ endpoint: json.endpoint, p256dh: json.keys.p256dh, auth: json.keys.auth });
      setInscrito(true);
    } catch (e) {
      console.error("[push] falha ao ativar notificações:", e);
    } finally {
      setCarregando(false);
    }
  }

  async function desativar() {
    setCarregando(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration("/sw.js");
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await removerPushSubscription(sub.endpoint);
        await sub.unsubscribe();
      }
      setInscrito(false);
    } finally {
      setCarregando(false);
    }
  }

  if (!suportado) return null;

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      disabled={carregando}
      onClick={inscrito ? desativar : ativar}
      aria-label={inscrito ? "Desativar notificações de pedido novo" : "Ativar notificações de pedido novo"}
      title={inscrito ? "Notificações ativadas" : "Ativar notificações de pedido novo"}
    >
      {inscrito ? <Bell className="fill-current text-primary" /> : <BellOff />}
    </Button>
  );
}
