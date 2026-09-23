"use client";

import { Printer } from "lucide-react";
import { useState } from "react";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  observacao: string | null;
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
      <div className="flex flex-col gap-3 sm:hidden">
        {pedidos.length === 0 && <p className="text-sm text-muted-foreground">Nenhum pedido nesse período.</p>}
        {pedidos.map(({ pedido: p, itens }) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setSelecionado({ pedido: p, itens })}
            className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 text-left"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium">{origemLabel(p)}</p>
                <p className="text-xs text-muted-foreground">
                  {p.criadoEm.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              <StatusBadge status={p.status} />
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{itens.length} item(ns) · {p.formaPagamento ? PAGAMENTO_LABEL[p.formaPagamento] : "—"}</span>
              <span className="num font-semibold text-foreground">{fmtBRL(p.total)}</span>
            </div>
          </button>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-xl border border-border sm:block">
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

      <Dialog open={!!selecionado} onOpenChange={(v) => !v && setSelecionado(null)}>
        <DialogContent className="flex max-h-[85vh] w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
          <DialogHeader className="p-4">
            <DialogTitle>{selecionado ? origemLabel(selecionado.pedido) : ""}</DialogTitle>
          </DialogHeader>
          {selecionado && (
            <div className="flex flex-col gap-4 overflow-y-auto px-4 pb-4">
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

              <div className="flex flex-col gap-1.5 border-t border-border pt-3">
                {selecionado.itens.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <div>
                      <span className="text-muted-foreground">
                        {item.quantidade}x {item.nome}
                      </span>
                      {item.observacao && <p className="text-xs text-muted-foreground">↳ {item.observacao}</p>}
                    </div>
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

              <a href={`/imprimir/${selecionado.pedido.id}`} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="w-full">
                  <Printer /> Reimprimir comanda
                </Button>
              </a>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
