import { Loader2 } from "lucide-react";

export default function CarregandoPedido() {
  return (
    <div role="status" aria-live="polite" className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background p-6 text-center">
      <Loader2 className="size-8 animate-spin text-primary" />
      <p className="font-semibold">Carregando seu pedido…</p>
    </div>
  );
}
