import AplicarCorMarca from "@/components/AplicarCorMarca";
import StaffTopbar from "@/components/StaffTopbar";
import { getRestaurantePorId } from "@/db/queries/restaurantes";
import { requireFuncionarioAccess } from "@/lib/funcionarioAuth";

export default async function AtendenteLayout({ children }: { children: React.ReactNode }) {
  const funcionario = await requireFuncionarioAccess("atendente");
  const restaurante = await getRestaurantePorId(funcionario.restauranteId);
  return (
    <div className="flex min-h-screen flex-col">
      <AplicarCorMarca cor={restaurante?.corPrimaria ?? null} />
      <StaffTopbar
        titulo="Comanda digital"
        nome={funcionario.nome}
        nomeRestaurante={restaurante?.nome ?? "Meu restaurante"}
        logoUrl={restaurante?.logoUrl ?? null}
        painelSwitcherSlug={funcionario.papel === "dono" ? restaurante?.slug : undefined}
      />
      <main className="flex-1 p-4 md:p-6">{children}</main>
    </div>
  );
}
