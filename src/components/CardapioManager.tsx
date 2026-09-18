"use client";

import { ImageOff, MoreHorizontal, Plus } from "lucide-react";
import { useState, useTransition } from "react";
import { alternarAtivoItemCardapio } from "@/actions/cardapio.actions";
import ItemCardapioSheet from "@/components/ItemCardapioSheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fmtBRL } from "@/lib/data";
import type { ItemCardapio } from "@/lib/types";

const CATEGORY_TINT = [
  "bg-status-danger-bg text-status-danger-fg",
  "bg-status-neutral-bg text-status-neutral-fg",
  "bg-status-warn-bg text-status-warn-fg",
  "bg-status-ok-bg text-status-ok-fg",
];

function ToggleAtivoItem({ item }: { item: ItemCardapio }) {
  const [pending, startTransition] = useTransition();
  return (
    <DropdownMenuItem
      disabled={pending}
      onClick={() => startTransition(() => alternarAtivoItemCardapio(item.id, !item.ativo))}
    >
      {item.ativo ? "Desativar" : "Ativar"}
    </DropdownMenuItem>
  );
}

export default function CardapioManager({
  itens,
  categorias,
}: {
  itens: ItemCardapio[];
  categorias: string[];
}) {
  const [sheetAberto, setSheetAberto] = useState(false);
  const [itemEmEdicao, setItemEmEdicao] = useState<ItemCardapio | null>(null);

  const porCategoria = categorias.map((cat) => ({
    categoria: cat,
    itens: itens.filter((i) => i.categoria === cat),
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-end">
        <Button
          onClick={() => {
            setItemEmEdicao(null);
            setSheetAberto(true);
          }}
        >
          <Plus /> Novo item
        </Button>
      </div>

      {porCategoria.map(({ categoria, itens: itensDaCategoria }, idx) => (
        <div key={categoria}>
          <h3 className="mb-2 font-heading text-lg font-semibold">{categoria}</h3>
          <div className="overflow-x-auto rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Estoque</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {itensDaCategoria.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md ${
                            item.imagemUrl ? "border border-border" : CATEGORY_TINT[idx % CATEGORY_TINT.length]
                          }`}
                        >
                          {item.imagemUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.imagemUrl} alt="" className="size-full object-cover" />
                          ) : (
                            <ImageOff className="size-4" />
                          )}
                        </div>
                        {item.nome}
                      </div>
                    </TableCell>
                    <TableCell className="num">{fmtBRL(item.preco)}</TableCell>
                    <TableCell>
                      {item.estoqueAtual == null ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : (
                        <Badge
                          className={
                            item.estoqueAtual === 0
                              ? "bg-status-danger-bg text-status-danger-fg"
                              : item.estoqueAtual <= (item.estoqueMinimo ?? 0)
                                ? "bg-status-warn-bg text-status-warn-fg"
                                : "bg-status-ok-bg text-status-ok-fg"
                          }
                        >
                          {item.estoqueAtual} un.
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={item.ativo ? "bg-status-ok-bg text-status-ok-fg" : "bg-status-muted-bg text-status-muted-fg"}>
                        {item.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                          <MoreHorizontal />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setItemEmEdicao(item);
                              setSheetAberto(true);
                            }}
                          >
                            Editar
                          </DropdownMenuItem>
                          <ToggleAtivoItem item={item} />
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ))}

      <ItemCardapioSheet
        categorias={categorias}
        item={itemEmEdicao}
        open={sheetAberto}
        onOpenChange={setSheetAberto}
      />
    </div>
  );
}
