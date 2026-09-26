"use client";

import { Minus, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { fmtBRL } from "@/lib/data";
import { useCart, type EscolhaCombo } from "@/lib/cart";
import type { ItemDoCardapio } from "@/components/CardapioItemCard";

export default function ItemDetalheDialog({
  item,
  tint,
  icon: Icon,
  open,
  onOpenChange,
  edicao,
}: {
  item: ItemDoCardapio | null;
  tint: string;
  icon: React.ComponentType<{ className?: string }>;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Presente quando o dialog está editando uma linha já existente na
   * sacola (em vez de adicionar uma nova). */
  edicao?: { cartItemId: string; escolhasIniciais: EscolhaCombo[] };
}) {
  const { add, addComEscolhas, atualizarEscolhas } = useCart();
  const [qtd, setQtd] = useState(1);
  const [escolhas, setEscolhas] = useState<Record<string, number>>({});

  const ehCombo = item?.qtdPecasEscolha != null && (item?.opcoes.length ?? 0) > 0;
  const totalEscolhido = Object.values(escolhas).reduce((s, n) => s + n, 0);
  const restante = (item?.qtdPecasEscolha ?? 0) - totalEscolhido;

  useEffect(() => {
    if (!open) return;
    setQtd(1);
    setEscolhas(
      edicao ? Object.fromEntries(edicao.escolhasIniciais.map((e) => [e.nome, e.quantidade])) : {},
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item]);

  function ajustarEscolha(nome: string, delta: number) {
    setEscolhas((prev) => {
      const atual = prev[nome] ?? 0;
      if (delta > 0) {
        if (restante <= 0) return prev;
        const limite = item?.opcoes.find((o) => o.nome === nome)?.limiteQuantidade;
        if (limite != null && atual >= limite) return prev;
      }
      return { ...prev, [nome]: Math.max(0, atual + delta) };
    });
  }

  function confirmar() {
    if (!item) return;
    if (ehCombo) {
      const lista = Object.entries(escolhas)
        .filter(([, q]) => q > 0)
        .map(([nome, quantidade]) => ({ nome, quantidade }));
      if (edicao) {
        atualizarEscolhas(edicao.cartItemId, lista);
      } else {
        addComEscolhas(item.id, item.nome, item.preco, lista);
      }
    } else {
      add(item.id, item.nome, item.preco, qtd);
    }
    onOpenChange(false);
  }

  const podeAdicionar = !ehCombo || totalEscolhido === item?.qtdPecasEscolha;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
        <DialogHeader className="sr-only">
          <DialogTitle>{item?.nome}</DialogTitle>
        </DialogHeader>

        {item && (
          <div className="flex flex-1 flex-col overflow-y-auto">
            <div className="aspect-video w-full shrink-0 overflow-hidden">
              {item.imagemUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.imagemUrl} alt={item.nome} className="size-full object-cover" />
              ) : (
                <div className={`flex size-full items-center justify-center ${tint}`}>
                  <Icon className="size-10" />
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 p-4">
              <div>
                <h2 className="font-heading text-lg font-semibold leading-snug">{item.nome}</h2>
                {item.descricao && <p className="mt-1 text-sm text-muted-foreground">{item.descricao}</p>}
              </div>
              <span className="num text-lg font-bold text-primary">{fmtBRL(item.preco)}</span>

              {ehCombo && (
                <div className="flex flex-col gap-2 border-t border-border pt-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">Escolha as peças</p>
                    <span
                      className={`num text-sm font-semibold ${totalEscolhido === item.qtdPecasEscolha ? "text-status-ok-fg" : "text-muted-foreground"}`}
                    >
                      {totalEscolhido}/{item.qtdPecasEscolha}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    {item.opcoes.map((op) => {
                      const q = escolhas[op.nome] ?? 0;
                      const noLimite = op.limiteQuantidade != null && q >= op.limiteQuantidade;
                      return (
                        <div key={op.id} className="flex items-center justify-between gap-3 py-1.5">
                          <div>
                            <span className="text-sm">{op.nome}</span>
                            {op.limiteQuantidade != null && (
                              <span className="ml-1.5 text-xs text-muted-foreground">(máx {op.limiteQuantidade})</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              size="icon-sm"
                              variant="outline"
                              disabled={q === 0}
                              onClick={() => ajustarEscolha(op.nome, -1)}
                              aria-label={`Diminuir ${op.nome}`}
                            >
                              <Minus />
                            </Button>
                            <span className="num w-4 text-center text-sm font-semibold">{q}</span>
                            <Button
                              type="button"
                              size="icon-sm"
                              variant="outline"
                              disabled={restante <= 0 || noLimite}
                              onClick={() => ajustarEscolha(op.nome, 1)}
                              aria-label={`Aumentar ${op.nome}`}
                            >
                              <Plus />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {!ehCombo && (
                <div className="flex items-center justify-between border-t border-border pt-3">
                  <span className="text-sm font-semibold">Quantidade</span>
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="outline"
                      disabled={qtd <= 1}
                      onClick={() => setQtd((q) => Math.max(1, q - 1))}
                      aria-label="Diminuir quantidade"
                    >
                      <Minus />
                    </Button>
                    <span className="num w-4 text-center text-sm font-semibold">{qtd}</span>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="outline"
                      onClick={() => setQtd((q) => q + 1)}
                      aria-label="Aumentar quantidade"
                    >
                      <Plus />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-auto border-t border-border p-4">
          <Button className="w-full" disabled={!podeAdicionar} onClick={confirmar}>
            {ehCombo && !podeAdicionar
              ? `Escolha mais ${restante} ${restante === 1 ? "peça" : "peças"}`
              : edicao
                ? "Salvar alterações"
                : `Adicionar · ${fmtBRL((item?.preco ?? 0) * (ehCombo ? 1 : qtd))}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
