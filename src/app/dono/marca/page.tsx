import MarcaCard from "@/components/MarcaCard";
import { getRestaurantePorId } from "@/db/queries/restaurantes";
import { requireFuncionarioAccess } from "@/lib/funcionarioAuth";

export default async function MarcaPage() {
  const dono = await requireFuncionarioAccess("dono");
  const restaurante = await getRestaurantePorId(dono.restauranteId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-2xl font-semibold">Marca</h2>
        <p className="text-sm text-muted-foreground">Como o restaurante aparece pro cliente e no painel.</p>
      </div>
      <MarcaCard logoAtual={restaurante?.logoUrl ?? null} corAtual={restaurante?.corPrimaria ?? null} />
    </div>
  );
}
