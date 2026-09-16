"use client";

import { Printer } from "lucide-react";
import { useEffect } from "react";

/** Dispara a caixa de impressão do navegador assim que a página abre — a
 * pessoa escolhe a impressora térmica ali (uma vez configurada como
 * impressora padrão do sistema, é só confirmar). O botão "Imprimir" fica
 * de reserva caso o navegador bloqueie o print automático. */
export default function AutoPrint() {
  useEffect(() => {
    const id = setTimeout(() => window.print(), 300);
    return () => clearTimeout(id);
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print fixed bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg"
    >
      <Printer className="size-4" /> Imprimir
    </button>
  );
}
