import DonoSidebar from "@/components/DonoSidebar";
import { getRestaurantePorId } from "@/db/queries/restaurantes";
import { requireFuncionarioAccess } from "@/lib/funcionarioAuth";

export default async function DonoLayout({ children }: { children: React.ReactNode }) {
  const dono = await requireFuncionarioAccess("dono");
  const restaurante = await getRestaurantePorId(dono.restauranteId);
  return (
    <DonoSidebar nome={dono.nome} nomeRestaurante={restaurante?.nome ?? "Meu restaurante"}>
      {children}
    </DonoSidebar>
  );
}
