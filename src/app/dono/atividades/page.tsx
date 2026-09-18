import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAtividades } from "@/db/queries/atividades";
import { requireFuncionarioAccess } from "@/lib/funcionarioAuth";

export default async function AtividadesPage() {
  const dono = await requireFuncionarioAccess("dono");
  const atividades = await getAtividades(dono.restauranteId);

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-muted-foreground">
        Registro das ações administrativas feitas no painel — quem fez o quê e quando.
      </p>

      <div className="flex flex-col gap-3 sm:hidden">
        {atividades.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma atividade registrada ainda.</p>}
        {atividades.map((a) => (
          <div key={a.id} className="flex flex-col gap-1.5 rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium">{a.nomeFuncionario}</span>
              <Badge className="bg-status-neutral-bg text-status-neutral-fg">{a.acao}</Badge>
            </div>
            {a.detalhe && <p className="text-sm text-muted-foreground">{a.detalhe}</p>}
            <p className="text-xs text-muted-foreground">
              {a.criadoEm.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
            </p>
          </div>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-xl border border-border sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Quando</TableHead>
              <TableHead>Quem</TableHead>
              <TableHead>Ação</TableHead>
              <TableHead>Detalhe</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {atividades.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Nenhuma atividade registrada ainda.
                </TableCell>
              </TableRow>
            )}
            {atividades.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                  {a.criadoEm.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                </TableCell>
                <TableCell className="font-medium">{a.nomeFuncionario}</TableCell>
                <TableCell>
                  <Badge className="bg-status-neutral-bg text-status-neutral-fg">{a.acao}</Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{a.detalhe ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
