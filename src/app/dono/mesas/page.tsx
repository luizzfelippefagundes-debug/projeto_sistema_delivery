import MesasQrCodes, { type QrDeMesa } from "@/components/MesasQrCodes";
import NumeroMesasCard from "@/components/NumeroMesasCard";
import { getConfiguracoes } from "@/db/queries/configuracoes";
import { getRestaurantePorId } from "@/db/queries/restaurantes";
import { requireFuncionarioAccess } from "@/lib/funcionarioAuth";
import { getOrigin } from "@/lib/origin";
import { gerarQrCodeDataUrl } from "@/lib/qrcode";

export const dynamic = "force-dynamic";

export default async function MesasPage() {
  const dono = await requireFuncionarioAccess("dono");
  const [restaurante, config, origin] = await Promise.all([
    getRestaurantePorId(dono.restauranteId),
    getConfiguracoes(dono.restauranteId),
    getOrigin(),
  ]);

  const numeroMesas = config?.numeroMesas ?? 8;
  const slug = restaurante?.slug ?? "";

  const qrs: QrDeMesa[] = await Promise.all(
    Array.from({ length: numeroMesas }, (_, i) => i + 1).map(async (mesa) => {
      const url = `${origin}/loja/${slug}/mesa/${mesa}`;
      return { mesa, url, dataUrl: await gerarQrCodeDataUrl(url) };
    }),
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-2xl font-semibold">Mesas</h2>
        <p className="text-sm text-muted-foreground">
          QR code por mesa pro cliente pedir direto pelo celular, sem precisar chamar ninguém.
        </p>
      </div>

      <NumeroMesasCard numeroAtual={numeroMesas} />
      <MesasQrCodes qrs={qrs} />
    </div>
  );
}
