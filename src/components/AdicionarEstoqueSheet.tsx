"use client";

import { Check } from "lucide-react";
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

export default function AdicionarEstoqueSheet({
  itens,
  open,
  onOpenChange,
}: {
  itens: ItemSemEstoque[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [itemId, setItemId] = useState<string>("");
  const [estoqueInicial, setEstoqueInicial] = useState("0");
  const [estoqueMinimo, setEstoqueMinimo] = useState("5");
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const porCategoria = new Map<string, ItemSemEstoque[]>();
  for (const item of itens) {
    const lista = porCategoria.get(item.categoria) ?? [];
    lista.push(item);
    porCategoria.set(item.categoria, lista);
  }
  const itemSelecionado = itens.find((i) => i.id === itemId);

  function handleOpenChange(v: boolean) {
    onOpenChange(v);
    if (v) {
      setItemId("");
      setEstoqueInicial("0");
      setEstoqueMinimo("5");
      setErro(null);
    }
  }

  function salvar() {
    if (!itemId) {
      setErro("Escolha um item.");
      return;
    }
    setErro(null);
    startTransition(async () => {
      try {
        await ativarControleEstoque(itemId, Number(estoqueInicial) || 0, Number(estoqueMinimo) || 0);
        handleOpenChange(false);
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Não deu pra adicionar.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[85vh] w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
        <DialogHeader className="p-4">
          <DialogTitle>Adicionar item ao estoque</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 pb-4">
          {itens.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Todos os itens ativos do cardápio já têm controle de estoque ligado.
            </p>
          ) : (
            <>
              <div className="flex flex-col gap-1.5">
                <Label>Item do cardápio</Label>
                <div className="max-h-56 overflow-y-auto rounded-lg border border-input">
                  {[...porCategoria.entries()].map(([categoria, itensDaCategoria]) => (
                    <div key={categoria}>
                      <p className="sticky top-0 bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                        {categoria}
                      </p>
                      {itensDaCategoria.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setItemId(item.id)}
                          className={`flex w-full items-center justify-between gap-2 border-t border-border px-3 py-2 text-left text-sm first:border-t-0 hover:bg-muted/60 ${
                            itemId === item.id ? "bg-primary/10 font-medium" : ""
                          }`}
                        >
                          {item.nome}
                          {itemId === item.id && <Check className="size-4 shrink-0 text-primary" />}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
                {itemSelecionado && (
                  <p className="text-xs text-muted-foreground">Selecionado: {itemSelecionado.nome}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="estoque-inicial">Estoque inicial</Label>
                  <Input
                    id="estoque-inicial"
                    type="number"
                    min={0}
                    value={estoqueInicial}
                    onChange={(e) => setEstoqueInicial(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="estoque-minimo">Mínimo</Label>
                  <Input
                    id="estoque-minimo"
                    type="number"
                    min={0}
                    value={estoqueMinimo}
                    onChange={(e) => setEstoqueMinimo(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}
          {erro && <p className="text-sm text-destructive">{erro}</p>}
        </div>
        {itens.length > 0 && (
          <div className="mt-auto flex flex-col gap-2 border-t border-border p-4">
            <Button disabled={pending} onClick={salvar}>
              {pending ? "Adicionando…" : "Adicionar ao estoque"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
