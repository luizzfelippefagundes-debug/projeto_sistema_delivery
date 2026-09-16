import CardapioManager from "@/components/CardapioManager";
import { getCategorias, getItensCardapio } from "@/db/queries/cardapio";
import { requireFuncionarioAccess } from "@/lib/funcionarioAuth";

export default async function CardapioAdminPage() {
  const dono = await requireFuncionarioAccess("dono");
  const [itens, categorias] = await Promise.all([
    getItensCardapio(dono.restauranteId),
    getCategorias(dono.restauranteId),
  ]);

  return (
    <div>
      <p className="mb-6 text-sm text-muted-foreground">
        Adicione, edite preços e ative ou desative itens. O que estiver desativado some do cardápio que o cliente vê.
      </p>
      <CardapioManager itens={itens} categorias={categorias} />
    </div>
  );
}
