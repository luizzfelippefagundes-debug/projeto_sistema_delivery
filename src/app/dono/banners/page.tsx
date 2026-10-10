import BannersManager from "@/components/BannersManager";
import { getBannersAtivos } from "@/db/queries/banners";
import { requireFuncionarioAccess } from "@/lib/funcionarioAuth";

export const dynamic = "force-dynamic";

export default async function BannersPage() {
  const dono = await requireFuncionarioAccess("dono");
  const banners = await getBannersAtivos(dono.restauranteId);

  return <BannersManager banners={banners} />;
}
