"use client";

import { Printer, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Dispara a caixa de impressão do navegador assim que a página abre — a
 * pessoa escolhe a impressora térmica ali (uma vez configurada como
 * impressora padrão do sistema, é só confirmar). O botão "Imprimir" fica
 * de reserva caso o navegador bloqueie o print automático.
 *
 * "Fechar" existe porque essa página sempre abre numa aba nova (sem
 * histórico próprio) — sem um jeito explícito de sair, o botão/gesto de
 * voltar do celular fecha a aba sozinho e dá a impressão de que o app
 * inteiro travou ou fechou. Tenta fechar a aba (funciona por ter sido
 * aberta via `window.open` no código que chama essa página) e, se não
 * conseguir, volta pra tela anterior. */
export default function AutoPrint() {
  const router = useRouter();

  useEffect(() => {
    const id = setTimeout(() => window.print(), 300);
    return () => clearTimeout(id);
  }, []);

  function fechar() {
    window.close();
    setTimeout(() => router.back(), 300);
  }

  return (
    <div className="no-print fixed inset-x-0 bottom-4 flex justify-center gap-2 px-4">
      <button
        type="button"
        onClick={() => window.print()}
        className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg"
      >
        <Printer className="size-4" /> Imprimir
      </button>
      <button
        type="button"
        onClick={fechar}
        className="flex items-center gap-2 rounded-full bg-secondary px-5 py-2.5 text-sm font-semibold text-secondary-foreground shadow-lg"
      >
        <X className="size-4" /> Fechar
      </button>
    </div>
  );
}
