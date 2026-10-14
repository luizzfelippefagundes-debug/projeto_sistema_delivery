"use client";

import { Clock } from "lucide-react";
import { useSyncExternalStore } from "react";
import { type Horarios, resumoHorarios, statusFuncionamento, textoStatus } from "@/lib/horario";

function assinarMinuto(avisar: () => void) {
  const id = setInterval(avisar, 30_000);
  return () => clearInterval(id);
}

/** Minuto atual no navegador; null no servidor, onde o relógio do cliente
 * não é conhecido (evita o aviso renderizar diferente nos dois lados). */
export function useMinutoAtual(): number | null {
  return useSyncExternalStore(
    assinarMinuto,
    () => Math.floor(Date.now() / 60_000),
    () => null,
  );
}

/** Aberto/fechado agora, recalculado a cada minuto. null até montar no navegador. */
export function useLojaAberta(horarios: Horarios | null): boolean | null {
  const minuto = useMinutoAtual();
  if (!horarios) return true;
  if (minuto == null) return null;
  return statusFuncionamento(horarios, new Date(minuto * 60_000)).aberto;
}

export default function AvisoFuncionamento({ horarios }: { horarios: Horarios | null }) {
  const minuto = useMinutoAtual();
  if (!horarios || minuto == null) return null;
  const status = statusFuncionamento(horarios, new Date(minuto * 60_000));

  return (
    <div
      className={`mx-4 mt-3 flex items-center gap-2.5 rounded-xl border px-3 py-2 text-sm md:mx-6 ${
        status.aberto
          ? "border-status-ok-fg/30 bg-status-ok-bg text-status-ok-fg"
          : "border-status-danger-fg/30 bg-status-danger-bg text-status-danger-fg"
      }`}
    >
      <Clock className="size-4 shrink-0" />
      <div className="min-w-0">
        <p className="font-semibold">{textoStatus(status)}</p>
        <p className="text-xs opacity-80">Delivery: {resumoHorarios(horarios)}</p>
      </div>
    </div>
  );
}
