import { redirect } from "next/navigation";
import { getRestaurantePrincipal } from "@/db/queries/restaurantes";

export const dynamic = "force-dynamic";

export default async function RootPage() {
  const restaurante = await getRestaurantePrincipal();
  redirect(restaurante ? `/loja/${restaurante.slug}` : "/entrar");
}
