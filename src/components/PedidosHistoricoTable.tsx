"use client";

import { useState } from "react";
import StatusBadge from "@/components/StatusBadge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fmtBRL, origemLabel } from "@/lib/data";
import type { OrderStatus, Pagamento } from "@/lib/types";

interface ItemPedido {
  id: string;
  nome: string;
  preco: number;
  quantidade: number;
}

interface Pedido {
  id: string;
  criadoEm: Date;
  origem: "salao" | "delivery";
  mesa: number | null;
  clienteNome: string | null;
  telefoneCliente: string | null;
  endereco: string | null;
  status: OrderStatus;
  formaPagamento: Pagamento | null;
  total: number;
}

const PAGAMENTO_LABEL: Record<Pagamento, string> = {
  dinheiro: "Dinheiro",
  cartao: "Cartão",
  pix: "Pix",
};

export default function PedidosHistoricoTable({
  pedidos,
}: {
  pedidos: { pedido: Pedido; itens: ItemPedido[] }[];
}) {
  const [selecionado, setSelecionado] = useState<{ pedido: Pedido; itens: ItemPedido[] } | null>(null);

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead>Itens</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Pagto</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pedidos.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Nenhum pedido nesse período.
                </TableCell>
              </TableRow>
            )}
            {pedidos.map(({ pedido: p, itens }) => (
              <TableRow
                key={p.id}
                className="cursor-pointer"
                onClick={() => setSelecionado({ pedido: p, itens })}
              >
                <TableCell className="whitespace-nowrap text-sm">
                  {p.criadoEm.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                </TableCell>
                <TableCell>{origemLabel(p)}</TableCell>
                <TableCell>{itens.length}</TableCell>
                <TableCell className="num">{fmtBRL(p.total)}</TableCell>
                <TableCell>
                  <StatusBadge status={p.status} />
                </TableCell>
                <TableCell>{p.formaPagamento ? PAGAMENTO_LABEL[p.formaPagamento] : "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Sheet open={!!selecionado} onOpenChange={(v) => !v && setSelecionado(null)}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{selecionado ? origemLabel(selecionado.pedido) : ""}</SheetTitle>
          </SheetHeader>
          {selecionado && (
            <div className="flex flex-col gap-4 px-4">
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span>
                  {selecionado.pedido.criadoEm.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                </span>
                <StatusBadge status={selecionado.pedido.status} />
              </div>

              {selecionado.pedido.telefoneCliente && (
                <p className="text-sm">
                  <span className="text-muted-foreground">Telefone: </span>
                  {selecionado.pedido.telefoneCliente}
                </p>
              )}
              {selecionado.pedido.endereco && (
                <p className="text-sm">
                  <span className="text-muted-foreground">Endereço: </span>
                  {selecionado.pedido.endereco}
                </p>
              )}

              <div className="flex flex-col gap-1 border-t border-border pt-3">
                {selecionado.itens.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {item.quantidade}x {item.nome}
                    </span>
                    <span className="num">{fmtBRL(item.preco * item.quantidade)}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between border-t border-border pt-3 text-sm font-semibold">
                <span>Total</span>
                <span className="num">{fmtBRL(selecionado.pedido.total)}</span>
              </div>

              <p className="text-sm text-muted-foreground">
                Pagamento: {selecionado.pedido.formaPagamento ? PAGAMENTO_LABEL[selecionado.pedido.formaPagamento] : "—"}
              </p>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
