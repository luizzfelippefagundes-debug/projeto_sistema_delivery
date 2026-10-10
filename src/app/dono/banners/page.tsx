import BannersManager from "@/components/BannersManager";
import { getBannersAtivos } from "@/db/queries/banners";
import { getItensCardapioAtivos } from "@/db/queries/cardapio";
import { requireFuncionarioAccess } from "@/lib/funcionarioAuth";

export const dynamic = "force-dynamic";

export default async function BannersPage() {
  const dono = await requireFuncionarioAccess("dono");
  const [banners, itens] = await Promise.all([
    getBannersAtivos(dono.restauranteId),
    getItensCardapioAtivos(dono.restauranteId),
  ]);

  return (
    <BannersManager
      banners={banners}
      itensCardapio={itens.map((i) => ({ id: i.id, nome: i.nome, preco: i.preco, categoria: i.categoria }))}
    />
  );
}
