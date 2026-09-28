"use client";

import { Minus, Plus, Trash2, TriangleAlert } from "lucide-react";
import { useState, useTransition } from "react";
import { ajustarEstoqueAction, removerControleEstoque } from "@/actions/cardapio.actions";
import AdicionarEstoqueSheet from "@/components/AdicionarEstoqueSheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ItemCardapio } from "@/lib/types";

function StatusBadgeEstoque({ item }: { item: ItemCardapio }) {
  const baixo = (item.estoqueAtual ?? 0) <= (item.estoqueMinimo ?? 0);
  const zerado = (item.estoqueAtual ?? 0) === 0;
  if (zerado) {
    return (
      <Badge className="bg-status-danger-bg text-status-danger-fg">
        <TriangleAlert className="size-3" /> Zerado (pausado)
      </Badge>
    );
  }
  if (baixo) {
    return (
      <Badge className="bg-status-warn-bg text-status-warn-fg">
        <TriangleAlert className="size-3" /> Estoque baixo
      </Badge>
    );
  }
  return <Badge className="bg-status-ok-bg text-status-ok-fg">Ok</Badge>;
}

function CartaoEstoque({ item, onRemover }: { item: ItemCardapio; onRemover: (item: ItemCardapio) => void }) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium">{item.nome}</p>
          <p className="text-xs text-muted-foreground">{item.categoria}</p>
        </div>
        <StatusBadgeEstoque item={item} />
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button
            size="icon-sm"
            variant="outline"
            disabled={pending || (item.estoqueAtual ?? 0) === 0}
            onClick={() => startTransition(() => ajustarEstoqueAction(item.id, -1))}
          >
            <Minus />
          </Button>
          <span className="num w-8 text-center font-semibold">{item.estoqueAtual}</span>
          <Button size="icon-sm" variant="outline" disabled={pending} onClick={() => startTransition(() => ajustarEstoqueAction(item.id, 1))}>
            <Plus />
          </Button>
          <span className="text-xs text-muted-foreground">mín. {item.estoqueMinimo}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => startTransition(() => ajustarEstoqueAction(item.id, 10))}
          >
            + 10
          </Button>
          <Button size="icon-sm" variant="outline" onClick={() => onRemover(item)} aria-label={`Remover ${item.nome} do estoque`}>
            <Trash2 />
          </Button>
        </div>
      </div>
    </div>
  );
}

function LinhaEstoque({ item, onRemover }: { item: ItemCardapio; onRemover: (item: ItemCardapio) => void }) {
  const [pending, startTransition] = useTransition();
  const baixo = (item.estoqueAtual ?? 0) <= (item.estoqueMinimo ?? 0);
  const zerado = (item.estoqueAtual ?? 0) === 0;

  return (
    <TableRow>
      <TableCell className="font-medium">{item.nome}</TableCell>
      <TableCell className="text-muted-foreground">{item.categoria}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Button
            size="icon-sm"
            variant="outline"
            disabled={pending || (item.estoqueAtual ?? 0) === 0}
            onClick={() => startTransition(() => ajustarEstoqueAction(item.id, -1))}
          >
            <Minus />
          </Button>
          <span className="num w-8 text-center font-semibold">{item.estoqueAtual}</span>
          <Button size="icon-sm" variant="outline" disabled={pending} onClick={() => startTransition(() => ajustarEstoqueAction(item.id, 1))}>
            <Plus />
          </Button>
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground">{item.estoqueMinimo}</TableCell>
      <TableCell>
        {zerado ? (
          <Badge className="bg-status-danger-bg text-status-danger-fg">
            <TriangleAlert className="size-3" /> Zerado (pausado)
          </Badge>
        ) : baixo ? (
          <Badge className="bg-status-warn-bg text-status-warn-fg">
            <TriangleAlert className="size-3" /> Estoque baixo
          </Badge>
        ) : (
          <Badge className="bg-status-ok-bg text-status-ok-fg">Ok</Badge>
        )}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => startTransition(() => ajustarEstoqueAction(item.id, 10))}
          >
            + 10
          </Button>
          <Button size="icon-sm" variant="outline" onClick={() => onRemover(item)} aria-label={`Remover ${item.nome} do estoque`}>
            <Trash2 />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export default function EstoqueManager({
  itens,
  itensSemEstoque,
}: {
  itens: ItemCardapio[];
  itensSemEstoque: { id: string; nome: string; categoria: string }[];
}) {
  const baixos = itens.filter((i) => (i.estoqueAtual ?? 0) <= (i.estoqueMinimo ?? 0));
  const [adicionando, setAdicionando] = useState(false);
  const [removendo, setRemovendo] = useState<ItemCardapio | null>(null);
  const [pendingRemover, startTransitionRemover] = useTransition();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setAdicionando(true)}>
          Adicionar item ao estoque
        </Button>
      </div>

      {baixos.length > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-status-warn-fg/30 bg-status-warn-bg px-4 py-3 text-sm text-status-warn-fg">
          <TriangleAlert className="size-4 shrink-0" />
          {baixos.length} {baixos.length === 1 ? "item está" : "itens estão"} com estoque baixo ou zerado.
        </div>
      )}

      {itens.length === 0 && (
        <p className="text-center text-sm text-muted-foreground">
          Nenhum item com controle de estoque ainda. Clique em &quot;Adicionar item ao estoque&quot; acima.
        </p>
      )}

      <div className="flex flex-col gap-3 sm:hidden">
        {itens.map((item) => (
          <CartaoEstoque key={item.id} item={item} onRemover={setRemovendo} />
        ))}
      </div>

      {itens.length > 0 && (
        <div className="hidden overflow-x-auto rounded-xl border border-border sm:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Em estoque</TableHead>
                <TableHead>Mínimo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-40" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {itens.map((item) => (
                <LinhaEstoque key={item.id} item={item} onRemover={setRemovendo} />
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AdicionarEstoqueSheet itens={itensSemEstoque} open={adicionando} onOpenChange={setAdicionando} />

      <AlertDialog open={!!removendo} onOpenChange={(v) => !v && setRemovendo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover {removendo?.nome} do estoque?</AlertDialogTitle>
            <AlertDialogDescription>
              O item continua no cardápio normalmente, só para de ter controle de quantidade — as vendas não vão mais
              descontar nada. Pode adicionar de volta a qualquer momento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              disabled={pendingRemover}
              onClick={() => {
                if (!removendo) return;
                startTransitionRemover(async () => {
                  await removerControleEstoque(removendo.id);
                  setRemovendo(null);
                });
              }}
            >
              {pendingRemover ? "Removendo…" : "Remover do estoque"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
