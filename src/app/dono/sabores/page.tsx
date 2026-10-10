import SaboresClient from "@/components/SaboresClient";
import { getSaboresDoRestaurante } from "@/db/queries/cardapio";
import { requireFuncionarioAccess } from "@/lib/funcionarioAuth";

export const dynamic = "force-dynamic";

export default async function SaboresPage() {
  const dono = await requireFuncionarioAccess("dono");
  const sabores = await getSaboresDoRestaurante(dono.restauranteId);

  if (sabores.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhum sabor cadastrado ainda. Adicione itens com opções de escolha no cardápio.
      </p>
    );
  }

  return <SaboresClient sabores={sabores} />;
}
