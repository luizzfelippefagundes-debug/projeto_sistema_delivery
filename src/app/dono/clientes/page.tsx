import ClientesView from "@/components/ClientesView";
import { Card, CardContent } from "@/components/ui/card";
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
  const totalGastoGeral = clientes.reduce((s, c) => s + c.totalGasto, 0);
  const ticketMedioGeral = clientes.length
    ? totalGastoGeral / clientes.reduce((s, c) => s + c.qtdPedidos, 0)
    : 0;

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-muted-foreground">
        Clientes que já pediram delivery pela Dashi Sushi, com quantas vezes pediram e quanto gastaram.
      </p>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="gap-1 py-4">
          <CardContent className="px-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Clientes</p>
            <p className="num font-heading text-xl font-semibold">{totalClientes}</p>
          </CardContent>
        </Card>
        <Card className="gap-1 py-4">
          <CardContent className="px-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total gasto</p>
            <p className="num font-heading text-xl font-semibold">{fmtBRL(totalGastoGeral)}</p>
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

      <ClientesView clientes={clientes} />
    </div>
  );
}
