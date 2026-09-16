"use client";

import { useTransition } from "react";
import { fecharCaixaDoDia } from "@/actions/caixa.actions";
import { Button } from "@/components/ui/button";

export default function FecharCaixaButton() {
  const [pending, startTransition] = useTransition();

  return (
    <Button disabled={pending} onClick={() => startTransition(() => fecharCaixaDoDia())}>
      {pending ? "Fechando…" : "Fechar caixa do dia"}
    </Button>
  );
}
