import { SignOutButton } from "@clerk/nextjs";
import { Calendar, LogOut, Package, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getEntregasDoMotoboyDesde } from "@/db/queries/pedidos";
import { getRestaurantePorId } from "@/db/queries/restaurantes";
import { getTurnosPorFuncionario } from "@/db/queries/turnos";
import { inicioDoDia } from "@/lib/data";
import { requireFuncionarioAccess } from "@/lib/funcionarioAuth";
import { DIA_SEMANA_LABEL } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function MotoboyPerfilPage() {
  const funcionario = await requireFuncionarioAccess("motoboy");

  const [restaurante, entregasHoje, turnos] = await Promise.all([
    getRestaurantePorId(funcionario.restauranteId),
    getEntregasDoMotoboyDesde(funcionario.restauranteId, funcionario.id, inicioDoDia()),
    getTurnosPorFuncionario(funcionario.id),
  ]);

  const iniciais = funcionario.nome
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4">
      {/* Avatar + nome */}
      <Card>
        <CardContent className="flex items-center gap-4 px-5 py-5">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
            {iniciais}
          </div>
          <div>
            <p className="font-heading text-xl font-semibold">{funcionario.nome}</p>
            <p className="text-sm text-muted-foreground">
              Motoboy · {restaurante?.nome ?? "Restaurante"}
            </p>
            <span
              className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                funcionario.ativo
                  ? "bg-status-ok-bg text-status-ok-fg"
                  : "bg-status-danger-bg text-status-danger-fg"
              }`}
            >
              {funcionario.ativo ? "Ativo" : "Inativo"}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Stat do dia */}
      <Card>
        <CardContent className="flex items-center gap-4 px-5 py-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-status-neutral-bg text-status-neutral-fg">
            <Package className="size-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Entregas hoje</p>
            <p className="num font-heading text-2xl font-semibold">{entregasHoje.length}</p>
          </div>
        </CardContent>
      </Card>

      {/* Informações */}
      <Card>
        <CardContent className="flex flex-col gap-0 px-4 py-2">
          <div className="flex items-center gap-3 py-3 text-sm">
            <Phone className="size-4 shrink-0 text-muted-foreground" />
            <span className="text-muted-foreground">Telefone</span>
            <span className="ml-auto font-medium">
              {funcionario.telefone ?? "Não informado"}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Turnos */}
      {turnos.length > 0 && (
        <Card>
          <CardContent className="px-4 py-3">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Calendar className="size-3.5" />
              Meus turnos
            </div>
            <div className="flex flex-col gap-0">
              {turnos.map((t) => (
                <div key={t.id} className="flex items-center justify-between py-2 text-sm">
                  <span className="font-medium">{DIA_SEMANA_LABEL[t.diaSemana]}</span>
                  <span className="num text-muted-foreground">
                    {t.horaInicio} – {t.horaFim}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <SignOutButton>
        <Button variant="outline" className="w-full gap-2">
          <LogOut className="size-4" /> Sair da conta
        </Button>
      </SignOutButton>
    </div>
  );
}
