import MotoboyTabBar from "@/components/MotoboyTabBar";
import StaffTopbar from "@/components/StaffTopbar";
import { getRestaurantePorId } from "@/db/queries/restaurantes";
import { requireFuncionarioAccess } from "@/lib/funcionarioAuth";

export default async function MotoboyLayout({ children }: { children: React.ReactNode }) {
  const funcionario = await requireFuncionarioAccess("motoboy");
  const restaurante = await getRestaurantePorId(funcionario.restauranteId);
  return (
    <div className="flex min-h-screen flex-col">
      <StaffTopbar titulo="Painel do motoboy" nome={funcionario.nome} nomeRestaurante={restaurante?.nome ?? "Meu restaurante"} />
      <main className="flex-1 p-4 pb-24 md:p-6 md:pb-24">{children}</main>
      <MotoboyTabBar />
    </div>
  );
}
