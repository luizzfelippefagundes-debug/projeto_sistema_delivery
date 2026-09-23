"use client";

import { Check } from "lucide-react";

const ETAPAS = [
  { chave: "carrinho", label: "Sacola" },
  { chave: "entrega", label: "Entrega" },
  { chave: "resumo", label: "Resumo" },
  { chave: "pagamento", label: "Pagamento" },
] as const;

export type EtapaCheckout = (typeof ETAPAS)[number]["chave"];

/** Indicador de progresso do checkout — números conectados por uma barra
 * que preenche com animação conforme a etapa avança, pra pessoa saber onde
 * está sem precisar adivinhar. Some sozinho na tela de confirmação. */
export default function CheckoutStepper({ etapaAtual }: { etapaAtual: string }) {
  const indiceAtual = ETAPAS.findIndex((e) => e.chave === etapaAtual);
  if (indiceAtual === -1) return null;

  return (
    <div className="flex items-start px-4 pb-4">
      {ETAPAS.map((etapa, i) => {
        const concluida = i < indiceAtual;
        const ativa = i === indiceAtual;
        return (
          <div key={etapa.chave} className={`flex items-center ${i < ETAPAS.length - 1 ? "flex-1" : ""}`}>
            <div className="flex shrink-0 flex-col items-center gap-1">
              <div
                className={`flex size-6 items-center justify-center rounded-full text-xs font-semibold transition-all duration-300 ${
                  concluida
                    ? "bg-primary text-primary-foreground"
                    : ativa
                      ? "bg-primary text-primary-foreground ring-4 ring-primary/25"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {concluida ? <Check className="size-3.5" /> : i + 1}
              </div>
              <span
                className={`text-[10px] font-medium whitespace-nowrap transition-colors duration-300 ${
                  ativa ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {etapa.label}
              </span>
            </div>
            {i < ETAPAS.length - 1 && (
              <div className="mx-1 h-0.5 flex-1 -translate-y-2.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                  style={{ width: concluida ? "100%" : "0%" }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
