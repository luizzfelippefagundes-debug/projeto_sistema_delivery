"use client";

import { XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

/** Botão de cancelar pedido, usado tanto no acompanhamento de delivery
 * quanto na comanda da mesa — recebe a ação certa de cada lugar via prop
 * pra não duplicar a lógica de confirmação/erro. */
export default function CancelarPedidoButton({
  aoConfirmar,
  compact = false,
}: {
  aoConfirmar: () => Promise<void>;
  compact?: boolean;
}) {
  const [aberto, setAberto] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function confirmar() {
    setErro(null);
    startTransition(async () => {
      try {
        await aoConfirmar();
        setAberto(false);
        router.refresh();
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Não deu pra cancelar esse pedido.");
      }
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="destructive"
        size={compact ? "sm" : "default"}
        className={compact ? "" : "w-full"}
        onClick={() => setAberto(true)}
      >
        <XCircle /> Cancelar pedido
      </Button>

      <AlertDialog
        open={aberto}
        onOpenChange={(v) => {
          setAberto(v);
          if (!v) setErro(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar esse pedido?</AlertDialogTitle>
            <AlertDialogDescription>
              O pedido some da cozinha e não vai ser preparado. Isso não pode ser desfeito.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {erro && <p className="text-sm text-destructive">{erro}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Voltar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" disabled={pending} onClick={confirmar}>
              {pending ? "Cancelando…" : "Sim, cancelar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
