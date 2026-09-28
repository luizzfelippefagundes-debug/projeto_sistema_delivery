"use client";

import { useState, useTransition } from "react";
import { ativarControleEstoque } from "@/actions/cardapio.actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ItemSemEstoque {
  id: string;
  nome: string;
  categoria: string;
}

/** Formulário que abre embaixo do próprio item clicado (tipo acordeão) —
 * escolher e preencher a quantidade vira um passo só, em vez de escolher lá
 * em cima e preencher lá embaixo. */
function FormularioItem({ item, onSalvo }: { item: ItemSemEstoque; onSalvo: () => void }) {
  const [estoqueInicial, setEstoqueInicial] = useState("0");
  const [estoqueMinimo, setEstoqueMinimo] = useState("5");
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function salvar() {
    setErro(null);
    startTransition(async () => {
      try {
        await ativarControleEstoque(item.id, Number(estoqueInicial) || 0, Number(estoqueMinimo) || 0);
        onSalvo();
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Não deu pra adicionar.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-3 border-t border-border bg-muted/30 p-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`estoque-inicial-${item.id}`}>Estoque inicial</Label>
          <Input
            id={`estoque-inicial-${item.id}`}
            type="number"
            min={0}
            value={estoqueInicial}
            onChange={(e) => setEstoqueInicial(e.target.value)}
            autoFocus
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`estoque-minimo-${item.id}`}>Mínimo</Label>
          <Input
            id={`estoque-minimo-${item.id}`}
            type="number"
            min={0}
            value={estoqueMinimo}
            onChange={(e) => setEstoqueMinimo(e.target.value)}
          />
        </div>
      </div>
      {erro && <p className="text-sm text-destructive">{erro}</p>}
      <Button size="sm" disabled={pending} onClick={salvar}>
        {pending ? "Adicionando…" : `Adicionar ${item.nome} ao estoque`}
      </Button>
    </div>
  );
}

export default function AdicionarEstoqueSheet({
  itens,
  open,
  onOpenChange,
}: {
  itens: ItemSemEstoque[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [itemAberto, setItemAberto] = useState<string | null>(null);

  const porCategoria = new Map<string, ItemSemEstoque[]>();
  for (const item of itens) {
    const lista = porCategoria.get(item.categoria) ?? [];
    lista.push(item);
    porCategoria.set(item.categoria, lista);
  }

  function handleOpenChange(v: boolean) {
    onOpenChange(v);
    if (v) setItemAberto(null);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[85vh] w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
        <DialogHeader className="p-4">
          <DialogTitle>Adicionar item ao estoque</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-1.5 px-4 pb-4">
          {itens.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Todos os itens ativos do cardápio já têm controle de estoque ligado.
            </p>
          ) : (
            <div className="max-h-72 overflow-y-auto rounded-lg border border-input">
              {[...porCategoria.entries()].map(([categoria, itensDaCategoria]) => (
                <div key={categoria}>
                  <p className="sticky top-0 bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                    {categoria}
                  </p>
                  {itensDaCategoria.map((item) => {
                    const aberto = itemAberto === item.id;
                    return (
                      <div key={item.id}>
                        <button
                          type="button"
                          onClick={() => setItemAberto(aberto ? null : item.id)}
                          className={`flex w-full items-center justify-between gap-2 border-t border-border px-3 py-2 text-left text-sm first:border-t-0 hover:bg-muted/60 ${
                            aberto ? "font-medium" : ""
                          }`}
                        >
                          {item.nome}
                        </button>
                        {aberto && (
                          <FormularioItem item={item} onSalvo={() => handleOpenChange(false)} />
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
