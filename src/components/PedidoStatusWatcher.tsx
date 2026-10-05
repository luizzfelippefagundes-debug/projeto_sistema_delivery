"use client";

import { useEffect, useRef, useState } from "react";
import OrderTimeline from "@/components/OrderTimeline";
import { pedidoConcluido } from "@/lib/faturamento";
import { STATUS_LABEL } from "@/lib/data";
import type { OrderStatus } from "@/lib/types";

const POLL_INTERVAL = 5_000;

const MENSAGEM_STATUS: Partial<Record<OrderStatus, string>> = {
  preparo: "Seu pedido entrou em preparo! 🍣",
  pronto: "Pedido pronto!",
  rota: "Seu pedido saiu pra entrega! 🛵",
  entregue: "Pedido entregue! Bom apetite 🎉",
  cancelado: "Pedido cancelado.",
};

export default function PedidoStatusWatcher({
  pedidoId,
  statusInicial,
  retiradaInicial,
}: {
  pedidoId: string;
  statusInicial: OrderStatus;
  retiradaInicial: boolean;
}) {
  const [status, setStatus] = useState(statusInicial);
  const [retirada, setRetirada] = useState(retiradaInicial);
  const [banner, setBanner] = useState<string | null>(null);
  const prevStatus = useRef(statusInicial);
  const bannerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (pedidoConcluido({ origem: retirada ? "salao" : "delivery", status })) return;

    const poll = async () => {
      try {
        const res = await fetch(`/api/pedido/${pedidoId}/status`, { cache: "no-store" });
        if (!res.ok) return;
        const data: { status: OrderStatus; retirada: boolean } = await res.json();

        if (data.status !== prevStatus.current) {
          prevStatus.current = data.status;
          setStatus(data.status);
          setRetirada(data.retirada);

          const msg = MENSAGEM_STATUS[data.status] ?? `Status atualizado: ${STATUS_LABEL[data.status]}`;
          setBanner(msg);
          if (bannerTimer.current) clearTimeout(bannerTimer.current);
          bannerTimer.current = setTimeout(() => setBanner(null), 5_000);
        }
      } catch {
        // silently ignore network errors
      }
    };

    const interval = setInterval(poll, POLL_INTERVAL);
    return () => {
      clearInterval(interval);
      if (bannerTimer.current) clearTimeout(bannerTimer.current);
    };
  }, [pedidoId, status, retirada]);

  return (
    <>
      {banner && (
        <div
          role="status"
          aria-live="polite"
          className="animate-in slide-in-from-top-2 fade-in rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground duration-300"
        >
          {banner}
        </div>
      )}
      <OrderTimeline status={status} retirada={retirada} />
    </>
  );
}
