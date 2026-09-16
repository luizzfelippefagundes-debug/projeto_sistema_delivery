import StaffTopbar from "@/components/StaffTopbar";
import { getRestaurantePorId } from "@/db/queries/restaurantes";
import { requireFuncionarioAccess } from "@/lib/funcionarioAuth";

export default async function AtendenteLayout({ children }: { children: React.ReactNode }) {
  const funcionario = await requireFuncionarioAccess("atendente");
  const restaurante = await getRestaurantePorId(funcionario.restauranteId);
  return (
    <div className="flex min-h-screen flex-col">
      <StaffTopbar titulo="Comanda digital" nome={funcionario.nome} nomeRestaurante={restaurante?.nome ?? "Meu restaurante"} />
      <main className="flex-1 p-4 md:p-6">{children}</main>
    </div>
  );
}
