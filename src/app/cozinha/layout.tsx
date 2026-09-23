import StaffTopbar from "@/components/StaffTopbar";
import { getRestaurantePorId } from "@/db/queries/restaurantes";
import { requireFuncionarioAccess } from "@/lib/funcionarioAuth";

export default async function CozinhaLayout({ children }: { children: React.ReactNode }) {
  const funcionario = await requireFuncionarioAccess("cozinha");
  const restaurante = await getRestaurantePorId(funcionario.restauranteId);
  const tambemAtende = funcionario.papel === "dono" || funcionario.acessosExtras.includes("atendente");
  return (
    <div className="flex min-h-screen flex-col">
      <StaffTopbar
        titulo={tambemAtende ? "Cozinha & Comanda" : "Cozinha"}
        nome={funcionario.nome}
        nomeRestaurante={restaurante?.nome ?? "Meu restaurante"}
      />
      <main className="flex-1 p-4 md:p-6">{children}</main>
    </div>
  );
}
