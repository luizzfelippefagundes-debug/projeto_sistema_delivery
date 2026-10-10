"use client";

import { useTransition } from "react";
import { setSaborDisponivel } from "@/actions/cardapio.actions";

interface Sabor {
  nome: string;
  ids: string[];
  disponivel: boolean;
}

export default function SaboresClient({ sabores }: { sabores: Sabor[] }) {
  const [pending, startTransition] = useTransition();

  function toggle(nome: string, disponivel: boolean) {
    startTransition(() => setSaborDisponivel(nome, disponivel));
  }

  const disponiveis = sabores.filter((s) => s.disponivel);
  const pausados = sabores.filter((s) => !s.disponivel);

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-muted-foreground">
        Controle quais sabores estão disponíveis hoje. Sabores pausados não aparecem no cardápio.
      </p>

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Disponíveis hoje — {disponiveis.length}
        </h2>
        {disponiveis.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum sabor disponível.</p>
        )}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {disponiveis.map((s) => (
            <button
              key={s.nome}
              type="button"
              disabled={pending}
              onClick={() => toggle(s.nome, false)}
              className="flex items-center justify-between gap-2 rounded-xl border border-border bg-status-ok-bg px-4 py-3 text-left text-sm font-medium text-status-ok-fg transition-opacity hover:opacity-80 disabled:opacity-50"
            >
              <span>{s.nome}</span>
              <span className="text-xs opacity-70">Pausar</span>
            </button>
          ))}
        </div>
      </div>

      {pausados.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Pausados — {pausados.length}
          </h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {pausados.map((s) => (
              <button
                key={s.nome}
                type="button"
                disabled={pending}
                onClick={() => toggle(s.nome, true)}
                className="flex items-center justify-between gap-2 rounded-xl border border-border bg-muted px-4 py-3 text-left text-sm font-medium text-muted-foreground line-through transition-opacity hover:opacity-80 disabled:opacity-50"
              >
                <span>{s.nome}</span>
                <span className="text-xs no-underline opacity-70">Ativar</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
