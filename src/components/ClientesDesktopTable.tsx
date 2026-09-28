"use client";

import { ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fmtBRL } from "@/lib/data";

const DIAS_SUMINDO = 14;

interface ClienteResumo {
  nome: string;
  qtdPedidos: number;
  totalGasto: number;
  ultimoPedido: Date;
}

function diasAtras(data: Date) {
  return Math.floor((Date.now() - data.getTime()) / (1000 * 60 * 60 * 24));
}

/** Linha inteira clicável (não só o nome) — igual o card já se comporta no
 * celular, pra ficar óbvio que dá pra abrir o histórico completo. */
export default function ClientesDesktopTable({ clientes }: { clientes: ClienteResumo[] }) {
  const router = useRouter();

  return (
    <div className="hidden overflow-x-auto rounded-xl border border-border sm:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Pedidos</TableHead>
            <TableHead>Total gasto</TableHead>
            <TableHead>Ticket médio</TableHead>
            <TableHead>Último pedido</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-8" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {clientes.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground">
                Nenhum cliente de delivery ainda.
              </TableCell>
            </TableRow>
          )}
          {clientes.map((c) => {
            const dias = diasAtras(c.ultimoPedido);
            const estaSumindo = dias > DIAS_SUMINDO;
            return (
              <TableRow
                key={c.nome}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => router.push(`/dono/clientes/${encodeURIComponent(c.nome)}`)}
              >
                <TableCell className="font-medium">{c.nome}</TableCell>
                <TableCell>{c.qtdPedidos}</TableCell>
                <TableCell className="num">{fmtBRL(c.totalGasto)}</TableCell>
                <TableCell className="num">{fmtBRL(c.totalGasto / c.qtdPedidos)}</TableCell>
                <TableCell>{c.ultimoPedido.toLocaleDateString("pt-BR")}</TableCell>
                <TableCell>
                  <Badge className={estaSumindo ? "bg-status-warn-bg text-status-warn-fg" : "bg-status-ok-bg text-status-ok-fg"}>
                    {estaSumindo ? `${dias}d sumido` : "Ativo"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
