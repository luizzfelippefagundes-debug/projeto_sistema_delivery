import FuncionariosManager from "@/components/FuncionariosManager";
import LinksAcessoCard from "@/components/LinksAcessoCard";
import { getFuncionarios } from "@/db/queries/funcionarios";
import { getRestaurantePorId } from "@/db/queries/restaurantes";
import { getTurnosAgrupadosPorFuncionario } from "@/db/queries/turnos";
import { requireFuncionarioAccess } from "@/lib/funcionarioAuth";
import { getOrigin } from "@/lib/origin";

export default async function FuncionariosPage() {
  const dono = await requireFuncionarioAccess("dono");
  const [funcionarios, turnosMapa, restaurante, origin] = await Promise.all([
    getFuncionarios(dono.restauranteId),
    getTurnosAgrupadosPorFuncionario(dono.restauranteId),
    getRestaurantePorId(dono.restauranteId),
    getOrigin(),
  ]);
  const turnosPorFuncionario = Object.fromEntries(turnosMapa);

  const links = [
    { label: "Atendente", url: `${origin}/entrar/atendente` },
    { label: "Cozinha", url: `${origin}/entrar/cozinha` },
    { label: "Motoboy", url: `${origin}/entrar/motoboy` },
    { label: "Cardápio digital (cliente)", url: `${origin}/loja/${restaurante?.slug ?? ""}` },
  ];

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-muted-foreground">
        Convide atendentes, cozinha e motoboys por e-mail. A conta deles se liga sozinha no primeiro login.
      </p>
      <LinksAcessoCard links={links} />
      <FuncionariosManager funcionarios={funcionarios} turnosPorFuncionario={turnosPorFuncionario} />
    </div>
  );
}
