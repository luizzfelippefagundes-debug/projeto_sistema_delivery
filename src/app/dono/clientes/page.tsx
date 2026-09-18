import Link from "next/link";
import ClientesMobileList from "@/components/ClientesMobileList";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getClientesResumo } from "@/db/queries/clientes";
import { fmtBRL } from "@/lib/data";
import { requireFuncionarioAccess } from "@/lib/funcionarioAuth";

const DIAS_SUMINDO = 14;

function diasAtras(data: Date) {
  return Math.floor((Date.now() - data.getTime()) / (1000 * 60 * 60 * 24));
}

export default async function ClientesPage() {
  const dono = await requireFuncionarioAccess("dono");
  const clientes = await getClientesResumo(dono.restauranteId);

  const totalClientes = clientes.length;
  const sumindo = clientes.filter((c) => diasAtras(c.ultimoPedido) > DIAS_SUMINDO).length;
  const ticketMedioGeral = clientes.length
    ? clientes.reduce((s, c) => s + c.totalGasto, 0) / clientes.reduce((s, c) => s + c.qtdPedidos, 0)
    : 0;

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-muted-foreground">
        Clientes que já pediram delivery pela Dashi Sushi, com quantas vezes pediram e quanto gastaram.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="gap-1 py-4">
          <CardContent className="px-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Clientes</p>
            <p className="num font-heading text-xl font-semibold">{totalClientes}</p>
          </CardContent>
        </Card>
        <Card className="gap-1 py-4">
          <CardContent className="px-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ticket médio</p>
            <p className="num font-heading text-xl font-semibold">{fmtBRL(ticketMedioGeral)}</p>
          </CardContent>
        </Card>
        <Card className="gap-1 py-4">
          <CardContent className="px-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sumindo (+{DIAS_SUMINDO}d sem pedir)</p>
            <p className="num font-heading text-xl font-semibold">{sumindo}</p>
          </CardContent>
        </Card>
      </div>

      <ClientesMobileList clientes={clientes} />

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
            </TableRow>
          </TableHeader>
          <TableBody>
            {clientes.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Nenhum cliente de delivery ainda.
                </TableCell>
              </TableRow>
            )}
            {clientes.map((c) => {
              const dias = diasAtras(c.ultimoPedido);
              const estaSumindo = dias > DIAS_SUMINDO;
              return (
                <TableRow key={c.nome}>
                  <TableCell className="font-medium">
                    <Link href={`/dono/clientes/${encodeURIComponent(c.nome)}`} className="hover:underline">
                      {c.nome}
                    </Link>
                  </TableCell>
                  <TableCell>{c.qtdPedidos}</TableCell>
                  <TableCell className="num">{fmtBRL(c.totalGasto)}</TableCell>
                  <TableCell className="num">{fmtBRL(c.totalGasto / c.qtdPedidos)}</TableCell>
                  <TableCell>{c.ultimoPedido.toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell>
                    <Badge className={estaSumindo ? "bg-status-warn-bg text-status-warn-fg" : "bg-status-ok-bg text-status-ok-fg"}>
                      {estaSumindo ? `${dias}d sumido` : "Ativo"}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
