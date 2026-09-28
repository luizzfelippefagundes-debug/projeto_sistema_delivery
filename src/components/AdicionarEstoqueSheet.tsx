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

export default function AdicionarEstoqueSheet({
  itens,
  open,
  onOpenChange,
}: {
  itens: ItemSemEstoque[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [itemId, setItemId] = useState("");
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
                <Label htmlFor="item-cardapio">Item do cardápio</Label>
                <select
                  id="item-cardapio"
                  value={itemId}
                  onChange={(e) => setItemId(e.target.value)}
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                >
                  <option value="">Escolha um item</option>
                  {[...porCategoria.entries()].map(([categoria, itensDaCategoria]) => (
                    <optgroup key={categoria} label={categoria}>
                      {itensDaCategoria.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.nome}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
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
            <Button disabled={pending || !itemId} onClick={salvar}>
              {pending ? "Adicionando…" : "Adicionar ao estoque"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
