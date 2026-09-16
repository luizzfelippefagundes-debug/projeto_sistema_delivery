import FuncionariosManager from "@/components/FuncionariosManager";
import { getFuncionarios } from "@/db/queries/funcionarios";
import { getTurnosAgrupadosPorFuncionario } from "@/db/queries/turnos";
import { requireFuncionarioAccess } from "@/lib/funcionarioAuth";

export default async function FuncionariosPage() {
  const dono = await requireFuncionarioAccess("dono");
  const [funcionarios, turnosMapa] = await Promise.all([
    getFuncionarios(dono.restauranteId),
    getTurnosAgrupadosPorFuncionario(dono.restauranteId),
  ]);
  const turnosPorFuncionario = Object.fromEntries(turnosMapa);

  return (
    <div>
      <p className="mb-6 text-sm text-muted-foreground">
        Convide atendentes, cozinha e motoboys por e-mail. A conta deles se liga sozinha no primeiro login.
      </p>
      <FuncionariosManager funcionarios={funcionarios} turnosPorFuncionario={turnosPorFuncionario} />
    </div>
  );
}
