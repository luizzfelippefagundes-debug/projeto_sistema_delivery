"use client";

import { useState, useTransition } from "react";
import { solicitarFechamentoMesa } from "@/actions/pedidos.actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fmtBRL } from "@/lib/data";

export interface ItemDaConta {
  nome: string;
  preco: number;
  quantidade: number;
}

/** "Minha conta" que o cliente vê pelo QR code — tudo que já foi mandado
 * pra cozinha naquela mesa, com o total, e um botão pra avisar que quer
 * pagar (não fecha sozinho: só avisa o atendente, que confere e cobra). */
export default function ContaMesaDialog({
  mesa,
  restauranteId,
  itens,
  total,
  jaSolicitado = false,
  open,
  onOpenChange,
}: {
  mesa: number;
  restauranteId: string;
  itens: ItemDaConta[];
  total: number;
  /** Já existe um pedido de fechamento pendente feito numa visita anterior. */
  jaSolicitado?: boolean;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [solicitado, setSolicitado] = useState(jaSolicitado);
  const [pending, startTransition] = useTransition();

  function pedirFechamento() {
    startTransition(async () => {
      await solicitarFechamentoMesa(restauranteId, mesa);
      setSolicitado(true);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-sm">
        <DialogHeader className="p-4">
          <DialogTitle>Sua conta · Mesa {mesa}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4">
          {itens.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nada pedido ainda nessa mesa.</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {itens.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {item.quantidade}x {item.nome}
                  </span>
                  <span className="num">{fmtBRL(item.preco * item.quantidade)}</span>
                </div>
              ))}
              <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
                <span>Total</span>
                <span className="num">{fmtBRL(total)}</span>
              </div>
            </div>
          )}

          {itens.length > 0 && (
            <>
              {solicitado ? (
                <p className="rounded-lg bg-status-ok-bg px-3 py-2 text-center text-sm font-medium text-status-ok-fg">
                  Chamamos o atendimento! Já já alguém vem até a mesa.
                </p>
              ) : (
                <Button disabled={pending} onClick={pedirFechamento}>
                  {pending ? "Chamando…" : "Fechar a conta"}
                </Button>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
