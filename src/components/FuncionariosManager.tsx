"use client";

import { Link2, MoreHorizontal, Plus, Settings2, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { alternarAtivoFuncionario, cancelarConvite } from "@/actions/funcionarios.actions";
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
import ConvidarFuncionarioSheet from "@/components/ConvidarFuncionarioSheet";
import GerenciarFuncionarioSheet from "@/components/GerenciarFuncionarioSheet";
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
import type { Funcionario, PapelFuncionario, Turno } from "@/lib/types";

const PAPEL_LABEL: Record<PapelFuncionario, string> = {
  dono: "Dona",
  atendente: "Atendente",
  cozinha: "Cozinha",
  motoboy: "Motoboy",
};

function ToggleAtivoFuncionario({ funcionario }: { funcionario: Funcionario }) {
  const [pending, startTransition] = useTransition();
  return (
    <DropdownMenuItem
      disabled={pending}
      onClick={() => startTransition(() => alternarAtivoFuncionario(funcionario.id, !funcionario.ativo))}
    >
      {funcionario.ativo ? "Desativar" : "Ativar"}
    </DropdownMenuItem>
  );
}

function CopiarLinkConvite({ papel }: { papel: PapelFuncionario }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <DropdownMenuItem
      onClick={async () => {
        const link = `${window.location.origin}/entrar/${papel}`;
        try {
          await navigator.clipboard.writeText(link);
          setCopiado(true);
          setTimeout(() => setCopiado(false), 1500);
        } catch {
          // clipboard indisponível, sem crash
        }
      }}
    >
      <Link2 /> {copiado ? "Link copiado!" : "Copiar link de acesso"}
    </DropdownMenuItem>
  );
}

export default function FuncionariosManager({
  funcionarios,
  turnosPorFuncionario,
}: {
  funcionarios: Funcionario[];
  turnosPorFuncionario: Record<string, Turno[]>;
}) {
  const [sheetAberto, setSheetAberto] = useState(false);
  const [cancelando, setCancelando] = useState<Funcionario | null>(null);
  const [gerenciando, setGerenciando] = useState<Funcionario | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-end">
        <Button onClick={() => setSheetAberto(true)}>
          <Plus /> Convidar funcionário
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:hidden">
        {funcionarios.map((f) => {
          const pendente = !f.clerkUserId;
          return (
            <div key={f.id} className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{f.nome}</p>
                  <p className="text-xs text-muted-foreground">{PAPEL_LABEL[f.papel]}</p>
                </div>
                {f.papel !== "dono" && (
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                      <MoreHorizontal />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {pendente && <CopiarLinkConvite papel={f.papel} />}
                      <DropdownMenuItem onClick={() => setGerenciando(f)}>
                        <Settings2 /> Gerenciar acesso
                      </DropdownMenuItem>
                      <ToggleAtivoFuncionario funcionario={f} />
                      {pendente && (
                        <DropdownMenuItem variant="destructive" onClick={() => setCancelando(f)}>
                          <Trash2 /> Cancelar convite
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              <p className="truncate text-sm text-muted-foreground">{f.emailConvite ?? "—"}</p>
              <div className="flex flex-wrap gap-1.5">
                <Badge className={f.ativo ? "bg-status-ok-bg text-status-ok-fg" : "bg-status-muted-bg text-status-muted-fg"}>
                  {f.ativo ? "Ativo" : "Inativo"}
                </Badge>
                {pendente && <Badge className="bg-status-warn-bg text-status-warn-fg">Convite pendente</Badge>}
                {f.acessosExtras.map((a) => (
                  <Badge key={a} className="bg-status-neutral-bg text-status-neutral-fg">
                    + {PAPEL_LABEL[a]}
                  </Badge>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="hidden overflow-x-auto rounded-xl border border-border sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Papel</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Permissões</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {funcionarios.map((f) => {
              const pendente = !f.clerkUserId;
              return (
                <TableRow key={f.id}>
                  <TableCell className="font-medium">{f.nome}</TableCell>
                  <TableCell>{PAPEL_LABEL[f.papel]}</TableCell>
                  <TableCell className="text-muted-foreground">{f.emailConvite ?? "—"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1.5">
                      {f.acessosExtras.map((a) => (
                        <Badge key={a} className="bg-status-neutral-bg text-status-neutral-fg">
                          + {PAPEL_LABEL[a]}
                        </Badge>
                      ))}
                      {f.papel !== "dono" && f.acessosExtras.length === 0 && (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge className={f.ativo ? "bg-status-ok-bg text-status-ok-fg" : "bg-status-muted-bg text-status-muted-fg"}>
                        {f.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                      {pendente && <Badge className="bg-status-warn-bg text-status-warn-fg">Convite pendente</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>
                    {f.papel !== "dono" && (
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                          <MoreHorizontal />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {pendente && <CopiarLinkConvite papel={f.papel} />}
                          <DropdownMenuItem onClick={() => setGerenciando(f)}>
                            <Settings2 /> Gerenciar acesso
                          </DropdownMenuItem>
                          <ToggleAtivoFuncionario funcionario={f} />
                          {pendente && (
                            <DropdownMenuItem variant="destructive" onClick={() => setCancelando(f)}>
                              <Trash2 /> Cancelar convite
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <ConvidarFuncionarioSheet open={sheetAberto} onOpenChange={setSheetAberto} />

      <GerenciarFuncionarioSheet
        funcionario={gerenciando}
        turnos={gerenciando ? (turnosPorFuncionario[gerenciando.id] ?? []) : []}
        onOpenChange={(v) => !v && setGerenciando(null)}
      />

      <AlertDialog open={!!cancelando} onOpenChange={(v) => !v && setCancelando(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar convite de {cancelando?.nome}?</AlertDialogTitle>
            <AlertDialogDescription>
              O convite pendente pra {cancelando?.emailConvite} é removido. Se quiser convidar essa pessoa de novo depois, precisa cadastrar outra vez.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              disabled={pending}
              onClick={() => {
                if (!cancelando) return;
                const id = cancelando.id;
                startTransition(async () => {
                  await cancelarConvite(id);
                  setCancelando(null);
                });
              }}
            >
              {pending ? "Cancelando…" : "Cancelar convite"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
